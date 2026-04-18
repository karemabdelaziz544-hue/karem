import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, CheckCircle, ChevronLeft, Users, User, Crown, Phone, Mail, UserPlus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import { toast } from 'react-hot-toast';

const ClientsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]); // 👈 لتخزين قائمة الدكاترة
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null); // لمتابعة حالة التحميل لكل عميل

  useEffect(() => {
    fetchUsers();
    fetchDoctors();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('admin_clients_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Error:", error);
    setUsers(data || []);
    setLoading(false);
  };

  // جلب الدكاترة فقط من جدول البروفايلات
  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'doctor');
    setDoctors(data || []);
  };

  // دالة ربط العميل بالدكتور
  const handleAssignDoctor = async (clientId: string, doctorId: string) => {
    setAssigningId(clientId);
    const { error } = await supabase
      .from('profiles')
      .update({ assigned_doctor_id: doctorId === "none" ? null : doctorId })
      .eq('id', clientId);

    if (!error) {
      toast.success('تم تعيين الدكتور بنجاح');
      fetchUsers(); // تحديث القائمة لرؤية التغيير
    } else {
      toast.error('حدث خطأ أثناء التعيين');
    }
    setAssigningId(null);
  };

  const filteredUsers = users.filter(u => 
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery)) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="p-10 text-center text-forest font-bold animate-pulse">جاري تحميل العملاء...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-forest italic">قائمة العملاء ✨</h1>
        
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center w-full md:w-96 focus-within:ring-2 focus-within:ring-orange/20 transition-all">
          <Search className="text-slate-400 mr-2" size={20} />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الرقم..." 
            className="bg-transparent outline-none w-full text-sm font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => {
            const isDependent = !!user.manager_name;
            
            return (
              <div key={user.id} className={`bg-white p-5 rounded-[2rem] shadow-sm border transition-all relative overflow-hidden h-full flex flex-col justify-between group
                  ${isDependent ? 'border-slate-100 hover:border-orange/30' : 'border-forest/5 hover:border-forest/20 shadow-forest/5'}`}>
                
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <Link to={`/admin/clients/${user.id}`} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar src={user.avatar_url} name={user.full_name} size="lg" />
                        <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-white 
                            ${isDependent ? 'bg-orange text-white' : 'bg-forest text-white'}`}>
                            {isDependent ? <Users size={10} /> : <Crown size={10} />}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 group-hover:text-forest transition-colors line-clamp-1">{user.full_name || 'بدون اسم'}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {isDependent ? `تابع لـ: ${user.manager_name}` : 'حساب رئيسي'}
                        </p>
                      </div>
                    </Link>
                    {user.subscription_status === 'active' && <CheckCircle className="text-emerald-500 shrink-0" size={20} />}
                  </div>

                  <div className="space-y-2 mb-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                        <Phone size={12} className="text-slate-400"/>
                        <span className="font-mono">{user.phone || '---'}</span>
                    </div>
                    {/* 🩺 اختيار الدكتور */}
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">الدكتور المتابع:</label>
                      <div className="relative">
                        <select 
                          disabled={assigningId === user.id}
                          className="w-full bg-white border border-slate-200 text-xs font-bold p-2 rounded-xl outline-none focus:border-forest appearance-none cursor-pointer"
                          value={user.assigned_doctor_id || "none"}
                          onChange={(e) => handleAssignDoctor(user.id, e.target.value)}
                        >
                          <option value="none">غير محدد</option>
                          {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                          ))}
                        </select>
                        {assigningId === user.id ? (
                          <Loader2 size={14} className="absolute left-2 top-2.5 animate-spin text-forest" />
                        ) : (
                          <UserPlus size={14} className="absolute left-2 top-2.5 text-slate-400 pointer-events-none" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 mt-auto">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${user.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {user.subscription_status === 'active' ? 'مشترك نشط' : 'غير مشترك'}
                  </span>
                  <Link to={`/admin/clients/${user.id}`} className="text-forest text-[11px] flex items-center gap-1 font-black hover:underline underline-offset-4">
                    الملف الشامل <ChevronLeft size={14} />
                  </Link>
                </div>
              </div>
            );
        })}
      </div>

      {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-20 text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 mt-8">
              <Search size={40} className="mx-auto mb-4 opacity-10" />
              <p className="font-bold">لا يوجد نتائج للبحث يا كريم</p>
          </div>
      )}
    </div>
  );
};

export default ClientsPage;