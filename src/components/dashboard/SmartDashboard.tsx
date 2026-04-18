import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { Check, Utensils, Activity, RefreshCw, Coffee, Droplet, History, Flame, MessageCircle, AlertCircle } from 'lucide-react';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

const brandColors = {
    forest: '#1e5631',   
    orange: '#f97316',    
    blue: '#3b82f6',      
    amber: '#d97706'      
};

const SmartDashboard: React.FC = () => {
  const { currentProfile } = useFamily();
  const navigate = useNavigate();
  
  // Data States
  const [waterGoal] = useState<number>(3000);
  const [adminTasks, setAdminTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any>(null);
  const [currentDayName, setCurrentDayName] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number>(0);
  const [isPlanExpired, setIsPlanExpired] = useState(false);

  // UI States
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiType, setConfettiType] = useState<'water' | 'tasks' | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const todayDate = new Date();
  const dateIso = todayDate.toISOString().split('T')[0];
  const displayDate = todayDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', weekday: 'long' });

  // Helpers
  const parseTime = (timeStr: string) => {
    if (!timeStr) return 999;
    const isPM = timeStr.includes('م') || timeStr.includes('PM');
    let num = parseInt(timeStr.replace(/\D/g, ''));
    if (num === 12) num = 0;
    if (isPM) num += 12;
    return num;
  };

  const generateAdminTime = (index: number) => {
      const startHour = 8; 
      const time = new Date();
      time.setHours(startHour + (index * 3), 0, 0); 
      return time.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  };

  useEffect(() => {
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerCelebration = (type: 'water' | 'tasks') => {
      setConfettiType(type);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
  };

  // Initial Load
  useEffect(() => {
    if (!currentProfile) return;

    const initDashboard = async () => {
        setLoading(true);
        try {
            // 1. Streak
            const { data: logDates } = await supabase.from('daily_logs').select('date').eq('user_id', currentProfile.id).order('date', { ascending: false }).limit(30);
            if (logDates && logDates.length > 0) {
                const dates = Array.from(new Set(logDates.map((l) => l.date)));
                let currentStreak = 0;
                let checkDate = new Date();
                if (!dates.includes(checkDate.toISOString().split('T')[0])) checkDate.setDate(checkDate.getDate() - 1);
                while (dates.includes(checkDate.toISOString().split('T')[0])) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
                setStreak(currentStreak);
            }

            // 2. Plan Logic & Expiry Check
            const { data: activePlan } = await supabase.from('plans')
                .select('id, start_date')
                .eq('user_id', currentProfile.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1).maybeSingle();

            if (activePlan) {
                const startDate = activePlan.start_date ? new Date(activePlan.start_date) : new Date();
                const expiryDate = new Date(startDate);
                expiryDate.setDate(startDate.getDate() + 30); // Default 30 days
                
                if (todayDate > expiryDate) {
                    setIsPlanExpired(true);
                    setAdminTasks([]);
                } else {
                    const { data: allTasks } = await supabase.from('plan_tasks').select('*').eq('plan_id', activePlan.id).order('order_index', { ascending: true });
                    if (allTasks && allTasks.length > 0) {
                        const days = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة', 'السبت'];
                        const dayName = days[todayDate.getDay()]; 
                        const todaysAdminTasks = allTasks.filter((t) => t.day_name?.includes(dayName));
                        setCurrentDayName(dayName); 
                        setAdminTasks(todaysAdminTasks);
                    }
                }
            } else {
                setIsPlanExpired(true);
            }

            const { data: logData } = await supabase.from('daily_logs').select('*').eq('user_id', currentProfile.id).eq('date', dateIso).maybeSingle();
            setLogs(logData || { water_intake: 0, completed_tasks: [] });

            setLoading(false);
        } catch (e) { console.error(e); setLoading(false); }
    };
    initDashboard();
  }, [currentProfile?.id]);

  const getDisplayTasks = () => {
      return adminTasks.map((t, i: number) => ({
          id: t.id,
          title: t.content,
          desc: t.task_type === 'workout' ? 'تمرين اليوم' : 'وجبة أساسية',
          time: generateAdminTime(i),
          type: ['breakfast', 'lunch', 'dinner', 'snack'].includes(t.task_type ?? '') ? 'food' : 'activity'
      })).sort((a, b) => parseTime(a.time) - parseTime(b.time));
  };

  const finalTasks = getDisplayTasks();

  const addWater = async () => {
      const currentVal = logs?.water_intake || 0;
      const newVal = currentVal + 250;
      setLogs({...logs, water_intake: newVal});
      if (newVal >= waterGoal) triggerCelebration('water');
      await supabase.from('daily_logs').upsert({ user_id: currentProfile?.id ?? '', date: dateIso, water_intake: newVal }, { onConflict: 'user_id, date' });
  };

  const toggleTask = async (taskId: string) => {
      const current = logs?.completed_tasks || [];
      const taskIdStr = String(taskId);
      const isCompleting = !current.includes(taskIdStr);
      const updated = isCompleting ? [...current, taskIdStr] : current.filter((id: string) => id !== taskIdStr);
      setLogs({...logs, completed_tasks: updated});
      if (isCompleting && updated.length === finalTasks.length) triggerCelebration('tasks');
      await supabase.from('daily_logs').upsert({ user_id: currentProfile?.id ?? '', date: dateIso, completed_tasks: updated }, { onConflict: 'user_id, date' });
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-forest"/></div>;

  const completionRate = finalTasks.length > 0 ? ((logs?.completed_tasks?.length || 0) / finalTasks.length) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 font-sans relative" dir="rtl">
      
      {showConfetti && (
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} gravity={0.3} colors={['#3b82f6', '#f97316', '#1e5631']} />
      )}

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-forest to-green-900 rounded-[2.5rem] p-8 shadow-xl text-white">
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h3 className="text-green-100/80 text-sm font-medium flex items-center gap-2">{currentDayName || 'اليوم'} <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">الحالي</span></h3>
                      <h1 className="text-3xl font-bold mt-1">{displayDate}</h1>
                  </div>
                  <div className="flex items-center gap-1.5 bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-400/30">
                      <Flame size={16} className="text-orange-400 fill-orange-400" />
                      <span className="text-white font-bold text-sm">{streak} أيام</span>
                  </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
                  <p className="text-lg">"كل خطوة صغيرة اليوم هي استثمار في صحتك غداً. استمر!" ✨</p>
              </div>
          </div>
      </div>

      {/* Water & Tasks Progress */}
      <div className="grid grid-cols-2 gap-4">
          <div onClick={addWater} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <div className="flex justify-between items-start mb-4"><span className="text-gray-600 font-bold text-sm">المياه</span><Droplet size={18} className="text-blue-500" /></div>
              <div className="flex items-end gap-1"><span className="text-3xl font-black text-slate-800">{((logs?.water_intake || 0)/1000).toFixed(1)}</span><span className="text-xs text-gray-400 mb-1">/3.0L</span></div>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, ((logs?.water_intake || 0)/waterGoal)*100)}%` }}></div></div>
          </div>
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute -bottom-4 -left-4 w-20 h-20"><CircularProgressbarWithChildren value={completionRate} strokeWidth={10} styles={buildStyles({ pathColor: brandColors.orange, trailColor: '#f1f5f9' })} /></div>
              <div className="text-right flex flex-col justify-between h-full items-end">
                  <Activity size={18} className="text-orange-500" />
                  <div className="mt-4"><span className="text-2xl font-black text-slate-800">{Math.round(completionRate)}%</span><p className="text-[10px] text-gray-400">إنجاز اليوم</p></div>
              </div>
          </div>
      </div>

      {/* Diet Plan Section */}
      <div>
          <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-xl font-bold text-slate-800">نظامك الغذائي اليومي</h3>
          </div>

          {isPlanExpired ? (
              <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-[2.5rem] p-8 text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} /></div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">انتهى نظامك الحالي!</h4>
                  <p className="text-gray-600 mb-6 font-medium">لا يوجد جدول متاح حالياً. يرجى طلب تحديث للنظام من فريق الدعم للمتابعة.</p>
                  <button onClick={() => navigate('/support')} className="w-full bg-forest text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-colors shadow-lg shadow-forest/20">
                      <MessageCircle size={20} /> طلب نظام جديد الآن
                  </button>
              </div>
          ) : finalTasks.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-10 text-center border border-gray-100 shadow-sm">
                  <p className="text-gray-400 font-bold">لا توجد وجبات مسجلة لليوم في جدولك.</p>
              </div>
          ) : (
              <div className="flex flex-col gap-3">
                  {finalTasks.map((task) => {
                      const isDone = logs?.completed_tasks?.includes(String(task.id));
                      return (
                          <div key={task.id} onClick={() => toggleTask(task.id)} className={`flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer ${isDone ? 'bg-gray-50 opacity-60' : 'bg-white shadow-sm border-transparent'}`}>
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${task.type === 'food' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                                  {task.type === 'food' ? <Utensils size={24} /> : <Activity size={24} />}
                              </div>
                              <div className="flex-1">
                                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{task.time}</span>
                                  <h4 className={`text-base font-bold mt-1 ${isDone ? 'line-through text-gray-400' : 'text-slate-800'}`}>{task.title}</h4>
                              </div>
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-forest border-forest' : 'border-gray-200'}`}>
                                  {isDone && <Check size={16} className="text-white" strokeWidth={4} />}
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>
    </div>
  );
};

export default SmartDashboard;