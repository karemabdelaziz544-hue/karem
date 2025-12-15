import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Plus, Trash2, Save, User, Users, Calendar, Copy } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
// تعريف شكل البيانات الجديد
type Task = { content: string; type: string }; // 👈 زودنا type
type PlanDay = { name: string; tasks: Task[] };

const CreatePlan: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // بيانات الخطة
  const [title, setTitle] = useState('');
  // هنا التغيير الكبير: مصفوفة أيام، وكل يوم جواه مهام
  const [days, setDays] = useState<PlanDay[]>([
    { name: 'اليوم الأول', tasks: [{ content: '' }] }
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, manager:profiles!manager_id(full_name)`)
        .eq('id', userId)
        .single();

      if (error) {
        toast.error("خطأ في جلب البيانات");
      } else {
        setTargetUser(data);
        setTitle(`نظام غذائي - ${new Date().toLocaleDateString('ar-EG')}`);
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId]);

  // --- دوال التحكم في الأيام والمهام ---

  // إضافة يوم جديد
  const addDay = () => {
setDays([...days, { name: `اليوم ${days.length + 1}`, tasks: [{ content: '', type: 'other' }] }]);  };

  // حذف يوم
  const removeDay = (dayIndex: number) => {
    if (days.length === 1) return toast.error("لا يمكن حذف اليوم الوحيد");
    const newDays = [...days];
    newDays.splice(dayIndex, 1);
    setDays(newDays);
  };

  // تغيير اسم اليوم
  const updateDayName = (dayIndex: number, newName: string) => {
    const newDays = [...days];
    newDays[dayIndex].name = newName;
    setDays(newDays);
  };

  // إضافة مهمة داخل يوم معين
  const addTaskToDay = (dayIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].tasks.push({ content: '' });
    setDays(newDays);
  };

  // حذف مهمة من يوم معين
  const removeTaskFromDay = (dayIndex: number, taskIndex: number) => {
    const newDays = [...days];
    if (newDays[dayIndex].tasks.length === 1) return; // لازم مهمة واحدة على الأقل
    newDays[dayIndex].tasks.splice(taskIndex, 1);
    setDays(newDays);
    newDays[dayIndex].tasks.push({ content: '', type: 'other' }); // 👈 الافتراضي
  };
const updateTaskType = (dayIndex: number, taskIndex: number, newType: string) => {
    const newDays = [...days];
    newDays[dayIndex].tasks[taskIndex].type = newType;
    setDays(newDays);
};
  // تحديث محتوى المهمة
  const updateTaskContent = (dayIndex: number, taskIndex: number, value: string) => {
    const newDays = [...days];
    newDays[dayIndex].tasks[taskIndex].content = value;
    setDays(newDays);
  };

  // تكرار اليوم (ميزة إضافية مفيدة)
  const duplicateDay = (dayIndex: number) => {
    const dayToCopy = days[dayIndex];
    // نسخ عميق عشان مايأثرش على القديم
    const newDay = JSON.parse(JSON.stringify(dayToCopy));
    newDay.name = `${dayToCopy.name} (نسخة)`;
    setDays([...days, newDay]);
    toast.success("تم تكرار اليوم!");
  };

  // --- الحفظ ---
  const handleSave = async () => {
    if (!title) return toast.error("اكتب عنواناً للخطة");
    
    // التأكد إن مفيش مهام فاضية
    for (const day of days) {
        if (!day.name) return toast.error("تأكد من تسمية جميع الأيام");
        for (const task of day.tasks) {
            if (!task.content) return toast.error(`يوجد مهمة فارغة في ${day.name}`);
        }
    }

    setSubmitting(true);
    try {
        // 1. إنشاء الخطة
        const { data: planData, error: planError } = await supabase
            .from('plans')
            .insert([{
                user_id: userId,
                title: title,
                status: 'active' // 👈 العمود اللي كان ناقص
            }])
            .select()
            .single();

        if (planError) throw planError;

        // 2. تجميع كل المهام من كل الأيام للتحضير للإدخال
        let allTasksToInsert: any[] = [];
        let globalOrderIndex = 0;

        days.forEach((day) => {
            day.tasks.forEach((task) => {
                allTasksToInsert.push({
                    plan_id: planData.id,
                    content: task.content,
                    task_type: task.type, // 👈 الحقل الجديد
                    day_name: day.name, // 👈 اسم اليوم الجديد
                    order_index: globalOrderIndex++,
                    is_completed: false
                });
            });
        });

        // 3. إدخال المهام دفعة واحدة
        const { error: tasksError } = await supabase
            .from('plan_tasks')
            .insert(allTasksToInsert);

        if (tasksError) throw tasksError;

        toast.success("تم إنشاء النظام متعدد الأيام بنجاح! 🎉");
        navigate(`/admin/clients/${userId}`);

    } catch (err: any) {
        toast.error("فشل الحفظ: " + err.message);
    } finally {
        setSubmitting(false);
    }
    // 👇 إضافة إشعار للعميل
await supabase.from('notifications').insert([{
    user_id: userId,
    is_admin_notification: false,
    type: 'plan',
    title: 'تم إضافة نظام غذائي جديد 🥗',
    message: `عنوان الخطة: ${title}`,
    link: '/dashboard', // يوديه للداشبورد عشان يشوفها
}]);
  };

  if (loading) return <div className="p-10 text-center font-bold text-forest">جاري التجهيز...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
        <Link to="/admin/clients" className="hover:text-forest">العملاء</Link>
        <ChevronRight size={14} />
        <Link to={`/admin/clients/${userId}`} className="hover:text-forest">{targetUser?.full_name}</Link>
        <ChevronRight size={14} />
        <span className="text-forest font-bold">خطة جديدة</span>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6">
        <h1 className="text-2xl font-extrabold text-forest mb-6">إنشاء نظام جديد</h1>

        {/* كارت العميل */}
        {targetUser && (
           <div className={`p-4 rounded-xl border mb-6 flex items-center gap-4 ...`}>
    <Avatar src={targetUser.avatar_url} name={targetUser.full_name} size="lg" />
    <div>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">خطة لـ: {targetUser.full_name}</h3>
                    <p className="text-xs text-gray-500">
                        {targetUser.manager ? `تابع لـ ${targetUser.manager.full_name}` : 'حساب رئيسي'}
                    </p>
                </div>
            </div>
        )}

        <Input label="عنوان النظام" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: دايت شهر نوفمبر" />
      </div>

      {/* 👇 قائمة الأيام 👇 */}
      <div className="space-y-6">
        {days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 relative animate-in fade-in">
                
                {/* هيدر اليوم */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="bg-forest/10 p-2 rounded-lg text-forest"><Calendar size={20}/></div>
                    <div className="flex-1">
                        <input 
                            type="text" 
                            value={day.name}
                            onChange={(e) => updateDayName(dayIndex, e.target.value)}
                            className="font-bold text-lg text-forest bg-transparent outline-none w-full placeholder-gray-300"
                            placeholder="اسم اليوم (مثال: السبت)"
                        />
                    </div>
                    <button onClick={() => duplicateDay(dayIndex)} title="تكرار اليوم" className="text-gray-400 hover:text-forest p-2"><Copy size={18}/></button>
                    {days.length > 1 && (
                        <button onClick={() => removeDay(dayIndex)} title="حذف اليوم" className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                    )}
                </div>

                {/* مهام اليوم */}
                <div className="space-y-3">
                    {day.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex gap-2">
                            <Input 
                                value={task.content} 
                                onChange={(e) => updateTaskContent(dayIndex, taskIndex, e.target.value)}
                                placeholder={`وجبة / تمرين ${taskIndex + 1}`}
                                className="mb-0 text-sm"
                            />
                            {/* ... داخل day.tasks.map ... */}
<div key={taskIndex} className="flex gap-2 items-center mb-2">
    {/* قائمة اختيار النوع */}
    <select
        value={task.type}
        onChange={(e) => updateTaskType(dayIndex, taskIndex, e.target.value)}
        className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:border-forest outline-none w-28 shrink-0"
    >
        <option value="other">عام</option>
        <option value="breakfast">🍳 إفطار</option>
        <option value="lunch">🍗 غداء</option>
        <option value="dinner">🥗 عشاء</option>
        <option value="snack">🍎 سناك</option>
        <option value="workout">💪 تمرين</option>
    </select>

    {/* حقل النص */}
    <Input 
        value={task.content} 
        onChange={(e) => updateTaskContent(dayIndex, taskIndex, e.target.value)}
        placeholder={`مهمة ${taskIndex + 1}`}
        className="mb-0 text-sm flex-1"
    />
    
    <button onClick={() => removeTaskFromDay(dayIndex, taskIndex)} className="text-red-300 hover:text-red-500 px-2">
        <Trash2 size={16}/>
    </button>
</div>
                            {day.tasks.length > 1 && (
                                <button onClick={() => removeTaskFromDay(dayIndex, taskIndex)} className="text-red-300 hover:text-red-500 px-2">
                                    <Trash2 size={16}/>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button onClick={() => addTaskToDay(dayIndex)} className="mt-4 text-sm font-bold text-orange hover:bg-orange/5 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                    <Plus size={16}/> إضافة وجبة/تمرين لهذا اليوم
                </button>
            </div>
        ))}
      </div>

      {/* زر إضافة يوم جديد وزر الحفظ */}
      <div className="mt-8 flex flex-col md:flex-row gap-4">
        <button 
            onClick={addDay}
            className="flex-1 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-forest hover:text-forest hover:bg-forest/5 transition-all flex justify-center items-center gap-2"
        >
            <Plus size={20} /> إضافة يوم جديد
        </button>
        
        <Button className="flex-1 justify-center py-4 text-lg shadow-xl shadow-forest/20" onClick={handleSave} disabled={submitting}>
            <Save size={24} className="ml-2" />
            {submitting ? 'جاري الحفظ...' : 'حفظ النظام بالكامل'}
        </Button>
      </div>

    </div>
  );
};

export default CreatePlan;