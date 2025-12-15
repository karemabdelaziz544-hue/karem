import React, { useEffect, useState, useRef } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { generateDailyPlan } from '../../lib/SmartPlanGenerator';
import { Droplet, Flame, BrainCircuit, CheckCircle, Clock, Utensils, Activity } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import toast from 'react-hot-toast';

const SmartDashboard: React.FC = () => {
  const { currentProfile } = useFamily();
  const [plan, setPlan] = useState<any>(null);
  const [logs, setLogs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 👇 القفل لمنع التكرار
  const isRequestingRef = useRef(false);

  // 1. التحقق والتحميل
  useEffect(() => {
    if (!currentProfile) return;

    const loadDailyData = async () => {
      // لو فيه طلب شغال حالاً، اخرج فوراً
      if (isRequestingRef.current) return;
      
      const today = new Date().toISOString().split('T')[0];
      
      try {
        setLoading(true);
        
        // أ) هل توجد خطة محفوظة بالفعل؟
        const { data: existingPlan } = await supabase
            .from('daily_smart_plans')
            .select('*')
            .eq('user_id', currentProfile.id)
            .eq('date', today)
            .maybeSingle();

        // ب) هل يوجد سجل نشاط؟
        const { data: existingLog } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('user_id', currentProfile.id)
            .eq('date', today)
            .maybeSingle();

        if (existingPlan) {
            console.log("📂 Loaded existing plan from DB");
            setPlan(existingPlan);
            setLogs(existingLog || { water_intake: 0, completed_tasks: [] });
        } else {
            // ج) لا توجد خطة -> نولد واحدة جديدة (مرة واحدة فقط)
            console.log("⚡ Generating new plan...");
            isRequestingRef.current = true; // 🔒 قفل
            
            const newPlan = await generateDailyPlan(currentProfile.id);
            
            if (newPlan) {
                setPlan(newPlan);
                setLogs({ water_intake: 0, completed_tasks: [] });
            }
        }
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
        isRequestingRef.current = false; // 🔓 فتح القفل
      }
    };

    loadDailyData();
  }, [currentProfile?.id]); // 👈 التعديل الهام: الاعتماد على الـ ID فقط

  // 2. دوال التفاعل (تسجيل المياه والتاسكات)
  const addWater = async () => {
    const newAmount = (logs?.water_intake || 0) + 250;
    setLogs({ ...logs, water_intake: newAmount });
    
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('daily_logs').update({ water_intake: newAmount }).eq('user_id', currentProfile?.id).eq('date', today);
    toast.success("عاش! 💧 +250ml", { icon: '👏' });
  };

  const toggleTask = async (taskId: string) => {
    const currentTasks = logs?.completed_tasks || [];
    let newTasks;
    
    if (currentTasks.includes(taskId)) {
        newTasks = currentTasks.filter((id: string) => id !== taskId);
    } else {
        newTasks = [...currentTasks, taskId];
        toast.success("مهمة مكتملة! استمر 🔥");
    }

    setLogs({ ...logs, completed_tasks: newTasks });
    
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('daily_logs').update({ completed_tasks: newTasks }).eq('user_id', currentProfile?.id).eq('date', today);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-center animate-pulse">
        <BrainCircuit size={48} className="text-forest mb-4" />
        <h3 className="text-xl font-bold text-gray-800">دكتور هيليكس يحلل يومك...</h3>
        <p className="text-gray-500">جاري دمج نظامك الغذائي مع أهدافك الصحية 🧠</p>
    </div>
  );

  if (!plan) return <div className="text-center py-10">حدث خطأ في تحميل الخطة، حاول مرة أخرى لاحقاً</div>;

  const waterGoal = 3000;
  const waterPercent = Math.min(100, (logs?.water_intake / waterGoal) * 100) || 0;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      
      {/* 1. كارت الصباح (Hero Card) */}
      <div className="bg-gradient-to-br from-forest to-green-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-90">
               <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">تركيز اليوم: {plan.focus_mode} 🎯</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-relaxed">
               "{plan.morning_message}"
            </h2>
            <p className="text-white/60 text-sm flex items-center gap-2">
               <BrainCircuit size={14}/> تم التوليد بواسطة Helix AI
            </p>
         </div>
      </div>

      {/* 2. حلقات الإنجاز (Stats) */}
      <div className="grid grid-cols-2 gap-4">
          {/* Water */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative group cursor-pointer" onClick={addWater}>
             <div className="w-28 h-28 mb-4 relative">
                <CircularProgressbar 
                  value={waterPercent} 
                  text={`${(logs?.water_intake / 1000).toFixed(1)}L`} 
                  styles={buildStyles({ pathColor: '#3b82f6', textColor: '#1e3a8a', trailColor: '#eff6ff', textSize: '20px' })}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full backdrop-blur-sm">
                    <span className="text-blue-600 font-bold text-xl">+</span>
                </div>
             </div>
             <p className="font-bold text-gray-700">المياه</p>
             <span className="text-xs text-gray-400">اضغط للإضافة</span>
          </div>

          {/* Daily Impact (Completed Tasks) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
             <div className="w-28 h-28 mb-4">
                <CircularProgressbar 
                  value={plan.generated_tasks ? (logs?.completed_tasks?.length / plan.generated_tasks.length) * 100 : 0} 
                  text={`${logs?.completed_tasks?.length || 0}/${plan.generated_tasks?.length || 0}`} 
                  styles={buildStyles({ pathColor: '#f97316', textColor: '#c2410c', trailColor: '#fff7ed', textSize: '20px' })}
                />
             </div>
             <p className="font-bold text-gray-700">المهام</p>
             <span className="text-xs text-gray-400">إنجاز اليوم</span>
          </div>
      </div>

      {/* 3. التايم لاين الذكي (Timeline) */}
      <div>
         <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="text-orange"/> جدولك اليومي
         </h3>
         
         <div className="space-y-0 relative border-r-2 border-gray-100 mr-4">
            {plan.generated_tasks?.map((task: any, index: number) => {
                const isCompleted = logs?.completed_tasks?.includes(task.id || index.toString());
                const isFood = task.type === 'food';
                
                return (
                    <div key={index} className="relative pr-8 mb-6 last:mb-0 group">
                        {/* Timeline Dot */}
                        <div className={`absolute -right-[9px] top-6 w-4 h-4 rounded-full border-2 transition-colors ${isCompleted ? 'bg-forest border-forest' : isFood ? 'bg-orange border-orange' : 'bg-white border-gray-300'}`}></div>
                        
                        {/* Task Card */}
                        <div 
                          onClick={() => toggleTask(task.id || index.toString())}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-start ${isCompleted ? 'bg-green-50 border-green-100 opacity-60' : 'bg-white border-gray-100 hover:shadow-md hover:border-forest/30'}`}
                        >
                            <div className="flex items-start gap-4 w-full">
                                {/* Icon */}
                                <div className={`p-3 rounded-xl shrink-0 ${task.type === 'food' ? 'bg-orange/10 text-orange' : task.type === 'water' ? 'bg-blue/10 text-blue-500' : 'bg-purple/10 text-purple-500'}`}>
                                    {task.type === 'food' ? <Utensils size={24}/> : task.type === 'water' ? <Droplet size={24}/> : <Flame size={24}/>}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-1">
                                        <Clock size={12}/> {task.time}
                                    </div>
                                    
                                    <h4 className={`font-bold text-lg mb-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                        {task.title}
                                    </h4>
                                    
                                    {/* الوصف (مكونات الوجبة) */}
                                    <p className={`text-sm leading-relaxed ${isFood ? 'text-gray-600 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2' : 'text-gray-500 mt-1'}`}>
                                        {task.desc}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Checkbox */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2 transition-colors ${isCompleted ? 'bg-forest border-forest text-white' : 'border-gray-200 text-transparent group-hover:border-forest/30'}`}>
                                <CheckCircle size={14} />
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>

    </div>
  );
};

export default SmartDashboard;