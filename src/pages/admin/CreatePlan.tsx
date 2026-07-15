import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight, Plus, Trash2, Save, User, Calendar, Copy, Search, Dumbbell, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import type { Profile, PlanTaskInsert } from '../../types';

type Task = { content: string; type: string; metadata?: any };
type PlanDay = { name: string; tasks: Task[] };

const CreatePlan: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { profile, user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const planType = searchParams.get('type') || 'nutrition';

  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<PlanDay[]>([
    { 
      name: 'اليوم الأول', 
      tasks: [{ content: '', type: planType === 'workout' ? 'workout' : 'other', metadata: {} }] 
    }
  ]);
  const [presets, setPresets] = useState<any[]>([]);

  // Exercise Selection Modal States
  const [isExModalOpen, setIsExModalOpen] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exBodyPart, setExBodyPart] = useState('');
  const [exDifficulty, setExDifficulty] = useState('');
  const [activeTaskIndices, setActiveTaskIndices] = useState<{ dIdx: number; tIdx: number } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        toast.error("خطأ في الوصول لبيانات المريض");
        navigate(-1);
      } else {
        if (profile?.role === 'doctor' && data.assigned_doctor_id !== currentUser?.id) {
          toast.error("عذراً، هذا المريض غير مخصص لمتابعتك");
          navigate('/doctor-dashboard');
          return;
        }
        setTargetUser(data);
        setTitle(planType === 'workout' 
          ? `خطة تمارين - ${new Date().toLocaleDateString('ar-EG')}` 
          : `نظام غذائي - ${new Date().toLocaleDateString('ar-EG')}`);
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId, currentUser, profile, navigate, planType]);

  useEffect(() => {
    const fetchPresets = async () => {
      const { data } = await supabase.from('preset_exercises' as any).select('*').order('title');
      if (data) setPresets(data);
    };
    fetchPresets();
  }, []);

  const addDay = () => setDays([...days, { name: `اليوم ${days.length + 1}`, tasks: [{ content: '', type: planType === 'workout' ? 'workout' : 'other', metadata: {} }] }]);
  const removeDay = (idx: number) => {
    if (days.length === 1) return;
    const ns = [...days]; ns.splice(idx, 1); setDays(ns);
  };
  const addTaskToDay = (dIdx: number) => {
    const ns = [...days]; ns[dIdx].tasks.push({ content: '', type: planType === 'workout' ? 'workout' : 'other', metadata: {} }); setDays(ns);
  };
  const removeTaskFromDay = (dIdx: number, tIdx: number) => {
    const ns = [...days]; ns[dIdx].tasks.splice(tIdx, 1); setDays(ns);
  };
  const updateTaskType = (dIdx: number, tIdx: number, type: string) => {
    const ns = [...days]; 
    ns[dIdx].tasks[tIdx].type = type;
    if (type === 'workout' && !ns[dIdx].tasks[tIdx].metadata) {
      ns[dIdx].tasks[tIdx].metadata = {};
    }
    setDays(ns);
  };
  const updateTaskContent = (dIdx: number, tIdx: number, val: string) => {
    const ns = [...days]; ns[dIdx].tasks[tIdx].content = val; setDays(ns);
  };

  const openExerciseModal = (dIdx: number, tIdx: number) => {
    setActiveTaskIndices({ dIdx, tIdx });
    setExSearch('');
    setExBodyPart('');
    setExDifficulty('');
    setIsExModalOpen(true);
  };

  const selectExerciseForTask = (exercise: any) => {
    if (activeTaskIndices === null) return;
    const { dIdx, tIdx } = activeTaskIndices;
    const ns = [...days];
    ns[dIdx].tasks[tIdx].content = exercise.title;
    ns[dIdx].tasks[tIdx].type = 'workout';
    ns[dIdx].tasks[tIdx].metadata = {
      exercise_id: exercise.id,
      sets: exercise.default_sets,
      duration: exercise.default_duration,
      calories: exercise.default_calories,
      rest: '60s',
      notes: exercise.tips
    };
    setDays(ns);
    setIsExModalOpen(false);
    toast.success(`تم اختيار تمرين: ${exercise.title}`);
  };
  const duplicateDay = (idx: number) => {
    const copy = JSON.parse(JSON.stringify(days[idx]));
    copy.name = `${copy.name} (نسخة)`;
    setDays([...days, copy]);
    toast.success("تم تكرار اليوم");
  };

  const handleSave = async () => {
    if (!title) return toast.error("يجب كتابة عنوان للنظام");
    setSubmitting(true);
    
    try {
        // 1. إنشاء الخطة الأساسية والتأكد من أنها active لتظهر في الصفحة الرئيسية
        const { data: planData, error: planError } = await supabase
            .from('plans')
            .insert([{ 
                user_id: userId!, 
                title: title, 
                plan_type: planType,
                status: 'active'
            }])
            .select().single();

        if (planError) throw planError;

        // 2. تجهيز كل التاسكات من كل الأيام وربطها بالـ plan_id الجديد
        const allTasksToInsert: PlanTaskInsert[] = []; 
        let globalOrder = 0;

        days.forEach((day, dayIdx) => {
            day.tasks.forEach((task) => {
                if (task.content.trim() !== "") {
                    allTasksToInsert.push({
                        plan_id: planData.id, // 👈 الربط بالخطة اللي لسه مكريتينها
                        content: task.content,
                        task_type: task.type,
                        day_name: day.name,
                        day_number: dayIdx + 1, // Store the calculated day number directly for ease of filtering
                        order_index: globalOrder++,
                        is_completed: false,
                        metadata: task.type === 'workout' ? task.metadata : null
                    });
                }
            });
        });

        // 3. إدخال كل التاسكات دفعة واحدة
        if (allTasksToInsert.length > 0) {
            const { error: tasksError } = await supabase
                .from('plan_tasks')
                .insert(allTasksToInsert);
            
            if (tasksError) throw tasksError;
        }

        // 4. إرسال الإشعار
        await supabase.from('notifications').insert([{
            user_id: userId,
            title: planType === 'workout' ? '💪 خطة تمارين جديدة' : '🥗 نظام غذائي جديد',
            message: planType === 'workout' 
              ? `قام الدكتور بإرسال خطة التمارين الجديدة: ${title}` 
              : `قام الدكتور بإرسال نظامك الغذائي الجديد: ${title}`,
            type: 'plan'
        }]);

        toast.success(planType === 'workout' ? "تم نشر خطة التمارين بنجاح! 🎉" : "تم نشر النظام بنجاح! 🎉");
        
        // التوجيه الذكي
        if (profile?.role === 'admin') {
            navigate(`/admin/clients/${userId}`);
        } else {
            navigate('/doctor-dashboard');
        }

    } catch (err: any) {
        console.error(err);
        toast.error("فشل الحفظ: " + err.message);
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-forest animate-pulse">جاري التجهيز...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 font-tajawal">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-6 font-bold uppercase tracking-widest">
        <Link to={profile?.role === 'admin' ? "/admin/clients" : "/doctor-dashboard"} className="hover:text-forest">المرضى</Link>
        <ChevronRight size={14} />
        <span className="text-forest">{targetUser?.full_name}</span> <ChevronRight size={14} />
        <span className="text-slate-800">{planType === 'workout' ? 'خطة تمارين جديدة' : 'نظام غذائي جديد'}</span>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
        <h1 className="text-2xl font-black text-slate-800 mb-6 italic">
          {planType === 'workout' ? 'إنشاء خطة تمارين جديدة ✨' : 'إنشاء نظام غذائي جديد ✨'}
        </h1>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
           <Avatar src={targetUser?.avatar_url ?? undefined} name={targetUser?.full_name ?? undefined} size="lg" />
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">المريض الحالي</p>
              <h3 className="font-black text-slate-700">{targetUser?.full_name}</h3>
           </div>
        </div>
        <Input label="اسم النظام" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: نظام تنشيف" />
      </div>

      <div className="space-y-6">
        {days.map((day, dIdx) => (
           <div key={dIdx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                 <div className="bg-forest/10 p-2 rounded-lg text-forest"><Calendar size={20}/></div>
                 <input 
                    className="font-black text-lg text-forest outline-none bg-transparent w-full" 
                    value={day.name} 
                    onChange={(e) => { const ns = [...days]; ns[dIdx].name = e.target.value; setDays(ns); }} 
                    placeholder="اسم اليوم (مثال: السبت)"
                 />
                 <div className="flex gap-2">
                    <button onClick={() => duplicateDay(dIdx)} title="تكرار اليوم" className="text-slate-400 hover:text-forest p-1"><Copy size={18}/></button>
                    <button onClick={() => removeDay(dIdx)} title="حذف اليوم" className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={18}/></button>
                 </div>
              </div>
              <div className="space-y-4">
                 {day.tasks.map((task, tIdx) => {
                   const isWorkout = task.type === 'workout';
                   return (
                     <div key={tIdx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 animate-in slide-in-from-right-2">
                       <div className="flex gap-2 items-center">
                          <select 
                            value={task.type} 
                            onChange={(e) => updateTaskType(dIdx, tIdx, e.target.value)} 
                            className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black w-28 shrink-0 appearance-none text-center outline-none focus:border-forest transition-colors"
                          >
                             {planType === 'workout' ? (
                               <option value="workout">💪 تمرين</option>
                             ) : (
                               <>
                                 <option value="other">عام</option>
                                 <option value="breakfast">🍳 إفطار</option>
                                 <option value="lunch">🍗 غداء</option>
                                 <option value="dinner">🥗 عشاء</option>
                                 <option value="snack">🍎 سناك</option>
                               </>
                             )}
                          </select>
                          {isWorkout ? (
                            <input 
                              type="text"
                              value={task.content} 
                              onChange={(e) => updateTaskContent(dIdx, tIdx, e.target.value)}
                              placeholder="اسم التمرين..."
                              className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold flex-1 outline-none focus:border-forest transition-colors"
                            />
                          ) : (
                            <textarea 
                              value={task.content} 
                              onChange={(e) => updateTaskContent(dIdx, tIdx, e.target.value)}
                              placeholder="تفاصيل الوجبة (اضغط Enter لكتابة كل مكون في سطر جديد)..."
                              rows={Math.max(1, task.content.split('\n').length)}
                              className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold flex-1 outline-none focus:border-forest transition-colors resize-y min-h-[48px] py-3.5"
                            />
                          )}
                          {isWorkout && (
                             <button
                               type="button"
                               onClick={() => openExerciseModal(dIdx, tIdx)}
                               className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black shrink-0 transition-colors"
                             >
                               اختر من المكتبة
                             </button>
                           )}
                          <button onClick={() => removeTaskFromDay(dIdx, tIdx)} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                       </div>

                       {isWorkout && (
                         <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3 mt-1 animate-in fade-in duration-200 text-right">
                           <div className="flex flex-col md:flex-row gap-3">
                             {/* Choose Preset */}
                             <div className="flex-1">
                               <label className="text-[10px] font-black text-slate-400 block mb-1">اختر تمرين من المكتبة</label>
                               <select
                                 value={task.metadata?.exercise_id || ''}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   const newDays = [...days];
                                   const currentTask = newDays[dIdx].tasks[tIdx];
                                   if (!currentTask.metadata) currentTask.metadata = {};
                                   
                                   if (val === 'custom') {
                                     currentTask.metadata = { exercise_id: 'custom' };
                                   } else if (val) {
                                     const found = presets.find(p => p.id === val);
                                     if (found) {
                                       currentTask.content = found.title;
                                       currentTask.metadata = {
                                         exercise_id: found.id,
                                         category: found.category,
                                         difficulty: found.difficulty,
                                         duration: found.default_duration,
                                         calories: found.default_calories,
                                         muscle: found.muscle,
                                         sets: found.default_sets,
                                         reps: '12',
                                         rest: '45s',
                                         steps: found.steps,
                                         mistakes: found.mistakes,
                                         tips: found.tips,
                                         image_url: found.image_url
                                       };
                                     }
                                   }
                                   setDays(newDays);
                                 }}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                               >
                                 <option value="">-- تمرين حر مخصص --</option>
                                 {presets.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                               </select>
                             </div>

                             {/* Target Muscle */}
                             <div className="w-full md:w-40">
                               <label className="text-[10px] font-black text-slate-400 block mb-1">العضلة المستهدفة</label>
                               <input
                                 type="text"
                                 placeholder="مثال: الفخذ"
                                 value={task.metadata?.muscle || ''}
                                 onChange={(e) => {
                                   const newDays = [...days];
                                   if (!newDays[dIdx].tasks[tIdx].metadata) newDays[dIdx].tasks[tIdx].metadata = {};
                                   newDays[dIdx].tasks[tIdx].metadata.muscle = e.target.value;
                                   setDays(newDays);
                                 }}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                               />
                             </div>
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {/* Sets & Reps */}
                             <div>
                               <label className="text-[10px] font-black text-slate-400 block mb-1">الجولات والتكرار</label>
                               <input
                                 type="text"
                                 placeholder="مثال: 3 جولات × 12 تكرار"
                                 value={task.metadata?.sets || ''}
                                 onChange={(e) => {
                                   const newDays = [...days];
                                   if (!newDays[dIdx].tasks[tIdx].metadata) newDays[dIdx].tasks[tIdx].metadata = {};
                                   newDays[dIdx].tasks[tIdx].metadata.sets = e.target.value;
                                   setDays(newDays);
                                 }}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                               />
                             </div>

                             {/* Duration */}
                             <div>
                               <label className="text-[10px] font-black text-slate-400 block mb-1">المدة المقدرة</label>
                               <input
                                 type="text"
                                 placeholder="مثال: 15 min"
                                 value={task.metadata?.duration || ''}
                                 onChange={(e) => {
                                   const newDays = [...days];
                                   if (!newDays[dIdx].tasks[tIdx].metadata) newDays[dIdx].tasks[tIdx].metadata = {};
                                   newDays[dIdx].tasks[tIdx].metadata.duration = e.target.value;
                                   setDays(newDays);
                                 }}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                               />
                             </div>

                             {/* Calories */}
                             <div>
                               <label className="text-[10px] font-black text-slate-400 block mb-1">السعرات المحروقة</label>
                               <input
                                 type="text"
                                 placeholder="مثال: 120 kcal"
                                 value={task.metadata?.calories || ''}
                                 onChange={(e) => {
                                   const newDays = [...days];
                                   if (!newDays[dIdx].tasks[tIdx].metadata) newDays[dIdx].tasks[tIdx].metadata = {};
                                   newDays[dIdx].tasks[tIdx].metadata.calories = e.target.value;
                                   setDays(newDays);
                                 }}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                               />
                             </div>

                             {/* Rest */}
                             <div>
                               <label className="text-[10px] font-black text-slate-400 block mb-1">وقت الراحة</label>
                               <input
                                 type="text"
                                 placeholder="مثال: 45ث"
                                 value={task.metadata?.rest || ''}
                                 onChange={(e) => {
                                   const newDays = [...days];
                                   if (!newDays[dIdx].tasks[tIdx].metadata) newDays[dIdx].tasks[tIdx].metadata = {};
                                   newDays[dIdx].tasks[tIdx].metadata.rest = e.target.value;
                                   setDays(newDays);
                                 }}
                                 className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                               />
                             </div>
                           </div>

                           {/* Doctor tips */}
                           <div>
                             <label className="text-[10px] font-black text-slate-400 block mb-1">تعليمات خاصة بالتمرين (اختياري)</label>
                             <textarea
                               placeholder="اكتب أي تعليمات أو نصائح إضافية للمريض هنا..."
                               value={task.metadata?.tips || ''}
                               onChange={(e) => {
                                 const newDays = [...days];
                                 if (!newDays[dIdx].tasks[tIdx].metadata) newDays[dIdx].tasks[tIdx].metadata = {};
                                 newDays[dIdx].tasks[tIdx].metadata.tips = e.target.value;
                                 setDays(newDays);
                               }}
                               className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none h-16 resize-none"
                             />
                           </div>
                         </div>
                       )}
                     </div>
                   );
                 })}
              </div>
              <button onClick={() => addTaskToDay(dIdx)} className="mt-4 text-xs font-black text-orange flex items-center gap-1 hover:underline transition-all"><Plus size={14}/> إضافة وجبة أو تمرين جديد</button>
           </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col md:flex-row gap-4">
         <button onClick={addDay} className="flex-1 py-4 border-2 border-dashed border-slate-200 rounded-2xl font-black text-slate-400 hover:border-forest hover:text-forest hover:bg-forest/5 transition-all flex items-center justify-center gap-2">
            <Plus size={20}/> إضافة يوم جديد
         </button>
         <Button onClick={handleSave} className="flex-1 py-4 shadow-xl shadow-forest/20" {...(submitting ? { disabled: true } : {})}>
            <Save size={20} className="ml-2" />
            {submitting ? 'جاري الحفظ...' : 'اعتماد ونشر النظام للعميل'}
         </Button>
      </div>

      {/* Exercise Selection Modal */}
      {isExModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[250] p-4 font-tajawal text-right" dir="rtl">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Dumbbell className="text-orange" size={22} /> اختر تمرين من مكتبة التمارين
              </h3>
              <button type="button" onClick={() => setIsExModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1.5 rounded-xl"><X size={18} /></button>
            </div>
            
            {/* Filters */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="ابحث بالاسم أو العضلة..." 
                  value={exSearch}
                  onChange={e => setExSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-forest"
                />
              </div>
              <select 
                value={exBodyPart} 
                onChange={e => setExBodyPart(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">عضلة الجسم (الكل)</option>
                <option value="الصدر">الصدر</option>
                <option value="الظهر">الظهر</option>
                <option value="الساقين">الساقين</option>
                <option value="الأكتاف">الأكتاف</option>
                <option value="الجذع">الجذع/البطن</option>
              </select>
              <select 
                value={exDifficulty} 
                onChange={e => setExDifficulty(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">الصعوبة (الكل)</option>
                <option value="BEGINNER">مبتدئ</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="ADVANCED">متقدم</option>
              </select>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {presets
                .filter(p => {
                  const matchesSearch = p.title.toLowerCase().includes(exSearch.toLowerCase()) || p.muscle.toLowerCase().includes(exSearch.toLowerCase());
                  const matchesBodyPart = !exBodyPart || p.body_part === exBodyPart;
                  const matchesDifficulty = !exDifficulty || p.difficulty === exDifficulty;
                  return matchesSearch && matchesBodyPart && matchesDifficulty;
                })
                .map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => selectExerciseForTask(p)}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-orange hover:bg-orange/5 cursor-pointer transition-all flex gap-3 items-center"
                  >
                    <img src={p.image_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-800">{p.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{p.muscle} • {p.equipment}</p>
                    </div>
                    <span className="text-[10px] bg-white border border-slate-200 text-slate-500 font-black px-2.5 py-1 rounded-lg">اختر</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePlan;