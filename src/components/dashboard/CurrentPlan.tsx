import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Circle, Calendar, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import type { PlanTask, Plan } from '../../types';

interface Task {
  id: string;
  content: string;
  is_completed: boolean;
  day_name: string;
}

const CurrentPlan: React.FC<{ userId: string }> = ({ userId }) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasksByDay, setTasksByDay] = useState<Record<string, PlanTask[]>>({});
  const [dayNames, setDayNames] = useState<string[]>([]);
  const [activeDay, setActiveDay] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePlan();
  }, [userId]);

  const fetchActivePlan = async () => {
    try {
      // 1. جلب الخطة النشطة
      const { data: planData, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !planData) {
        setLoading(false);
        return;
      }

      setPlan(planData);

      // 2. جلب المهام
      const { data: tasksData } = await supabase
        .from('plan_tasks')
        .select('*')
        .eq('plan_id', planData.id)
        .order('order_index', { ascending: true }); // ترتيب المهام

      if (tasksData) {
        // 3. تجميع المهام حسب اسم اليوم
        const grouped: Record<string, PlanTask[]> = {};
        const days: string[] = [];

        tasksData.forEach((task) => {
          const dayName = task.day_name || 'اليوم الأول'; // اسم افتراضي لو فاضي
          if (!grouped[dayName]) {
            grouped[dayName] = [];
            days.push(dayName); // نحفظ ترتيب الأيام كما ظهرت
          }
          grouped[dayName].push(task);
        });

        setTasksByDay(grouped);
        setDayNames(days);
        // نختار أول يوم كبداية افتراضية
        if (days.length > 0) setActiveDay(days[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean | null) => {
    // تحديث الواجهة فوراً (Optimistic Update)
    const updatedTasks = { ...tasksByDay };
    const taskIndex = updatedTasks[activeDay].findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    updatedTasks[activeDay][taskIndex].is_completed = !currentStatus;
    setTasksByDay(updatedTasks);

    // لو كل مهام اليوم خلصت -> احتفال!
    const allCompleted = updatedTasks[activeDay].every(t => t.is_completed);
    if (allCompleted && !currentStatus) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success(`عاش يا بطل! خلصت ${activeDay} بالكامل 💪`);
    }

    // تحديث قاعدة البيانات
    await supabase.from('plan_tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
  };

  if (loading) return <div className="py-10 text-center text-gray-400">جاري تحميل نظامك...</div>;

  if (!plan) return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center shadow-sm">
        <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
        <h3 className="text-xl font-bold text-gray-800">لا يوجد نظام نشط حالياً</h3>
        <p className="text-gray-500 mt-2">تواصل مع الكوتش لتجهيز خطتك الجديدة! 🔥</p>
    </div>
  );

  // حساب نسبة الإنجاز لليوم المختار
  const currentDayTasks = tasksByDay[activeDay] || [];
  const completedCount = currentDayTasks.filter(t => t.is_completed).length;
  const progress = currentDayTasks.length > 0 ? Math.round((completedCount / currentDayTasks.length) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      
      {/* هيدر الخطة */}
      <div className="bg-forest p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">{plan.title}</h2>
            <p className="text-white/80 text-sm flex items-center gap-2">
                <Calendar size={14} /> خطتك الحالية
            </p>
        </div>
        {/* خلفية جمالية */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange rounded-full blur-2xl opacity-50"></div>
      </div>

      {/* شريط الأيام (Tabs) */}
      <div className="flex overflow-x-auto p-2 gap-2 border-b border-gray-100 bg-gray-50/50 no-scrollbar">
        {dayNames.map((day) => (
            <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex-shrink-0
                    ${activeDay === day 
                        ? 'bg-orange text-white shadow-md transform scale-105' 
                        : 'bg-white text-gray-500 hover:bg-gray-200'
                    }
                `}
            >
                {day}
            </button>
        ))}
      </div>

      {/* محتوى اليوم */}
      <div className="p-6">
        <div className="flex justify-between items-end mb-4">
            <div>
                <h3 className="text-xl font-bold text-forest mb-1">{activeDay}</h3>
                <p className="text-xs text-gray-400">
                    {completedCount} من {currentDayTasks.length} مهام مكتملة
                </p>
            </div>
            {progress === 100 && <div className="text-orange animate-bounce"><Trophy size={24} /></div>}
        </div>

        {/* شريط التقدم */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
            <div 
                className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-orange'}`} 
                style={{ width: `${progress}%` }} 
            />
        </div>

        {/* قائمة المهام */}
        <div className="space-y-3">
            {currentDayTasks.map((task) => (
                <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id, task.is_completed)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group
                        ${task.is_completed 
                            ? 'bg-green-50 border-green-200 opacity-60' 
                            : 'bg-white border-gray-100 hover:border-orange hover:shadow-md'
                        }
                    `}
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors
                        ${task.is_completed ? 'text-green-600' : 'text-gray-300 group-hover:text-orange'}
                    `}>
                        {task.is_completed ? <CheckCircle size={24} className="fill-green-100" /> : <Circle size={24} />}
                    </div>
                    <span className={`text-sm font-medium transition-all ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.content}
                    </span>
                </div>
            ))}
            
            {currentDayTasks.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">لا توجد مهام مسجلة لهذا اليوم.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default CurrentPlan;