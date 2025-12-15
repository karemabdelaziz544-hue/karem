import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Plus, Trash2, Save, Calendar, Copy, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';

// تعريف الأنواع
type Task = { id?: string; content: string; is_completed?: boolean }; 
type PlanDay = { name: string; tasks: Task[] };

const EditPlan: React.FC = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [days, setDays] = useState<PlanDay[]>([]);
  
  // لتخزين IDs المهام التي تم حذفها لنقوم بحذفها من الداتابيز عند الحفظ
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        // 1. جلب تفاصيل الخطة
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('*, profiles(*, manager:profiles!manager_id(full_name))')
          .eq('id', planId)
          .single();

        if (planError) throw planError;

        setTitle(plan.title);
        setTargetUser(plan.profiles);

        // 2. جلب المهام
        const { data: tasks, error: tasksError } = await supabase
          .from('plan_tasks')
          .select('*')
          .eq('plan_id', planId)
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
                 is_completed: task.is_completed 
             });
          });

          // تحويلها لمصفوفة الـ State
          const loadedDays = Array.from(dayNamesSet).map(name => ({
              name,
              tasks: grouped[name]
          }));

          setDays(loadedDays.length > 0 ? loadedDays : [{ name: 'اليوم الأول', tasks: [{ content: '' }] }]);
        }

      } catch (err: any) {
        toast.error("فشل تحميل الخطة: " + err.message);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (planId) fetchPlanDetails();
  }, [planId]);


  // --- دوال التحكم ---

  const addDay = () => {
    setDays([...days, { name: `اليوم ${days.length + 1}`, tasks: [{ content: '' }] }]);
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
    newDays[dayIndex].tasks.push({ content: '' });
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

  const updateTaskContent = (dayIndex: number, taskIndex: number, value: string) => {
    const newDays = [...days];
    newDays[dayIndex].tasks[taskIndex].content = value;
    setDays(newDays);
  };

  const duplicateDay = (dayIndex: number) => {
    const dayToCopy = days[dayIndex];
    // نسخ المهام بدون ID عشان تعتبر جديدة
    const newTasks = dayToCopy.tasks.map(t => ({ content: t.content })); 
    
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
            .eq('id', planId);

        if (planError) throw planError;

        // 2. حذف المهام اللي اتمسحت من الداتابيز
        if (deletedTaskIds.length > 0) {
            await supabase.from('plan_tasks').delete().in('id', deletedTaskIds);
        }

        // 3. تحديث أو إضافة المهام
        let globalOrderIndex = 0;
        
        for (const day of days) {
            for (const task of day.tasks) {
                const taskData = {
                    plan_id: planId,
                    content: task.content,
                    day_name: day.name,
                    order_index: globalOrderIndex++,
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

    } catch (err: any) {
        toast.error("فشل الحفظ: " + err.message);
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
                <div className="space-y-3">
                    {day.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex gap-2">
                            <Input 
                                value={task.content} 
                                onChange={(e) => updateTaskContent(dayIndex, taskIndex, e.target.value)}
                                placeholder={`مهمة ${taskIndex + 1}`}
                                className="mb-0 text-sm"
                            />
                            <button onClick={() => removeTaskFromDay(dayIndex, taskIndex)} className="text-red-300 hover:text-red-500 px-2">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
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

    </div>
  );
};

export default EditPlan;