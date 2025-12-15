import { supabase } from './supabase';

const getGroqKey = async () => {
  const { data, error } = await supabase.from('app_secrets').select('key_value').eq('key_name', 'GROQ_API_KEY').single();
  if (error || !data) return null;
  return data.key_value;
};

export const generateDailyPlan = async (userId: string) => {
  try {
    console.log("🚀 STARTING GENERATOR FOR:", userId);

    // 1. البيانات الشخصية
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: inbody } = await supabase.from('inbody_records').select('*').eq('user_id', userId).order('record_date', { ascending: false }).limit(1).single();
    const { data: latestDoc } = await supabase.from('client_documents').select('file_name').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();

    // 2. جلب الخطة النشطة
    const { data: activePlan } = await supabase.from('plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();

    let dietTasks: any[] = [];
    if (activePlan) {
        console.log("✅ Found Active Plan ID:", activePlan.id);
        const { data: tasks } = await supabase.from('plan_tasks').select('*').eq('plan_id', activePlan.id);
        dietTasks = tasks || [];
        console.log("🍎 Diet Tasks Found (Count):", dietTasks.length);
    }

    // 3. تجهيز النصوص
    const weight = inbody?.weight || profile.weight || 70;
    const gender = profile.gender === 'male' ? 'ذكر' : 'أنثى';
    
    let dietPrompt = "لا يوجد نظام غذائي مسجل. اقترح وجبات صحية.";
    if (dietTasks.length > 0) {
        dietPrompt = `
        🔴 تعليمات صارمة جداً: العميل لديه نظام غذائي مخصص.
        يجب نقل هذه الوجبات كما هي حرفياً إلى جدول الـ tasks:
        ${dietTasks.map((t: any, i: number) => `${i+1}. ${t.title} (${t.description || ''}) - الموعد: ${t.time_slot || 'مناسب'}`).join('\n')}
        * اجعل نوع هذه التاسكات (type: 'food').
        `;
    }

    // 4. بناء الـ Prompt
    const prompt = `
      أنت دكتور "هيليكس"، مساعد ذكي.
      العميل: ${profile.full_name} (${gender})، الوزن: ${weight}kg.
      ${latestDoc ? `تحليل سابق: ${latestDoc.file_name}` : ''}
      ${dietPrompt}
      المطلوب (JSON Only):
      1. الوجبات: انقل وجبات الطبيب.
      2. الإضافات: أضف (مياه، مشي، نوم).
      3. الرسالة: رسالة تشجيعية.
      Format: { "message": "...", "focus": "...", "tasks": [...] }
    `;

    // 5. استدعاء API
    const apiKey = await getGroqKey();
    if (!apiKey) throw new Error("API Key Missing");

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const json = await response.json();
    if (json.error) throw new Error(json.error.message);
    const planData = JSON.parse(json.choices[0].message.content);
    console.log("✅ Generated Data:", planData);

    // 6. الحفظ (مع معالجة خطأ التكرار 409)
    const { error: insertError } = await supabase.from('daily_smart_plans').insert({
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      morning_message: planData.message,
      generated_tasks: planData.tasks,
      focus_mode: planData.focus
    });

    // 👇 التعديل الهام هنا: لو الخطأ بسبب التكرار، نتجاهله ولا نعتبره فشل
    if (insertError) {
        if (insertError.code === '23505') {
            console.log("ℹ️ Plan already saved by another request (Concurrency handled).");
        } else {
            throw insertError; // لو خطأ تاني غير التكرار، ارميه
        }
    }

    // الحفظ في Logs (مع تجاهل التكرار أيضاً)
    const { error: logError } = await supabase.from('daily_logs').insert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0]
    });
    
    if (logError && logError.code !== '23505') console.warn("Log warning:", logError.message);

    return planData;

  } catch (error: any) {
    console.error("🚨 Generator Error:", error.message);
    return null; 
  }
};