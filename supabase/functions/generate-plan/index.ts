import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const cleanText = (text: string) => (text ? text.trim().toLowerCase() : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !groqApiKey) {
      throw new Error("Missing required environment variables");
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body?.action;
    const userId = body?.userId;

    if (!action || !userId) {
      throw new Error("Missing action or userId");
    }

    if (action === "generateDailyPlan") {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
      const { data: inbody } = await supabase
        .from("inbody_records")
        .select("*")
        .eq("user_id", userId)
        .order("record_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: activePlan } = await supabase
        .from("plans")
        .select("id, start_date, created_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activePlan) {
        return new Response(JSON.stringify({ data: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: allTasks } = await supabase
        .from("plan_tasks")
        .select("*")
        .eq("plan_id", activePlan.id)
        .order("order_index", { ascending: true });

      if (!allTasks || allTasks.length === 0) {
        return new Response(JSON.stringify({ data: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const daysArabic = ["الاحد", "الاثنين", "الثلاثاء", "الاربعاء", "الخميس", "الجمعة", "السبت"];
      const todayIndex = new Date().getDay();
      const todayNameAr = daysArabic[todayIndex];

      let targetTasks = allTasks.filter((task: any) => cleanText(task.day_name).includes(cleanText(todayNameAr)));

      if (targetTasks.length === 0) {
        const uniqueDayNames = Array.from(new Set(allTasks.map((task: any) => task.day_name?.trim()))).filter(Boolean) as string[];
        const startDateStr = activePlan.start_date || activePlan.created_at;
        const diffTime = Math.abs(new Date().getTime() - new Date(startDateStr).getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const targetDayName = uniqueDayNames[diffDays % uniqueDayNames.length];
        targetTasks = allTasks.filter((task: any) => cleanText(task.day_name) === cleanText(targetDayName));
      }

      if (targetTasks.length === 0 && allTasks.length > 0) {
        targetTasks = allTasks.filter((task: any) => task.day_name === allTasks[0].day_name);
      }

      let mealsList = targetTasks
        .filter((task: any) => !cleanText(task.task_type).includes("workout") && !cleanText(task.task_type).includes("تمرين"))
        .map((task: any) => task.content);

      if (mealsList.length === 0) {
        mealsList = ["وجبات صحية متوازنة"];
      }

      const weight = inbody?.weight || profile?.weight || 70;
      const clientName = profile?.full_name?.split(" ")[0] || "يا بطل";

      const prompt = `
        Act as Dr. Healix (Egyptian Nutritionist). Client: ${clientName}, Weight: ${weight}kg.
        MEALS: ${JSON.stringify(mealsList)}
        
        OUTPUT JSON ONLY:
        {
          "message": "رسالة تشجيعية باللهجة المصرية تذكر أكلة من الجدول",
          "water_goal": ${Math.round(weight * 35)},
          "suggestions": [
            { "title": "...", "desc": "...", "time": "...", "type": "activity/herb" }
          ],
          "meal_insights": [
            { "meal_name": "COPY_EXACT_NAME", "benefit": "فائدة علمية قوية" }
          ]
        }
      `;

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          response_format: { type: "json_object" },
        }),
      });

      const groqJson = await groqResponse.json();
      const result = JSON.parse(groqJson.choices[0].message.content);

      const today = new Date().toISOString().split("T")[0];
      const tasksToSave = [
        ...(result.suggestions || []),
        {
          type: "METADATA_PACK",
          insights: result.meal_insights || [],
          water: result.water_goal || 3000,
          water_goal: result.water_goal,
        },
      ];

      await supabase.from("daily_smart_plans").upsert(
        {
          user_id: userId,
          date: today,
          morning_message: result.message,
          focus_mode: "تحليل ذكي",
          generated_tasks: tasksToSave,
        },
        { onConflict: "user_id, date" }
      );

      await supabase.from("daily_logs").upsert({ user_id: userId, date: today }, { onConflict: "user_id, date" });

      return new Response(
        JSON.stringify({
          data: {
            morning_message: result.message,
            generated_tasks: tasksToSave,
            water_goal: result.water_goal,
            meal_insights: result.meal_insights,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getPanicAdvice") {
      const cheatedMeals = Array.isArray(body?.cheatedMeals) ? body.cheatedMeals : [];
      const { data: profile } = await supabase.from("profiles").select("weight").eq("id", userId).single();
      const weight = profile?.weight || 70;
      const mealsStr = cheatedMeals.length > 0 ? cheatedMeals.join(" و ") : "كل الوجبات";

      const prompt = `
        أنت الدكتور "هيليكس" (لهجة مصرية). العميل "لخبط في الأكل" في: (${mealsStr}).
        وزنه: ${weight}kg.
        المطلوب: "خطة إنقاذ" فورية (JSON).
        1. message: رسالة طمأنة ذكية.
        2. steps: 3 خطوات عملية.
        Output JSON: { "message": "...", "steps": ["...", "..."] }
      `;

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      const groqJson = await groqResponse.json();
      const result = JSON.parse(groqJson.choices[0].message.content);

      return new Response(JSON.stringify({ data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unsupported action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
