import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Plus, Trash2, Save, Calendar, Copy, ArrowRight, Loader2, Search, Dumbbell, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';
import type { Profile } from '../../types';

// تعريف الأنواع
type Task = { id?: string; content: string; type?: string; metadata?: any; is_completed?: boolean }; 
type PlanDay = { name: string; tasks: Task[] };

const EditPlan: React.FC = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [days, setDays] = useState<PlanDay[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [planType, setPlanType] = useState('nutrition');

  // Exercise Selection Modal States
  const [isExModalOpen, setIsExModalOpen] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exBodyPart, setExBodyPart] = useState('');
  const [exDifficulty, setExDifficulty] = useState('');
  const [activeTaskIndices, setActiveTaskIndices] = useState<{ dayIndex: number; taskIndex: number } | null>(null);
  
  // لتخزين IDs المهام التي تم حذفها لنقوم بحذفها من الداتابيز عند الحفظ
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        // 1. جلب تفاصيل الخطة
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('*, profiles(*, manager:profiles!manager_id(full_name))')
          .eq('id', planId!)
          .single();

        if (planError) throw planError;

        setTitle(plan.title);
        setTargetUser(plan.profiles);
        setPlanType(plan.plan_type || 'nutrition');

        // 2. جلب المهام
        const { data: tasks, error: tasksError } = await supabase
          .from('plan_tasks')
          .select('*')
          .eq('plan_id', planId!)
          .order('order_index', { ascending: true });

        if (tasksError) throw tasksError;

        // 3. تجميع المهام في أيام
        if (tasks) {
          const grouped: Record<string, Task[]> = {};
          // نستخدم Set للحفاظ على ترتيب الأيام
          const dayNamesSet = new Set<string>();
          
          tasks.forEach((task) => {
             const dName = task.day_name || 'اليوم الأول';
             if (!grouped[dName]) {
                 grouped[dName] = [];
                 dayNamesSet.add(dName);
             }
             grouped[dName].push({ 
                 id: task.id, 
                 content: task.content,
                 type: task.task_type || 'other',
                 metadata: task.metadata || {},
                 is_completed: task.is_completed ?? false 
             });
          });

          // تحويلها لمصفوفة الـ State
          const loadedDays = Array.from(dayNamesSet).map(name => ({
              name,
              tasks: grouped[name]
          }));

          setDays(loadedDays.length > 0 ? loadedDays : [{ name: 'اليوم الأول', tasks: [{ content: '', type: 'other', metadata: {} }] }]);
        }

      } catch (err) {
        toast.error("فشل تحميل الخطة");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (planId) fetchPlanDetails();
  }, [planId]);

  useEffect(() => {
    const fetchPresets = async () => {
      const { data } = await supabase.from('preset_exercises' as any).select('*').order('title');
      if (data) setPresets(data);
    };
    fetchPresets();
  }, []);

  // --- دوال التحكم ---

  const addDay = () => {
    setDays([...days, { name: `اليوم ${days.length + 1}`, tasks: [{ content: '', type: planType === 'workout' ? 'workout' : 'other', metadata: {} }] }]);
  };

  const removeDay = (dayIndex: number) => {
    if (days.length === 1) return toast.error("لا يمكن حذف اليوم الوحيد");
    
    // نجمع IDs المهام المحذوفة في هذا اليوم
    const dayTasks = days[dayIndex].tasks;
    const idsToDelete = dayTasks.filter(t => t.id).map(t => t.id as string);
    setDeletedTaskIds(prev => [...prev, ...idsToDelete]);

    const newDays = [...days];
    newDays.splice(dayIndex, 1);
    setDays(newDays);
  };

  const updateDayName = (dayIndex: number, newName: string) => {
    const newDays = [...days];
    newDays[dayIndex].name = newName;
    setDays(newDays);
  };

  const addTaskToDay = (dayIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].tasks.push({ content: '', type: planType === 'workout' ? 'workout' : 'other', metadata: {} });
    setDays(newDays);
  };

  const removeTaskFromDay = (dayIndex: number, taskIndex: number) => {
    const newDays = [...days];
    const taskToDelete = newDays[dayIndex].tasks[taskIndex];
    
    // لو المهمة كانت محفوظة، ضيفها لقائمة الحذف
    if (taskToDelete.id) {
        setDeletedTaskIds(prev => [...prev, taskToDelete.id as string]);
    }

    newDays[dayIndex].tasks.splice(taskIndex, 1);
    setDays(newDays);
  };

  const updateTaskType = (dayIndex: number, taskIndex: number, type: string) => {
    const newDays = [...days];
    newDays[dayIndex].tasks[taskIndex].type = type;
    if (type === 'workout' && !newDays[dayIndex].tasks[taskIndex].metadata) {
      newDays[dayIndex].tasks[taskIndex].metadata = {};
    }
    setDays(newDays);
  };

  const updateTaskContent = (dayIndex: number, taskIndex: number, value: string) => {
    const newDays = [...days];
    newDays[dayIndex].tasks[taskIndex].content = value;
    setDays(newDays);
  };

  const openExerciseModal = (dayIndex: number, taskIndex: number) => {
    setActiveTaskIndices({ dayIndex, taskIndex });
    setExSearch('');
    setExBodyPart('');
    setExDifficulty('');
    setIsExModalOpen(true);
  };

  const selectExerciseForTask = (exercise: any) => {
    if (activeTaskIndices === null) return;
    const { dayIndex, taskIndex } = activeTaskIndices;
    const ns = [...days];
    ns[dayIndex].tasks[taskIndex].content = exercise.title;
    ns[dayIndex].tasks[taskIndex].type = 'workout';
    ns[dayIndex].tasks[taskIndex].metadata = {
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

  const duplicateDay = (dayIndex: number) => {
    const dayToCopy = days[dayIndex];
    // نسخ المهام بدون ID عشان تعتبر جديدة
    const newTasks = dayToCopy.tasks.map(t => ({ 
      content: t.content,
      type: t.type || 'other',
      metadata: t.metadata ? JSON.parse(JSON.stringify(t.metadata)) : {}
    })); 
    
    const newDay = { name: `${dayToCopy.name} (نسخة)`, tasks: newTasks };
    setDays([...days, newDay]);
    toast.success("تم تكرار اليوم!");
  };

  // --- الحفظ ---
  const handleSave = async () => {
    if (!title) return toast.error("اكتب عنواناً للخطة");
    
    setSubmitting(true);
    try {
        // 1. تحديث عنوان الخطة
        const { error: planError } = await supabase
            .from('plans')
            .update({ title: title })
            .eq('id', planId!);

        if (planError) throw planError;

        // 2. حذف المهام اللي اتمسحت من الداتابيز
        if (deletedTaskIds.length > 0) {
            await supabase.from('plan_tasks').delete().in('id', deletedTaskIds);
        }

        // 3. تحديث أو إضافة المهام
        let globalOrderIndex = 0;
        
        for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
            const day = days[dayIdx];
            for (const task of day.tasks) {
                const taskData = {
                    plan_id: planId!,
                    content: task.content,
                    task_type: task.type || 'other',
                    day_name: day.name,
                    day_number: dayIdx + 1, // Store the calculated day number directly for ease of filtering
                    order_index: globalOrderIndex++,
                    metadata: task.type === 'workout' ? task.metadata : null,
                    // نحافظ على حالة الإنجاز لو موجودة، أو false للجديد
                    is_completed: task.is_completed || false 
                };

                if (task.id) {
                    // تحديث (Update)
                    await supabase.from('plan_tasks').update(taskData).eq('id', task.id);
                } else {
                    // جديد (Insert)
                    await supabase.from('plan_tasks').insert(taskData);
                }
            }
        }

        toast.success("تم تحديث النظام بنجاح! 🎉");
        navigate(-1); // رجوع للصفحة السابقة

    } catch (err) {
        toast.error("فشل الحفظ");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-forest">جاري تحميل الخطة...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
            <ArrowRight />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-forest">تعديل النظام</h1>
          <p className="text-gray-500">للعميل: <span className="font-bold text-orange">{targetUser?.full_name}</span></p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6">
        <Input label="عنوان النظام" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Days List */}
      <div className="space-y-6">
        {days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 relative animate-in fade-in">
                
                {/* Day Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="bg-forest/10 p-2 rounded-lg text-forest"><Calendar size={20}/></div>
                    <div className="flex-1">
                        <input 
                            type="text" 
                            value={day.name}
                            onChange={(e) => updateDayName(dayIndex, e.target.value)}
                            className="font-bold text-lg text-forest bg-transparent outline-none w-full placeholder-gray-300"
                            placeholder="اسم اليوم"
                        />
                    </div>
                    <button onClick={() => duplicateDay(dayIndex)} title="تكرار اليوم" className="text-gray-400 hover:text-forest p-2"><Copy size={18}/></button>
                    {days.length > 1 && (
                        <button onClick={() => removeDay(dayIndex)} title="حذف اليوم" className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                    )}
                </div>

                {/* Tasks */}
                <div className="space-y-4">
                    {day.tasks.map((task, taskIndex) => {
                       const isWorkout = task.type === 'workout';
                       return (
                         <div key={taskIndex} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 animate-in slide-in-from-right-2">
                           <div className="flex gap-2 items-center">
                              <select 
                                value={task.type} 
                                onChange={(e) => updateTaskType(dayIndex, taskIndex, e.target.value)} 
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
                                   onChange={(e) => updateTaskContent(dayIndex, taskIndex, e.target.value)}
                                   placeholder="اسم التمرين..."
                                   className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold flex-1 outline-none focus:border-forest transition-colors"
                                 />
                               ) : (
                                 <textarea 
                                   value={task.content} 
                                   onChange={(e) => updateTaskContent(dayIndex, taskIndex, e.target.value)}
                                   placeholder="تفاصيل الوجبة (اضغط Enter لكتابة كل مكون في سطر جديد)..."
                                   rows={Math.max(1, task.content.split('\n').length)}
                                   className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold flex-1 outline-none focus:border-forest transition-colors resize-y min-h-[48px] py-3.5"
                                 />
                               )}
                               {isWorkout && (
                                 <button
                                   type="button"
                                   onClick={() => openExerciseModal(dayIndex, taskIndex)}
                                   className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black shrink-0 transition-colors"
                                 >
                                   اختر من المكتبة
                                 </button>
                               )}
                               <button onClick={() => removeTaskFromDay(dayIndex, taskIndex)} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
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
                                       const currentTask = newDays[dayIndex].tasks[taskIndex];
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
                                       if (!newDays[dayIndex].tasks[taskIndex].metadata) newDays[dayIndex].tasks[taskIndex].metadata = {};
                                       newDays[dayIndex].tasks[taskIndex].metadata.muscle = e.target.value;
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
                                       if (!newDays[dayIndex].tasks[taskIndex].metadata) newDays[dayIndex].tasks[taskIndex].metadata = {};
                                       newDays[dayIndex].tasks[taskIndex].metadata.sets = e.target.value;
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
                                       if (!newDays[dayIndex].tasks[taskIndex].metadata) newDays[dayIndex].tasks[taskIndex].metadata = {};
                                       newDays[dayIndex].tasks[taskIndex].metadata.duration = e.target.value;
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
                                       if (!newDays[dayIndex].tasks[taskIndex].metadata) newDays[dayIndex].tasks[taskIndex].metadata = {};
                                       newDays[dayIndex].tasks[taskIndex].metadata.calories = e.target.value;
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
                                       if (!newDays[dayIndex].tasks[taskIndex].metadata) newDays[dayIndex].tasks[taskIndex].metadata = {};
                                       newDays[dayIndex].tasks[taskIndex].metadata.rest = e.target.value;
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
                                     if (!newDays[dayIndex].tasks[taskIndex].metadata) newDays[dayIndex].tasks[taskIndex].metadata = {};
                                     newDays[dayIndex].tasks[taskIndex].metadata.tips = e.target.value;
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

                <button onClick={() => addTaskToDay(dayIndex)} className="mt-4 text-sm font-bold text-orange hover:bg-orange/5 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                    <Plus size={16}/> إضافة مهمة
                </button>
            </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col md:flex-row gap-4">
        <button 
            onClick={addDay}
            className="flex-1 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-forest hover:text-forest hover:bg-forest/5 transition-all flex justify-center items-center gap-2"
        >
            <Plus size={20} /> إضافة يوم جديد
        </button>
        
        <Button className="flex-1 justify-center py-4 text-lg shadow-xl shadow-forest/20" onClick={handleSave} disabled={submitting}>
            <Save size={24} className="ml-2" />
            {submitting ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات'}
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

export default EditPlan;