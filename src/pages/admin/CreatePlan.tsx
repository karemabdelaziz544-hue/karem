import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import { Calendar, Trash2, Plus, PlusCircle, Save, ArrowRight, X } from 'lucide-react';

const CreatePlan: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [days, setDays] = useState([{ id: 1, tasks: [""] }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
      if (data) setClientName(data.full_name);
    };
    if (userId) fetchClient();
  }, [userId]);

  const addDay = () => setDays([...days, { id: days.length + 1, tasks: [""] }]);
  const removeDay = (index: number) => {
    if (days.length === 1) return;
    setDays(days.filter((_, i) => i !== index).map((d, i) => ({ ...d, id: i + 1 })));
  };
  
  const addTask = (dayIdx: number) => {
    const newDays = [...days];
    newDays[dayIdx].tasks.push("");
    setDays(newDays);
  };
  
  const updateTask = (dayIdx: number, taskIdx: number, val: string) => {
    const newDays = [...days];
    newDays[dayIdx].tasks[taskIdx] = val;
    setDays(newDays);
  };
  
  const removeTask = (dayIdx: number, taskIdx: number) => {
    const newDays = [...days];
    newDays[dayIdx].tasks = newDays[dayIdx].tasks.filter((_, i) => i !== taskIdx);
    setDays(newDays);
  };

  const savePlan = async () => {
    if (!planTitle.trim()) return alert("اكتب عنوان الخطة");
    setLoading(true);

    try {
      const { data: plan, error } = await supabase
        .from('plans').insert([{ user_id: userId, title: planTitle }]).select().single();
      if (error) throw error;

      const allTasks: any[] = [];
      days.forEach(day => {
        day.tasks.forEach(content => {
          if (content.trim()) {
            allTasks.push({ 
              plan_id: plan.id, 
              content: content.trim(), 
              day_number: day.id,
              is_completed: false
            });
          }
        });
      });

      if (allTasks.length > 0) await supabase.from('plan_tasks').insert(allTasks);
      
      // تفعيل الاشتراك عند إرسال الخطة
      await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', userId);

      alert("تم إرسال الخطة بنجاح!");
      navigate(`/admin/clients/${userId}`); // العودة لصفحة العميل
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100"><ArrowRight /></button>
        <div>
          <h1 className="text-2xl font-extrabold text-forest">نظام جديد</h1>
          <p className="text-gray-500">للعميل: <span className="font-bold text-orange">{clientName}</span></p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-lg border border-orange/10 mb-8">
        <div className="mb-8">
          <label className="block font-bold text-gray-700 mb-2">عنوان الخطة</label>
          <input 
            type="text" 
            value={planTitle} 
            onChange={e => setPlanTitle(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-orange outline-none text-lg font-bold"
            placeholder="مثال: دايت الأسبوع الأول"
          />
        </div>

        <div className="space-y-6">
          {days.map((day, dIdx) => (
            <div key={dIdx} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative group">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-forest flex items-center gap-2 text-lg"><Calendar className="text-orange"/> اليوم {day.id}</h4>
                 {days.length > 1 && <button onClick={() => removeDay(dIdx)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-lg shadow-sm"><Trash2 size={18}/></button>}
              </div>
              <div className="space-y-3 pl-4 border-r-2 border-gray-200 mr-1">
                {day.tasks.map((task, tIdx) => (
                  <div key={tIdx} className="flex gap-3">
                    <input 
                      type="text" 
                      value={task} 
                      onChange={e => updateTask(dIdx, tIdx, e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-forest outline-none bg-white"
                      placeholder="مهمة / وجبة..."
                    />
                    <button onClick={() => removeTask(dIdx, tIdx)} className="text-gray-300 hover:text-red-500 px-2"><X size={18} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => addTask(dIdx)} className="mt-4 text-sm font-bold text-orange flex items-center gap-1 hover:bg-orange/10 px-3 py-2 rounded-lg transition-colors">
                <Plus size={16} /> إضافة مهمة
              </button>
            </div>
          ))}
        </div>

        <button onClick={addDay} className="w-full py-4 mt-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-forest hover:text-forest transition-all flex justify-center gap-2">
           <PlusCircle /> إضافة يوم جديد
        </button>
      </div>

      <div className="sticky bottom-6">
        <Button onClick={savePlan} className="w-full justify-center py-4 text-lg font-bold shadow-2xl" disabled={loading}>
          {loading ? 'جاري الحفظ...' : <><Save className="mr-2" /> حفظ وإرسال الخطة</>}
        </Button>
      </div>
    </div>
  );
};

export default CreatePlan;