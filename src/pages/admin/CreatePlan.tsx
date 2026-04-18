import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight, Plus, Trash2, Save, User, Calendar, Copy } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import type { Profile, PlanTaskInsert } from '../../types';

type Task = { content: string; type: string };
type PlanDay = { name: string; tasks: Task[] };

const CreatePlan: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { profile, user: currentUser } = useAuth();

  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<PlanDay[]>([{ name: 'اليوم الأول', tasks: [{ content: '', type: 'other' }] }]);

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
        setTitle(`نظام غذائي - ${new Date().toLocaleDateString('ar-EG')}`);
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId, currentUser, profile, navigate]);

  const addDay = () => setDays([...days, { name: `اليوم ${days.length + 1}`, tasks: [{ content: '', type: 'other' }] }]);
  const removeDay = (idx: number) => {
    if (days.length === 1) return;
    const ns = [...days]; ns.splice(idx, 1); setDays(ns);
  };
  const addTaskToDay = (dIdx: number) => {
    const ns = [...days]; ns[dIdx].tasks.push({ content: '', type: 'other' }); setDays(ns);
  };
  const removeTaskFromDay = (dIdx: number, tIdx: number) => {
    const ns = [...days]; ns[dIdx].tasks.splice(tIdx, 1); setDays(ns);
  };
  const updateTaskType = (dIdx: number, tIdx: number, type: string) => {
    const ns = [...days]; ns[dIdx].tasks[tIdx].type = type; setDays(ns);
  };
  const updateTaskContent = (dIdx: number, tIdx: number, val: string) => {
    const ns = [...days]; ns[dIdx].tasks[tIdx].content = val; setDays(ns);
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
                status: 'active' // 👈 دي اللي بتخليها تظهر في الداشبورد عند العميل
            }])
            .select().single();

        if (planError) throw planError;

        // 2. تجهيز كل التاسكات من كل الأيام وربطها بالـ plan_id الجديد
        const allTasksToInsert: PlanTaskInsert[] = []; 
        let globalOrder = 0;

        days.forEach((day) => {
            day.tasks.forEach((task) => {
                if (task.content.trim() !== "") {
                    allTasksToInsert.push({
                        plan_id: planData.id, // 👈 الربط بالخطة اللي لسه مكريتينها
                        content: task.content,
                        task_type: task.type,
                        day_name: day.name,
                        order_index: globalOrder++,
                        is_completed: false
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
            title: '🥗 نظام غذائي جديد',
            message: `قام الدكتور بإرسال نظامك الغذائي الجديد: ${title}`,
            type: 'plan'
        }]);

        toast.success("تم نشر النظام بنجاح! 🎉");
        
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
        <span className="text-slate-800">خطة جديدة</span>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
        <h1 className="text-2xl font-black text-slate-800 mb-6 italic">إنشاء نظام غذائي جديد ✨</h1>
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
              <div className="space-y-3">
                 {day.tasks.map((task, tIdx) => (
                   <div key={tIdx} className="flex gap-2 items-center mb-2 animate-in slide-in-from-right-2">
                      <select value={task.type} onChange={(e) => updateTaskType(dIdx, tIdx, e.target.value)} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black w-28 shrink-0 appearance-none text-center outline-none focus:border-forest transition-colors">
                         <option value="other">عام</option>
                         <option value="breakfast">🍳 إفطار</option>
                         <option value="lunch">🍗 غداء</option>
                         <option value="dinner">🥗 عشاء</option>
                         <option value="snack">🍎 سناك</option>
                         <option value="workout">💪 تمرين</option>
                      </select>
                      <Input 
                        label="" 
                        value={task.content} 
                        onChange={(e) => updateTaskContent(dIdx, tIdx, e.target.value)}
                        placeholder="تفاصيل الوجبة أو التمرين..."
                        className="mb-0 flex-1 text-sm font-bold"
                      />
                      <button onClick={() => removeTaskFromDay(dIdx, tIdx)} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={16}/></button>
                   </div>
                 ))}
              </div>
              <button onClick={() => addTaskToDay(dIdx)} className="mt-4 text-xs font-black text-orange flex items-center gap-1 hover:underline transition-all"><Plus size={14}/> إضافة وجبة جديدة</button>
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
    </div>
  );
};

export default CreatePlan;