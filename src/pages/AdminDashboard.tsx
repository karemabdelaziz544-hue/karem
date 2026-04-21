import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// 👇 التعديل: إزالة useAuth وإضافة useNavigate
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { Users, Save, X, Plus, Trash2, Calendar, CheckCircle, Search, PlusCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate(); // 👈 أضفنا useNavigate
  
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [days, setDays] = useState([{ id: 1, tasks: [""] }]); 

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(u => 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });
    
    setUsers(data || []);
    setFilteredUsers(data || []);
    setLoading(false);
  };

  const addDay = () => {
    setDays([...days, { id: days.length + 1, tasks: [""] }]);
  };

  const removeDay = (index: number) => {
    if (days.length === 1) return;
    const newDays = days.filter((_, i) => i !== index);
    const reorderedDays = newDays.map((day, i) => ({ ...day, id: i + 1 }));
    setDays(reorderedDays);
  };

  const addTaskToDay = (dayIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].tasks.push("");
    setDays(newDays);
  };

  const removeTaskFromDay = (dayIndex: number, taskIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].tasks = newDays[dayIndex].tasks.filter((_, i) => i !== taskIndex);
    setDays(newDays);
  };

  const updateTaskContent = (dayIndex: number, taskIndex: number, value: string) => {
    const newDays = [...days];
    newDays[dayIndex].tasks[taskIndex] = value;
    setDays(newDays);
  };

  const savePlan = async () => {
    if (!selectedUser || !planTitle.trim()) return alert("يرجى كتابة عنوان الخطة واختيار العميل");

    try {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert([{ user_id: selectedUser, title: planTitle }])
        .select()
        .single();

      if (planError) throw planError;

      const allTasks: any[] = [];
      days.forEach((day) => {
        day.tasks.forEach((taskContent) => {
          if (taskContent.trim()) {
            allTasks.push({
              plan_id: plan.id,
              content: taskContent.trim(),
              day_number: day.id,
              is_completed: false
            });
          }
        });
      });

      if (allTasks.length > 0) {
        const { error: tasksError } = await supabase.from('plan_tasks').insert(allTasks);
        if (tasksError) throw tasksError;
      }

      await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', selectedUser);
      
      alert("تم إرسال الخطة بنجاح! 🚀");
      
      setPlanTitle("");
      setDays([{ id: 1, tasks: [""] }]);
      setSelectedUser(null);
      fetchUsers();
      
    } catch (error: any) {
      alert("حدث خطأ: " + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-forest">جاري تحميل البيانات...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans" dir="rtl">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
           <div className="bg-forest p-1.5 rounded-lg"><Logo className="h-8 w-8" /></div>
           <div>
             <h1 className="text-xl font-bold text-forest">لوحة الإدارة</h1>
             <p className="text-xs text-gray-500">بناء الخطط اليومية</p>
           </div>
        </div>
        {/* 👇 التعديل: استخدام supabase.auth.signOut() مع التوجيه */}
        <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} className="text-sm h-10 px-4">خروج</Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-150px)]">
        
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-lg text-forest flex items-center gap-2"><Users size={20} /> قائمة العملاء</h2>
            <div className="mt-2 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="w-full pr-9 pl-3 py-2 rounded-lg border border-gray-200 focus:border-orange outline-none text-sm bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u.id)} 
                className={`p-4 rounded-xl cursor-pointer transition-all border flex justify-between items-center group
                  ${selectedUser === u.id 
                    ? 'bg-forest text-white border-forest shadow-md' 
                    : 'bg-white border-transparent hover:bg-orange/5 hover:border-orange/30 text-gray-700'}
                `}
              >
                <div>
                  <span className="font-bold block">{u.full_name || 'عميل بدون اسم'}</span>
                  <span className={`text-xs font-mono dir-ltr ${selectedUser === u.id ? 'text-white/70' : 'text-gray-500'}`}>{u.phone}</span>
                </div>
                {u.subscription_status === 'active' && <CheckCircle size={18} className={selectedUser === u.id ? 'text-white' : 'text-green-500'} />}
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-center text-gray-400 py-10">لا يوجد عملاء حالياً</p>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {selectedUser ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                 <h3 className="font-bold text-xl text-forest">إعداد النظام الغذائي</h3>
                 <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><X /></button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-2">عنوان الخطة (مثال: الأسبوع الأول)</label>
                  <input 
                    type="text" 
                    value={planTitle} 
                    onChange={(e) => setPlanTitle(e.target.value)} 
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-orange outline-none transition-colors bg-white" 
                    placeholder="اكتب عنواناً مميزاً للخطة..." 
                  />
                </div>

                <div className="space-y-6">
                  {days.map((day, dayIndex) => (
                    <div key={dayIndex} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 relative group-day">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                        <h4 className="font-bold text-orange flex items-center gap-2 text-lg">
                          <div className="bg-white p-1.5 rounded-lg shadow-sm border border-orange/10"><Calendar size={20}/></div>
                          اليوم {day.id}
                        </h4>
                        {days.length > 1 && (
                          <button onClick={() => removeDay(dayIndex)} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 size={14} /> حذف اليوم
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {day.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex gap-3 items-center">
                            <span className="text-gray-400 text-xs font-mono w-6 text-center pt-1">{taskIndex + 1}</span>
                            <input 
                              type="text" 
                              value={task} 
                              onChange={(e) => updateTaskContent(dayIndex, taskIndex, e.target.value)}
                              className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:border-forest outline-none bg-white focus:shadow-sm transition-all"
                              placeholder="وجبة إفطار، غداء، تمرين، شرب ماء..."
                            />
                            <button 
                              onClick={() => removeTaskFromDay(dayIndex, taskIndex)} 
                              className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف المهمة"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button onClick={() => addTaskToDay(dayIndex)} className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl font-bold hover:border-forest/40 hover:text-forest hover:bg-white transition-all flex items-center justify-center gap-2 text-sm">
                        <Plus size={16} /> إضافة وجبة / مهمة
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={addDay} className="mt-8 w-full py-4 border-2 border-dashed border-orange/30 text-orange rounded-2xl font-bold hover:bg-orange/5 transition-all flex items-center justify-center gap-2 text-lg">
                  <PlusCircle size={24} /> إضافة يوم جديد للخطة
                </button>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <Button onClick={savePlan} className="w-full justify-center font-bold shadow-xl text-lg py-4">
                  <Save size={20} className="mr-2" /> حفظ وإرسال الخطة للعميل
                </Button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <Users size={40} className="text-gray-300" />
              </div>
              <p className="text-xl font-bold text-gray-500">لم يتم تحديد عميل</p>
              <p className="text-sm mt-2 text-gray-400">اختر عميلاً من القائمة لبدء التصميم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;