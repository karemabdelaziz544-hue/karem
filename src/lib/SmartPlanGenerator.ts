import { supabase } from './supabase';

const getGroqKey = async () => {
  const { data, error } = await supabase.from('app_secrets').select('key_value').eq('key_name', 'GROQ_API_KEY').single();
  if (error || !data) return null;
  return data.key_value;
};

const cleanText = (text: string) => text ? text.trim().toLowerCase() : '';

export const generateDailyPlan = async (userId: string) => {
  try {
    console.log(`🚀 AI DOCTOR: STARTING ANALYSIS FOR USER: ${userId}`);

    // 1. Data Fetching
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: inbody } = await supabase.from('inbody_records').select('*').eq('user_id', userId).order('record_date', { ascending: false }).limit(1).maybeSingle();
    const { data: activePlan } = await supabase.from('plans').select('id, start_date, created_at').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!activePlan) return null;

    const { data: allTasks } = await supabase.from('plan_tasks').select('*').eq('plan_id', activePlan.id).order('order_index', { ascending: true });

    if (!allTasks || allTasks.length === 0) return null;

    // 2. Identify Today's Context
    const daysArabic = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayIndex = new Date().getDay();
    const todayNameAr = daysArabic[todayIndex];

    let targetTasks = allTasks.filter((t: any) => cleanText(t.day_name).includes(cleanText(todayNameAr)));

    if (targetTasks.length === 0) {
        const uniqueDayNames = Array.from(new Set(allTasks.map((t: any) => t.day_name?.trim()))).filter(Boolean) as string[];
        const startDateStr = activePlan.start_date || activePlan.created_at;
        const diffTime = Math.abs(new Date().getTime() - new Date(startDateStr).getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        const targetDayName = uniqueDayNames[diffDays % uniqueDayNames.length];
        targetTasks = allTasks.filter((t: any) => cleanText(t.day_name) === cleanText(targetDayName));
    }
    
    if (targetTasks.length === 0 && allTasks.length > 0) {
        targetTasks = allTasks.filter((t: any) => t.day_name === allTasks[0].day_name);
    }

    // 3. Extract Meals
    let mealsList = targetTasks
        .filter((t: any) => !cleanText(t.task_type).includes('workout') && !cleanText(t.task_type).includes('تمرين'))
        .map((t: any) => t.content);

    if (mealsList.length === 0) mealsList = ["وجبات صحية متوازنة"];

    const weight = inbody?.weight || profile?.weight || 70;
    const clientName = profile?.full_name?.split(' ')[0] || "يا بطل";
    
    // 4. THE PROMPT
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

    const apiKey = await getGroqKey();
    let result: any = null;

    if (apiKey) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.6,
                    response_format: { type: "json_object" }
                })
            });
            const json = await response.json();
            result = JSON.parse(json.choices[0].message.content);
        } catch (e) { console.error("AI Error:", e); }
    }

    if (!result) return null;

    // 5. Save Logic (Updated for Robustness)
    const today = new Date().toISOString().split('T')[0];
    const tasksToSave = [
        ...(result.suggestions || []), 
        { 
            type: 'METADATA_PACK', 
            insights: result.meal_insights || [], 
            water: result.water_goal || 3000,
            water_goal: result.water_goal 
        } 
    ];
    
    // 🔥 محاولة الحفظ مع طباعة الخطأ لو حصل
    const { error: saveError } = await supabase.from('daily_smart_plans').upsert({
      user_id: userId, // هذا هو الـ ID بتاع الابن أو الأب
      date: today,
      morning_message: result.message,
      focus_mode: "تحليل ذكي",
      generated_tasks: tasksToSave 
    }, { onConflict: 'user_id, date' });

    if (saveError) {
        console.error("❌ FAILED TO SAVE PLAN:", saveError);
        // هنا المشكلة: لو ظهر الخطأ ده في الكونسول يبقى لازم نطبق حل الـ SQL تحت
    } else {
        console.log("✅ PLAN SAVED SUCCESSFULLY for:", userId);
    }

    // تسجيل في الـ logs
    await supabase.from('daily_logs').upsert({ user_id: userId, date: today }, { onConflict: 'user_id, date' });

    return { 
        morning_message: result.message,
        generated_tasks: tasksToSave,
        water_goal: result.water_goal,
        meal_insights: result.meal_insights
    };

  } catch (error: any) {
    console.error("Generator Error:", error.message);
    return null;
  }
};

export const getPanicAdvice = async (userId: string, cheatedMeals: string[]) => {
    // ... (باقي الكود كما هو للكود القديم)
     try {
        const apiKey = await getGroqKey();
        if (!apiKey) return null;
        const { data: profile } = await supabase.from('profiles').select('weight').eq('id', userId).single();
        const weight = profile?.weight || 70;
        const mealsStr = cheatedMeals.length > 0 ? cheatedMeals.join(' و ') : "كل الوجبات";
        const prompt = `
            أنت الدكتور "هيليكس" (لهجة مصرية). العميل "لخبط في الأكل" في: (${mealsStr}).
            وزنه: ${weight}kg.
            المطلوب: "خطة إنقاذ" فورية (JSON).
            1. message: رسالة طمأنة ذكية.
            2. steps: 3 خطوات عملية.
            Output JSON: { "message": "...", "steps": ["...", "..."] }
        `;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.7, response_format: { type: "json_object" } })
        });
        const json = await response.json();
        return JSON.parse(json.choices[0].message.content);
    } catch (e) { return null; }
};