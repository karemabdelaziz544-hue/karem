import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { CheckCircle, Circle, Calendar, Trophy, ChevronLeft, ChevronRight, Target, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      setProfile(profileData);

      const { data: plansData } = await supabase
        .from('plans')
        .select(`*, plan_tasks (*)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (plansData && plansData.length > 0) {
        setPlan(plansData[0]);
        // ترتيب المهام لضمان ثباتها
        const sortedTasks = plansData[0].plan_tasks.sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
        setTasks(sortedTasks);
        
        // تحديد اليوم الحالي تلقائياً (أول يوم فيه مهام غير مكتملة)
        const days = [...new Set(sortedTasks.map((t: any) => t.day_number))].sort((a: any, b: any) => Number(a) - Number(b));
        
        let foundActive = false;
        for (let day of days) {
          const dayTasks = sortedTasks.filter((t: any) => t.day_number === day);
          const isDayComplete = dayTasks.every((t: any) => t.is_completed);
          if (!isDayComplete) {
            setActiveDay(day as number);
            foundActive = true;
            break;
          }
        }
        // لو كله خلص، هات آخر يوم، ولو مفيش غير يوم واحد خليه هو النشط
        if (!foundActive && days.length > 0) setActiveDay(days[days.length - 1] as number);
        else if (days.length > 0) setActiveDay(days[0] as number);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t);
    setTasks(newTasks);
    await supabase.from('plan_tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
  };

  // --- الحسابات ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentDayTasks = tasks.filter(t => t.day_number === activeDay);
  const dayTotal = currentDayTasks.length;
  const dayCompleted = currentDayTasks.filter(t => t.is_completed).length;
  const dayProgress = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
  
  const totalDays = tasks.length > 0 ? Math.max(...tasks.map(t => t.day_number)) : 1;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cream text-forest font-bold">جاري تحميل بياناتك...</div>;

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8 font-sans" dir="rtl">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-3xl shadow-sm border border-sage/30">
        <div className="flex items-center gap-3">
           <div className="bg-forest p-1.5 rounded-xl"><Logo className="h-8 w-8" /></div>
           <span className="font-bold text-forest hidden md:block">لوحة المشترك</span>
        </div>
        <Button variant="outline" onClick={handleLogout} className="text-sm py-2 px-4 text-red-500 border-red-100 hover:bg-red-50">خروج</Button>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* كارت الترحيب + التقدم العام */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-sage/50 relative overflow-hidden">
           <div className="absolute bottom-0 left-0 h-1.5 bg-gray-100 w-full">
             <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${totalProgress}%` }} />
           </div>

           <div className="flex justify-between items-center mt-2">
             <div>
               <h1 className="text-2xl font-extrabold text-forest mb-1">أهلاً، {profile?.full_name?.split(' ')[0] || 'بطل'} 👋</h1>
               <p className="text-gray-500 text-xs md:text-sm">إجمالي إنجاز الخطة: <span className="text-green-600 font-bold">{totalProgress}%</span></p>
             </div>
             <div className="text-center bg-cream p-2 rounded-xl border border-orange/10">
                <Trophy size={24} className={`mb-1 mx-auto ${totalProgress === 100 ? 'text-yellow-500 animate-bounce' : 'text-gray-300'}`} />
                <span className="text-[10px] text-gray-400 font-bold block">الهدف</span>
             </div>
           </div>
        </div>

        {plan ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* شريط التنقل بين الأيام */}
            <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
              <button disabled={activeDay === 1} onClick={() => setActiveDay(d => d - 1)} className="p-2 text-forest disabled:opacity-30 hover:bg-gray-50 rounded-full transition-colors"><ChevronRight /></button>
              
              <div className="text-center">
                <div className="font-bold text-forest flex items-center justify-center gap-2 text-lg">
                  <Calendar size={20} className="text-orange" /> 
                  اليوم {activeDay} <span className="text-gray-400 text-sm font-normal">/ {totalDays}</span>
                </div>
                
                {/* شريط تقدم اليوم */}
                <div className="flex items-center gap-2 mt-1 justify-center">
                   <span className="text-[10px] text-gray-400 font-bold">تقدم اليوم: {dayProgress}%</span>
                   <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange transition-all duration-500" style={{ width: `${dayProgress}%` }} />
                   </div>
                </div>
              </div>

              <button disabled={activeDay === totalDays} onClick={() => setActiveDay(d => d + 1)} className="p-2 text-forest disabled:opacity-30 hover:bg-gray-50 rounded-full transition-colors"><ChevronLeft /></button>
            </div>

            {/* قائمة مهام اليوم */}
            <div className="space-y-3">
              {currentDayTasks.length > 0 ? currentDayTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 select-none
                    ${task.is_completed 
                      ? 'bg-green-50/50 border-green-100 opacity-60' 
                      : 'bg-white border-white hover:border-orange/30 hover:shadow-md shadow-sm'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                    ${task.is_completed ? 'bg-green-500 text-white scale-110' : 'bg-gray-100 text-gray-300 group-hover:bg-orange/10 group-hover:text-orange'}
                  `}>
                    {task.is_completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </div>
                  
                  <span className={`text-lg font-medium flex-1 transition-all duration-300 ${task.is_completed ? 'text-gray-400 line-through' : 'text-forest'}`}>
                    {task.content}
                  </span>
                </div>
              )) : (
                <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                   <Target size={40} className="mb-2 opacity-20" />
                   <p>لا توجد مهام لهذا اليوم (يوم راحة) 🎉</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-500">جاري تجهيز خطتك...</h3>
            <p className="text-sm text-gray-400 mt-2">سيقوم الطبيب بإضافة نظامك الغذائي قريباً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;