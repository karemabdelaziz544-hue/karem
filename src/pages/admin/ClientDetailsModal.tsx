import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    X, Calendar, Droplets, CheckCircle2, Circle, 
    MessageCircle, BrainCircuit, Loader2, ListTodo,
    Utensils, ClipboardList, ChefHat, Activity, AlertTriangle
} from 'lucide-react';

interface ClientDetailsModalProps {
  clientId: string | null;
  onClose: () => void;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ clientId, onClose }) => {
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getLocalDate());
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  
  const [smartPlan, setSmartPlan] = useState<any>(null); 
  const [adminTasks, setAdminTasks] = useState<any[]>([]); 
  const [log, setLog] = useState<any>(null); 
  const [taskNamesMap, setTaskNamesMap] = useState<Record<string, string>>({}); 
  const [debugMsg, setDebugMsg] = useState<string>("");

  useEffect(() => {
    if (clientId) {
      fetchClientName();
      fetchDailyDetails();
    }
  }, [clientId, date]);

  const fetchClientName = async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', clientId).single();
      if (data) setClientName(data.full_name);
  };

  const fetchDailyDetails = async () => {
    setLoading(true);
    setTaskNamesMap({});
    setAdminTasks([]); 
    setDebugMsg("");
    
    try {
      // 1. جلب الخطة الذكية (AI)
      const { data: aiPlan } = await supabase
        .from('daily_smart_plans')
        .select('*')
        .eq('user_id', clientId)
        .eq('date', date)
        .maybeSingle();
      setSmartPlan(aiPlan);

      // ---------------------------------------------------------
      // 2. جلب الخطة الأساسية (Admin Plan)
      // ---------------------------------------------------------
      
      const daysKeywords = ['حد', 'ثنين', 'ثلاثاء', 'ربعاء', 'خميس', 'جمعة', 'سبت'];
      const dateObj = new Date(date);
      const dayIndex = dateObj.getDay(); 
      const searchKeyword = daysKeywords[dayIndex]; 

      // 🔥 التعديل الجذري هنا 🔥
      // أزلنا .eq('status', 'active') نهائياً
      // نجلب أحدث خطة تم إنشاؤها للعميل بغض النظر عن حالة الاشتراك
      const { data: latestPlan } = await supabase
        .from('plans')
        .select('id, status, created_at, start_date')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false }) // هات آخر خطة
        .limit(1)
        .maybeSingle();

      let fetchedAdminTasks: any[] = [];
      let calculatedDayName = "";

      if (latestPlan) {
          // حساب رقم اليوم بناءً على تاريخ بداية الخطة
          const planStartStr = latestPlan.start_date || latestPlan.created_at;
          const planStartDate = new Date(planStartStr);
          const selectedDate = new Date(date);

          planStartDate.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);

          const diffTime = selectedDate.getTime() - planStartDate.getTime();
          const dayNumber = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

          if (dayNumber > 0) {
              if (dayNumber === 1) {
                  calculatedDayName = "اليوم الأول";
              } else {
                  calculatedDayName = `اليوم ${dayNumber}`;
              }

              // البحث في المهام
              const { data: staticTasks } = await supabase
                .from('plan_tasks')
                .select('id, content, task_type, day_name')
                .eq('plan_id', latestPlan.id)
                .ilike('day_name', `%${calculatedDayName}%`); 
              
              if (staticTasks && staticTasks.length > 0) {
                  fetchedAdminTasks = staticTasks;
                  setAdminTasks(staticTasks);
              } else {
                  setDebugMsg(`تم العثور على الخطة، ولكن لم يتم العثور على مهام مسجلة تحت اسم "${calculatedDayName}"`);
              }
          } else {
              setDebugMsg("التاريخ المختار يسبق تاريخ بداية الخطة المسجلة.");
          }
      } else {
          setDebugMsg("لم يتم العثور على أي خطة (plan) مسجلة لهذا الحساب الفرعي.");
      }

      // 3. جلب اللوج
      const { data: logData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', clientId)
        .eq('date', date)
        .maybeSingle();
      setLog(logData);

      // 4. بناء القاموس
      const tempMap: Record<string, string> = {};

      fetchedAdminTasks.forEach(t => tempMap[t.id] = t.content);

      if (aiPlan?.generated_tasks) {
          const allIds = logData?.completed_tasks || [];
          const aiIds = allIds.filter((id: string) => id.startsWith('ai_'));
          aiIds.forEach((id: string) => {
              const index = parseInt(id.split('_')[1]);
              const task = aiPlan.generated_tasks[index];
              if (task) tempMap[id] = task.title || task.meal_name || "مهمة ذكية";
          });
      }
      
      if (logData?.completed_tasks) {
          const completedIds = logData.completed_tasks as string[];
          const missingIds = completedIds.filter(id => !tempMap[id] && !id.startsWith('ai_'));
          if (missingIds.length > 0) {
              const { data: missingTasks } = await supabase.from('plan_tasks').select('id, content').in('id', missingIds);
              if (missingTasks) missingTasks.forEach(t => tempMap[t.id] = t.content);
          }
      }

      setTaskNamesMap(tempMap);

    } catch (error) {
      console.error("Critical Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) return null;

  const aiTasks = smartPlan?.generated_tasks?.filter((t: any) => t.type !== 'METADATA_PACK') || [];
  const dayNameDisplay = new Date(date).toLocaleDateString('ar-EG', { weekday: 'long' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-800">تفاصيل يوم: {clientName}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs bg-forest/10 px-2 py-0.5 rounded text-forest font-bold">
                       {dayNameDisplay}
                   </span>
                </div>
            </div>
            <button onClick={onClose} className="bg-white p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">
                <X size={20} />
            </button>
        </div>

        {/* Date Picker */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white shadow-sm z-10">
            <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                <Calendar size={16} className="text-forest"/> التاريخ:
            </label>
            <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-700 outline-none focus:border-forest"
            />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50" dir="rtl">
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="animate-spin mb-2 text-forest" size={32} />
                    <p>جاري استدعاء البيانات...</p>
                </div>
            ) : (
                <>
                    {/* AI Message */}
                    {smartPlan?.morning_message ? (
                        <div className="bg-gradient-to-br from-forest/10 to-green-50 p-5 rounded-2xl border border-forest/10 relative overflow-hidden shadow-sm">
                            <BrainCircuit className="absolute top-2 left-2 text-forest/20" size={60} />
                            <h3 className="text-forest font-bold mb-3 flex items-center gap-2 text-lg">
                                <MessageCircle size={20}/> رسالة الكابتن (AI)
                            </h3>
                            <p className="text-gray-800 font-medium leading-relaxed relative z-10 bg-white/60 p-3 rounded-xl border border-white/50">
                                "{smartPlan.morning_message}"
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500">
                             <MessageCircle size={20} className="opacity-50"/>
                             <p className="font-bold text-sm">لا توجد رسالة AI لهذا اليوم</p>
                        </div>
                    )}

                    {/* Water */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Droplets className="text-blue-500" size={20}/> المياه
                            </h3>
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold dir-ltr">
                                {log?.water_intake || 0} / {smartPlan?.generated_tasks?.find((t:any) => t.type === 'METADATA_PACK')?.water_goal || 3000} ml
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div 
                                className="bg-blue-500 h-full rounded-full transition-all duration-500 relative"
                                style={{ width: `${Math.min(((log?.water_intake || 0) / 3000) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        
                        {/* Admin Plan */}
                        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm ring-1 ring-blue-50">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                                        <ClipboardList className="text-blue-600" size={20}/> الخطة الأساسية (من الأدمن)
                                    </h3>
                                    <p className="text-[10px] text-gray-400 mt-0.5 mr-7">
                                        {adminTasks.length > 0 
                                            ? "هذه المهام مسحوبة من الجدول بناءً على ترتيب الأيام" 
                                            : "جاري البحث عن المهام..."}
                                    </p>
                                </div>
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold border border-blue-100">
                                    {adminTasks.length} مهام
                                </span>
                            </div>

                            <div className="space-y-2">
                                {adminTasks.length > 0 ? (
                                    adminTasks.map((task: any, idx: number) => {
                                        const isCompleted = log?.completed_tasks?.includes(task.id);
                                        return (
                                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors
                                                ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50/50 border-blue-100/50 hover:bg-blue-50'}
                                            `}>
                                                <div className={`p-1.5 rounded-lg shadow-sm mt-0.5 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-white text-blue-500'}`}>
                                                    {isCompleted ? <CheckCircle2 size={16}/> : (task.task_type === 'workout' ? <Activity size={16}/> : <Utensils size={16}/>)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-sm leading-relaxed ${isCompleted ? 'text-green-800 line-through opacity-70' : 'text-gray-800'}`}>
                                                        {task.content}
                                                    </p>
                                                    <span className={`text-[10px] font-bold px-1.5 rounded border mt-1 inline-block
                                                        ${isCompleted ? 'text-green-600 border-green-200 bg-white' : 'text-blue-400 border-blue-100 bg-white'}
                                                    `}>
                                                        {task.task_type === 'workout' ? 'تمرين' : 'وجبة'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                        <ChefHat className="mx-auto mb-2 opacity-20" size={24}/>
                                        <p className="text-xs">لا توجد مهام مسجلة لهذا اليوم</p>
                                        {debugMsg && (
                                            <div className="mt-2 text-[10px] bg-red-50 text-red-500 p-2 rounded flex items-center justify-center gap-1">
                                                <AlertTriangle size={12} /> {debugMsg}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* AI Tasks */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                                    <ListTodo className="text-orange" size={18}/> إضافات الـ AI
                                </h3>
                                <div className="space-y-2">
                                    {aiTasks.length > 0 ? (
                                        aiTasks.map((task: any, idx: number) => (
                                            <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-orange/5 border border-orange/10">
                                                <Circle size={14} className="mt-1 text-orange shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-700 text-xs">{task.title || task.meal_name}</p>
                                                    {task.desc && <p className="text-[10px] text-gray-500">{task.desc}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 text-center py-4">لا توجد إضافات ذكية</p>
                                    )}
                                </div>
                            </div>

                            {/* Completed Log */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="text-green-600" size={18}/> سجل الإنجاز الكامل
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {log?.completed_tasks && log.completed_tasks.length > 0 ? (
                                        log.completed_tasks.map((taskId: string, idx: number) => {
                                            const taskName = taskNamesMap[taskId] || "مهمة (اسم غير متوفر)";
                                            return (
                                                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100">
                                                    <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                                                    <span className="font-bold text-green-800 text-xs leading-relaxed">
                                                        {taskName}
                                                    </span>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-4 text-gray-400 text-xs border border-dashed rounded-lg">
                                            لم يسجل أي إنجاز 💤
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;