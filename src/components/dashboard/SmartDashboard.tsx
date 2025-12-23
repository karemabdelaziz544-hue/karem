import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { generateDailyPlan, getPanicAdvice } from '../../lib/SmartPlanGenerator';
import { Check, Utensils, Activity, Calendar, RefreshCw, Sparkles, Coffee, Droplet, Info, History, ChevronDown, ChevronUp, BrainCircuit, RotateCcw, CheckCircle2, AlertTriangle, X, Flame, Zap, Smile, Battery } from 'lucide-react';
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
  const [smartData, setSmartData] = useState<any>(null);
  const [mealInsights, setMealInsights] = useState<any[]>([]);
  const [waterGoal, setWaterGoal] = useState<number>(3000);
  const [adminTasks, setAdminTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any>(null);
  const [currentDayName, setCurrentDayName] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low' | null>(null);

  // UI States
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiType, setConfettiType] = useState<'water' | 'tasks' | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Panic Mode States
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [panicStep, setPanicStep] = useState<'select' | 'loading' | 'result'>('select');
  const [selectedCheats, setSelectedCheats] = useState<string[]>([]);
  const [panicData, setPanicData] = useState<any>(null);
  const [panicLoading, setPanicLoading] = useState(false);

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

  const normalizeText = (text: string) => {
      if (!text) return "";
      return text.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ى]/g, 'ي').replace(/[^\w\u0600-\u06FF\s]/g, ' '); 
  };

  // 🔥 Smart Matcher
  const isMatch = (taskContent: string, taskType: string, insightName: string) => {
      const tContent = normalizeText(taskContent);
      const iName = normalizeText(insightName);
      const tType = normalizeText(taskType || '');

      if (tContent.includes(iName) || iName.includes(tContent)) return true;

      const tWords = tContent.split(/\s+/).filter(w => w.length > 2 && !['مع', 'او', 'و', 'على', 'في', 'من'].includes(w));
      const iWords = iName.split(/\s+/).filter(w => w.length > 2 && !['مع', 'او', 'و', 'على', 'في', 'من'].includes(w));
      const hasCommonWord = tWords.some(tw => iWords.some(iw => iw === tw));
      if (hasCommonWord) return true;

      if ((tType.includes('lunch') || tType.includes('غداء')) && (iName.includes('غداء') || iName.includes('lunch'))) return true;
      if ((tType.includes('breakfast') || tType.includes('فطار')) && (iName.includes('فطار') || iName.includes('breakfast'))) return true;
      if ((tType.includes('dinner') || tType.includes('عشاء')) && (iName.includes('عشاء') || iName.includes('dinner'))) return true;
      if ((tType.includes('snack') || tType.includes('سناك')) && (iName.includes('سناك') || iName.includes('snack'))) return true;

      return false;
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

  // Auto/Manual Update
  const handleForceRegenerate = async () => {
      setIsUpdating(true);
      const tid = toast.loading("جاري تحليل وجبات اليوم...", { id: 'regen' });
      const newData = await generateDailyPlan(currentProfile.id);
      
      if (newData) {
          setSmartData(newData);
          const meta = newData.generated_tasks?.find((t: any) => t.type === 'METADATA_PACK');
          if (meta) {
              if (meta.insights) setMealInsights(meta.insights);
              if (meta.water || meta.water_goal) setWaterGoal(meta.water || meta.water_goal);
          }
          toast.success("تم التحديث بنجاح!", { id: tid });
      } else {
          toast.error("فشل التحديث، تأكد من وجود وجبات", { id: tid });
      }
      setIsUpdating(false);
  };

  const handleEnergySelect = (level: 'high' | 'medium' | 'low') => {
      setEnergyLevel(level);
      if (level === 'high') toast("عاش يا بطل! 🔥", { icon: '💪', style: { borderRadius: '20px', background: '#f97316', color: '#fff' } });
      else if (level === 'medium') toast("ممتاز ✨", { icon: '👌', style: { borderRadius: '20px', background: brandColors.forest, color: '#fff' } });
      else toast("ولا يهمك 💙 ريح شوية", { icon: '🌙', style: { borderRadius: '20px', background: '#3b82f6', color: '#fff' } });
  };

  const openPanicModal = () => { setShowPanicModal(true); setPanicStep('select'); setSelectedCheats([]); setPanicData(null); };
  const toggleCheatSelection = (meal: string) => { if (selectedCheats.includes(meal)) { setSelectedCheats(selectedCheats.filter(m => m !== meal)); } else { setSelectedCheats([...selectedCheats, meal]); } };
  const submitPanic = async () => { if (selectedCheats.length === 0) { toast.error("اختار وجبة واحدة على الأقل"); return; } setPanicStep('loading'); setPanicLoading(true); const advice = await getPanicAdvice(currentProfile.id, selectedCheats); setPanicLoading(false); if (advice) { setPanicData(advice); setPanicStep('result'); } else { setPanicStep('select'); toast.error("حدث خطأ، حاول تاني"); } };

  // Initial Load
  useEffect(() => {
    if (!currentProfile) return;

    const initDashboard = async () => {
        setLoading(true);
        try {
            // Streak
            const { data: logDates } = await supabase.from('daily_logs').select('date').eq('user_id', currentProfile.id).order('date', { ascending: false }).limit(30);
            if (logDates && logDates.length > 0) {
                const dates = Array.from(new Set(logDates.map(l => l.date)));
                let currentStreak = 0;
                let checkDate = new Date();
                const todayStr = checkDate.toISOString().split('T')[0];
                if (!dates.includes(todayStr)) checkDate.setDate(checkDate.getDate() - 1);
                while (true) {
                    if (dates.includes(checkDate.toISOString().split('T')[0])) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
                }
                setStreak(currentStreak);
            }

            // Tasks
            const { data: activePlan } = await supabase.from('plans').select('id, start_date, created_at').eq('user_id', currentProfile.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
            if (activePlan) {
                const { data: allTasks } = await supabase.from('plan_tasks').select('*').eq('plan_id', activePlan.id).order('order_index', { ascending: true });
                if (allTasks && allTasks.length > 0) {
                    const days = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    const dayName = days[new Date().getDay()]; 
                    
                    let todaysAdminTasks = allTasks.filter((t: any) => t.day_name?.includes(dayName));
                    
                    if (todaysAdminTasks.length === 0) {
                        const uniqueDayNames = Array.from(new Set(allTasks.map((t: any) => t.day_name))).filter(Boolean) as string[];
                        const startDateStr = activePlan.start_date || activePlan.created_at;
                        const diffTime = Math.abs(new Date().getTime() - new Date(startDateStr).getTime());
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
                        const targetDayName = uniqueDayNames[diffDays % uniqueDayNames.length];
                        todaysAdminTasks = allTasks.filter((t: any) => t.day_name === targetDayName);
                    }

                    if (todaysAdminTasks.length === 0 && allTasks.length > 0) {
                        todaysAdminTasks = allTasks.filter((t: any) => t.day_name === allTasks[0].day_name);
                    }

                    setCurrentDayName(dayName); 
                    setAdminTasks(todaysAdminTasks);
                }
            }

            // Data
            const { data: logData } = await supabase.from('daily_logs').select('*').eq('user_id', currentProfile.id).eq('date', dateIso).maybeSingle();
            setLogs(logData || { water_intake: 0, completed_tasks: [] });

            let { data: savedSmart } = await supabase.from('daily_smart_plans').select('*').eq('user_id', currentProfile.id).eq('date', dateIso).maybeSingle();
            
            if (savedSmart) {
                setSmartData(savedSmart);
                const meta = savedSmart.generated_tasks?.find((t: any) => t.type === 'METADATA_PACK');
                if (meta) {
                    if (meta.insights) setMealInsights(meta.insights);
                    if (meta.water || meta.water_goal) setWaterGoal(meta.water || meta.water_goal);
                } else {
                    handleForceRegenerate();
                }
            } else {
                handleForceRegenerate();
            }
            setLoading(false);
        } catch (e) { console.error(e); setLoading(false); }
    };
    initDashboard();
  }, [currentProfile?.id]);

  const getDisplayTasks = () => {
      const admins = adminTasks.map((t, i) => {
          const insight = mealInsights.find((ins: any) => {
              if (!ins.meal_name) return false;
              return isMatch(t.content, t.task_type, ins.meal_name);
          });

          const isValidBenefit = insight && insight.benefit && insight.benefit.length > 2;

          return {
              id: t.id,
              title: t.content,
              desc: t.task_type === 'workout' ? 'تمرين اليوم' : 'وجبة أساسية',
              time: generateAdminTime(i),
              type: ['breakfast', 'lunch', 'dinner', 'snack'].includes(t.task_type) ? 'food' : 'activity',
              isAI: false,
              aiBenefit: isValidBenefit ? insight.benefit : null
          };
      });

      const suggestions = (smartData?.generated_tasks || [])
          .filter((t: any) => t.type !== 'METADATA_PACK' && (t.title || t.name || t.task))
          .map((t: any, i: number) => ({
              id: `ai_${i}`,
              title: t.title || t.name || t.task,
              desc: t.desc || t.description || 'اقتراح صحي',
              time: t.time || '10:00 م',
              type: t.type === 'herb' ? 'coffee' : 'activity',
              isAI: true
          }));

      return [...admins, ...suggestions].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  };

  const finalTasks = getDisplayTasks();

  const addWater = async () => {
      const currentVal = logs?.water_intake || 0;
      const newVal = currentVal + 250;
      if (currentVal < waterGoal && newVal >= waterGoal) {
          triggerCelebration('water');
          toast("عاش! كملت هدف المياه 💧", { icon: '👏', style: { borderRadius: '20px', background: '#3b82f6', color: '#fff' } });
      } else {
          toast.success("+250ml", { icon: '💧', style: { borderRadius: '20px', background: brandColors.forest, color: '#fff' } });
      }
      setLogs({...logs, water_intake: newVal});
      await supabase.from('daily_logs').upsert({ user_id: currentProfile?.id, date: dateIso, water_intake: newVal }, { onConflict: 'user_id, date' });
  };

  const toggleTask = async (taskId: string) => {
      const current = logs?.completed_tasks || [];
      const taskIdStr = String(taskId);
      const isCompleting = !current.includes(taskIdStr);
      const updated = isCompleting ? [...current, taskIdStr] : current.filter((id: string) => id !== taskIdStr);
      setLogs({...logs, completed_tasks: updated});
      if (isCompleting && updated.length === finalTasks.length && finalTasks.length > 0) {
          triggerCelebration('tasks');
          toast("يا بطل! خلصت كل مهام اليوم 💪", { icon: '🏆', duration: 4000, style: { borderRadius: '20px', background: brandColors.forest, color: '#fff', fontWeight: 'bold' } });
      }
      await supabase.from('daily_logs').upsert({ user_id: currentProfile?.id, date: dateIso, completed_tasks: updated }, { onConflict: 'user_id, date' });
  };

  const toggleInsight = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation(); 
      if (expandedTaskId === taskId) setExpandedTaskId(null);
      else setExpandedTaskId(taskId);
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-forest"/></div>;

  const completionRate = finalTasks.length > 0 ? ((logs?.completed_tasks?.length || 0) / finalTasks.length) * 100 : 0;
  const isAnalysisComplete = mealInsights.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 font-sans relative" dir="rtl">
      
      {showConfetti && (
          <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={true}
              numberOfPieces={300}
              gravity={0.2}
              colors={confettiType === 'water' ? ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'] : [brandColors.forest, brandColors.orange, brandColors.amber, '#fbbf24']}
          />
      )}

      {/* Floating Energy Dock */}
      <div className="fixed bottom-32 left-4 z-40 flex flex-col gap-4 animate-in slide-in-from-left-4 duration-700">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap animate-bounce">
              مودك اليوم؟ 👇
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50 flex flex-col gap-3">
              <button onClick={() => handleEnergySelect('high')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group relative ${energyLevel === 'high' ? 'bg-orange-100 text-orange-500 scale-110 shadow-sm' : 'hover:bg-gray-50 text-gray-400 hover:text-orange-500'}`} title="نشيط وجاهز">
                  <Flame size={20} className={energyLevel === 'high' ? 'fill-orange-500' : ''} />
              </button>
              <button onClick={() => handleEnergySelect('medium')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group relative ${energyLevel === 'medium' ? 'bg-green-100 text-forest scale-110 shadow-sm' : 'hover:bg-gray-50 text-gray-400 hover:text-forest'}`} title="تمام / عادي">
                  <Smile size={20} />
              </button>
              <button onClick={() => handleEnergySelect('low')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group relative ${energyLevel === 'low' ? 'bg-blue-100 text-blue-500 scale-110 shadow-sm' : 'hover:bg-gray-50 text-gray-400 hover:text-blue-500'}`} title="مرهق / تعبان">
                  <Battery size={20} className="rotate-90" />
              </button>
          </div>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-forest to-green-900 rounded-[2.5rem] p-8 shadow-xl text-white">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-30 -ml-16 -mt-16 animate-blob"></div>
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h3 className="text-green-100/80 text-sm font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                          {currentDayName || 'اليوم'}
                          <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">الحالي</span>
                      </h3>
                      <h1 className="text-3xl font-bold tracking-tight mt-1">{displayDate}</h1>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 bg-orange-500/20 backdrop-blur-md border border-orange-400/30 px-3 py-1.5 rounded-full shadow-lg animate-in slide-in-from-top-2">
                          <Flame size={16} className="text-orange-400 fill-orange-400 animate-pulse" />
                          <span className="text-white font-bold text-sm tabular-nums">{streak}</span>
                          <span className="text-orange-100 text-xs font-medium">أيام</span>
                      </div>
                      {isAnalysisComplete && (
                          <span className="bg-green-500/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold border border-green-400/30 shadow-sm flex items-center gap-1 text-green-100 animate-in fade-in">
                              <CheckCircle2 size={12} /> تم التحليل
                          </span>
                      )}
                  </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/10 leading-relaxed font-medium text-white/95 text-lg shadow-inner">
                  <p className="whitespace-normal leading-relaxed">"{smartData?.morning_message || 'أهلاً بك! يوم جديد للاقتراب من هدفك.'}"</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div onClick={addWater} className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group cursor-pointer active:scale-95 transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Droplet size={60} className="text-blue-500"/></div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start"><span className="text-gray-600 font-bold text-sm">المياه</span><div className="bg-blue-50 text-blue-600 rounded-full p-2"><Droplet size={18} fill="currentColor" /></div></div>
                  <div className="flex items-end gap-1 mt-4"><span className="text-3xl font-black text-slate-800">{((logs?.water_intake || 0)/1000).toFixed(1)}</span><span className="text-sm text-gray-400 font-medium mb-1">/ {(waterGoal/1000).toFixed(1)}L</span></div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full mt-3 overflow-hidden"><div className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm" style={{ width: `${Math.min(100, ((logs?.water_intake || 0)/waterGoal)*100)}%` }}></div></div>
              </div>
          </div>
          <div className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden border border-gray-100">
              <div className="absolute -bottom-4 -left-4"><div style={{ width: 100, height: 100 }}><CircularProgressbarWithChildren value={completionRate} strokeWidth={12} styles={buildStyles({ pathColor: brandColors.orange, trailColor: '#f1f5f9', strokeLinecap: 'round' })}></CircularProgressbarWithChildren></div></div>
              <div className="relative z-10 flex flex-col h-full justify-between items-end text-left">
                  <div className="flex justify-between items-start w-full"><div className="bg-orange-50 text-orange-600 rounded-full p-2"><Activity size={18} /></div><span className="text-gray-600 font-bold text-sm">المهام</span></div>
                  <div className="mt-6 text-left"><span className="text-3xl font-black text-slate-800">{Math.round(completionRate)}%</span><p className="text-xs text-gray-400 mt-1 font-medium">مكتمل</p></div>
              </div>
          </div>
      </div>

      {/* Schedule */}
      <div>
          <div className="flex items-center justify-between px-2 mb-4 mt-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">جدول اليوم</h3>
              <span className="text-xs font-medium text-forest bg-forest/10 px-2.5 py-1 rounded-lg">{finalTasks.length} مهام</span>
          </div>
          <div className="flex flex-col gap-3">
              {finalTasks.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-dashed border-gray-200">
                      <p className="text-gray-500 font-bold">لا توجد مهام مسجلة لهذا اليوم</p>
                      <button onClick={() => navigate('/history')} className="mt-4 text-forest text-sm font-bold flex items-center justify-center gap-1 hover:underline"><History size={14}/> راجع الأرشيف</button>
                  </div>
              ) : (
                  finalTasks.map((task) => {
                      const isDone = logs?.completed_tasks?.includes(String(task.id));
                      const isExpanded = expandedTaskId === String(task.id);
                      const itemColors = task.isAI ? { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', border: 'border-amber-200/50', badge: 'bg-amber-100 text-amber-800' } : { bg: 'bg-white', text: 'text-slate-800', iconBg: task.type === 'food' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500', border: 'border-transparent', badge: 'bg-gray-100 text-gray-500' };

                      return (
                          <div key={task.id} className={`group relative flex flex-col rounded-3xl transition-all duration-300 border ${isDone ? 'opacity-50 bg-gray-50 shadow-none border-transparent' : `${itemColors.bg} shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] ${itemColors.border}`}`}>
                              <div onClick={() => toggleTask(task.id)} className="flex items-center gap-4 p-4 cursor-pointer w-full">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${itemColors.iconBg}`}>
                                      {task.type === 'coffee' ? <Coffee size={24}/> : (task.isAI ? <Sparkles size={24}/> : (task.type === 'food' ? <Utensils size={24}/> : <Activity size={24}/>))}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{task.time}</span>
                                          {task.isAI && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${itemColors.badge}`}><Sparkles size={8}/> اقتراح</span>}
                                      </div>
                                      <h4 className={`text-base font-bold whitespace-normal leading-snug break-words ${isDone ? 'line-through' : itemColors.text}`}>{task.title}</h4>
                                      <p className="text-sm text-gray-500 font-medium mt-0.5 whitespace-normal leading-relaxed break-words">{task.desc}</p>
                                  </div>
                                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-forest border-forest scale-110 shadow-sm' : 'border-gray-200 group-hover:border-forest/50 bg-white'}`}>
                                      {isDone && <Check size={16} className="text-white" strokeWidth={4} />}
                                  </div>
                              </div>
                              {task.aiBenefit && !isDone && (
                                  <div className="px-4 pb-3">
                                      <button onClick={(e) => toggleInsight(e, String(task.id))} className={`flex items-center gap-2 text-xs font-bold transition-all px-3 py-2 rounded-xl w-full ${isExpanded ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                          <BrainCircuit size={14} className={isExpanded ? 'text-blue-600' : 'text-gray-400'} />
                                          {isExpanded ? 'إخفاء التحليل' : 'تحليل الوجبة ✨'}
                                          <span className="mr-auto">{isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
                                      </button>
                                      {isExpanded && (
                                          <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in">
                                              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                              <p className="text-sm text-blue-800 font-medium leading-relaxed whitespace-normal break-words">{task.aiBenefit}</p>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      );
                  })
              )}
          </div>
      </div>

      {/* Panic Button */}
      <button onClick={openPanicModal} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold shadow-sm mt-8 mb-4 group">
          <div className="bg-red-200 p-2 rounded-full group-hover:scale-110 transition-transform"><AlertTriangle size={20} className="text-red-600" /></div>
          <span>لخبطت في الأكل؟ اضغط هنا للإنقاذ 🚨</span>
      </button>

      {/* Panic Modal */}
      {showPanicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 overflow-hidden">
                  <button onClick={() => setShowPanicModal(false)} className="absolute top-5 left-5 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2 z-10 transition-colors"><X size={20}/></button>
                  <div className="flex flex-col items-center text-center mb-6 pt-2">
                      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3 border-4 border-red-50"><AlertTriangle size={32} /></div>
                      <h2 className="text-2xl font-black text-slate-800">خطة الإنقاذ 🚑</h2>
                      <p className="text-gray-500 text-sm font-medium mt-1">{panicStep === 'select' ? 'قولنا لخبطت في إيه عشان نلحق الموقف' : panicStep === 'loading' ? 'جاري الاتصال بالدكتور هيليكس...' : 'ولا يهمك، نفذ الخطوات دي وكمل يومك'}</p>
                  </div>
                  {panicStep === 'select' && (
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                              {['الفطار', 'الغداء', 'العشاء', 'سناكس'].map((meal) => (
                                  <button key={meal} onClick={() => toggleCheatSelection(meal)} className={`p-4 rounded-2xl font-bold text-sm transition-all border-2 ${selectedCheats.includes(meal) ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>{meal}</button>
                              ))}
                              <button onClick={() => toggleCheatSelection('كل الوجبات')} className={`col-span-2 p-4 rounded-2xl font-bold text-sm transition-all border-2 ${selectedCheats.includes('كل الوجبات') ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>خربتها خالص (اليوم كله) 😅</button>
                          </div>
                          <button onClick={submitPanic} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold mt-2 hover:bg-slate-900 transition flex items-center justify-center gap-2">هات الحل بسرعة! <ChevronDown size={18} className="-rotate-90"/></button>
                      </div>
                  )}
                  {panicStep === 'loading' && (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                          <div className="relative"><div className="w-16 h-16 border-4 border-gray-200 border-t-forest rounded-full animate-spin"></div><BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-forest" size={24}/></div>
                          <p className="mt-6 text-gray-500 font-medium animate-pulse">بيفكر في أحسن حل ليك...</p>
                      </div>
                  )}
                  {panicStep === 'result' && panicData && (
                      <div className="space-y-5 animate-in slide-in-from-bottom-4">
                          <div className="bg-blue-50 border border-blue-100 p-5 rounded-[1.5rem] text-blue-900 font-medium text-sm leading-relaxed whitespace-normal relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full blur-2xl -mr-10 -mt-10"></div><span className="relative">"{panicData.message}"</span></div>
                          <div className="space-y-3">
                              <h4 className="font-bold text-slate-800 text-right flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500"/> نفذ الخطوات دي حالاً:</h4>
                              {panicData.steps?.map((step: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><div className="bg-forest text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">{idx + 1}</div><p className="text-sm font-semibold text-gray-600 whitespace-normal break-words leading-relaxed">{step}</p></div>
                              ))}
                          </div>
                          <button onClick={() => setShowPanicModal(false)} className="w-full bg-forest text-white py-4 rounded-2xl font-bold mt-2 hover:bg-green-800 transition shadow-xl shadow-forest/20 active:scale-95">تمام، أنا قدها! 💪</button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default SmartDashboard;