import React, { useEffect, useState, useCallback } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useNavigate } from 'react-router-dom';
import { 
    Calendar, CheckCircle2, Circle, Crown, 
    Dumbbell, RefreshCw, Utensils, Zap, ChevronLeft, Layout
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import { Database } from '../types/supabase';

type Plan = Database['public']['Tables']['plans']['Row'];
type PlanTask = Database['public']['Tables']['plan_tasks']['Row'];

const Dashboard: React.FC = () => {
  const { currentProfile, loading: profileLoading } = useFamily();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const isSubscribed = currentProfile?.subscription_status === 'active';

  const fetchDashboardData = useCallback(async () => {
    if (!currentProfile?.id || !isSubscribed) return;
    setLoadingData(true);
    
    try {
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', currentProfile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData) {
        setPlan(planData);
        const { data: allTasks } = await supabase
          .from('plan_tasks')
          .select('*')
          .eq('plan_id', planData.id)
          .order('order_index', { ascending: true });

        if (allTasks && allTasks.length > 0) {
          const startDate = new Date(planData.start_date || planData.created_at);
          const today = new Date();
          startDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const currentDayNum = Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1;

          const filtered = allTasks.filter(t => {
            const name = t.day_name || "";
            if (currentDayNum === 1) return name.includes("الأول") || name.includes("1");
            return name.includes(String(currentDayNum));
          });
          setTasks(filtered);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [currentProfile?.id, isSubscribed]);

  const toggleTask = async (taskId: string, currentStatus: boolean | null) => {
    const newStatus = !currentStatus;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: newStatus } : t));
    try {
      const { error } = await supabase.from('plan_tasks').update({ is_completed: newStatus }).eq('id', taskId);
      if (error) throw error;
      toast.success(newStatus ? "عاش يا بطل! استمر ✅" : "تم التراجع");
    } catch (err) {
      fetchDashboardData();
    }
  };

  useEffect(() => {
    if (!profileLoading && isSubscribed) fetchDashboardData();
  }, [profileLoading, isSubscribed, fetchDashboardData]);

  const completedCount = tasks.filter(t => t.is_completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (profileLoading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-tajawal px-4 sm:px-6" dir="rtl">
      
      {/* Header - ألوان الهوية مع خلفية بيضاء */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6">
        <div className="flex items-center gap-5 w-full sm:w-auto">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-forest flex items-center justify-center text-2xl shadow-xl shadow-forest/20">
              <span className="text-white">🦁</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange rounded-full border-4 border-gray-50 flex items-center justify-center">
              <Zap size={10} className="text-white fill-current" />
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">أهلاً بك، {currentProfile?.full_name?.split(' ')[0]}!</h1>
            <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-forest animate-pulse"></div>
               أنت الآن تتابع {tasks[0]?.day_name || 'يوم جديد'}
            </p>
          </div>
        </div>
        <button 
          onClick={fetchDashboardData} 
          className="p-4 bg-white hover:bg-slate-50 text-slate-400 hover:text-forest rounded-2xl transition-all shadow-sm border border-slate-100 active:scale-90 group"
        >
          <RefreshCw size={22} className={`${loadingData ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {isSubscribed ? (
        <div className="space-y-10">
          
          {/* Progress Card - العودة لـ Forest Green */}
          <div className="bg-forest rounded-[3rem] p-8 shadow-2xl shadow-forest/20 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <p className="text-white/60 text-xs font-black uppercase tracking-[0.2em]">الإنجاز اليومي</p>
                  <h2 className="text-3xl font-black text-white italic">تقدمك اليوم</h2>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-white drop-shadow-lg">{progress}%</span>
                </div>
              </div>
              
              {/* Progress Bar باللون البرتقالي للبروز */}
              <div className="relative h-4 w-full bg-white/20 rounded-full mt-8 overflow-hidden">
                <div 
                  className="absolute top-0 right-0 h-full bg-orange rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between mt-4">
                <p className="text-[10px] font-bold text-white/60 italic">النظام الحالي: {plan?.title}</p>
                <p className="text-[10px] font-bold text-white/60">{completedCount} من {tasks.length} مهام</p>
              </div>
            </div>
            
            {/* الديكور الخلفي للهوية */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange rounded-full blur-[80px]"></div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-6 bg-orange rounded-full shadow-sm shadow-orange/40"></div>
              <h3 className="font-black text-xl text-slate-800 italic">جدول المهام</h3>
            </div>
            
            {loadingData ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[2.5rem] animate-pulse" />)}
              </div>
            ) : tasks.length > 0 ? (
              <div className="grid gap-5">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id, task.is_completed)}
                    className={`group relative bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-lg ${task.is_completed ? 'border-forest/30 bg-forest/5' : 'border-slate-50'}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${task.is_completed ? 'bg-forest text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-forest/10 group-hover:text-forest'}`}>
                        {task.task_type === 'workout' ? <Dumbbell size={28} /> : <Utensils size={28} />}
                      </div>
                      <div className="text-right">
                        <h4 className={`text-lg font-black transition-all ${task.is_completed ? 'text-forest/40 line-through' : 'text-slate-800'}`}>
                          {task.content}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${task.is_completed ? 'bg-forest/10 text-forest' : 'bg-slate-100 text-slate-400'}`}>
                             {task.task_type === 'workout' ? 'تمرين' : 'تغذية'}
                           </span>
                           {task.is_completed && <span className="text-[10px] font-bold text-forest italic">تم بنجاح! ✅</span>}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      {task.is_completed ? (
                        <div className="w-10 h-10 bg-forest rounded-full flex items-center justify-center shadow-lg shadow-forest/20 animate-in zoom-in duration-300">
                          <CheckCircle2 className="text-white" size={24} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-forest transition-colors">
                          <Circle className="text-slate-100 group-hover:text-forest/30" size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[3.5rem] text-center border-2 border-dashed border-slate-100">
                <Layout size={32} className="text-slate-200 mx-auto mb-4" />
                <h4 className="text-xl font-black text-slate-300">لا يوجد مهام اليوم</h4>
                <p className="text-sm text-slate-400 mt-2 font-bold italic">استرح قليلاً، غداً نواصل العمل.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-[3.5rem] border border-slate-100 shadow-2xl relative overflow-hidden">
           <Crown size={60} className="mx-auto text-orange mb-6 drop-shadow-xl animate-bounce" />
           <h2 className="text-3xl font-black text-slate-800">الاشتراك متوقف</h2>
           <p className="text-slate-400 mt-4 font-bold text-sm max-w-xs mx-auto leading-relaxed">تواصل مع الإدارة لتفعيل خطتك المخصصة.</p>
           <button 
             onClick={() => navigate('/dashboard/subscriptions')} 
             className="mt-10 w-full bg-orange text-white py-5 rounded-3xl font-black shadow-xl shadow-orange/20 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             تفعيل العضوية <ChevronLeft size={20} />
           </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;