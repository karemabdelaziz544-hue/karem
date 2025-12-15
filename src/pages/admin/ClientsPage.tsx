import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, CheckCircle, ChevronLeft, Users, User, Crown, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/Avatar'; // 👈 استيراد

const ClientsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      // القراءة من الـ View المحدث
      const { data, error } = await supabase
        .from('admin_clients_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error("Error:", error);
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  // 🧠 منطق البحث المطور: اسم أو رقم أو إيميل
  const filteredUsers = users.filter(u => 
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery)) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="p-10 text-center text-forest font-bold">جاري تحميل العملاء...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-forest">قائمة العملاء</h1>
        
        {/* شريط البحث */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center w-full md:w-96 group focus-within:border-orange transition-colors">
          <Search className="text-gray-400 ml-2 group-focus-within:text-orange" size={20} />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الرقم، أو البريد..." 
            className="bg-transparent outline-none w-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* الشبكة (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => {
            const isDependent = !!user.manager_name;
            
            return (
              <Link to={`/admin/clients/${user.id}`} key={user.id}>
                <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all group cursor-pointer relative overflow-hidden h-full flex flex-col justify-between
                    ${isDependent ? 'border-gray-200 hover:border-orange/50' : 'border-forest/20 hover:border-forest'}`}>
                  
                  <div>
                    <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-3">
    {/* استبدل الدائرة القديمة بهذا السطر 👇 */}
    <div className="relative">
        <Avatar src={user.avatar_url} name={user.full_name} size="lg" />
        
        {/* الأيقونة الصغيرة (تاج أو مستخدمين) تفضل زي ما هي فوق الصورة */}
        <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-white 
            ${isDependent ? 'bg-white text-orange' : 'bg-orange text-white'}`}>
            {isDependent ? <Users size={10} /> : <Crown size={10} />}
        </div>
    </div>
                        
                        {/* الاسم ونوع الحساب */}
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-forest transition-colors line-clamp-1">{user.full_name || 'بدون اسم'}</h3>
                            
                            {isDependent ? (
                                <p className="text-[10px] text-orange font-bold bg-orange/5 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <Users size={10} />
                                    تابع لـ: {user.manager_name}
                                </p>
                            ) : (
                                <p className="text-[10px] text-forest font-bold bg-forest/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <Crown size={10} />
                                    حساب رئيسي
                                </p>
                            )}
                        </div>
                        </div>
                        {user.subscription_status === 'active' && <CheckCircle className="text-green-500 shrink-0" size={20} />}
                    </div>

                    {/* 👇 البيانات الإضافية (موبايل وإيميل) 👇 */}
                    <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone size={14} className="text-gray-400"/>
                            <span className="font-mono dir-ltr select-all">{user.phone || 'غير مسجل'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail size={14} className="text-gray-400"/>
                            <span className="truncate max-w-[180px] select-all" title={user.email}>{user.email || 'غير مسجل'}</span>
                        </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${user.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {user.subscription_status === 'active' ? '● مشترك نشط' : '● اشتراك منتهي'}
                    </span>
                    <span className="text-gray-400 text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold">
                      عرض الملف <ChevronLeft size={14} />
                    </span>
                  </div>

                </div>
              </Link>
            );
        })}
      </div>
      
      {/* رسالة عند عدم وجود نتائج */}
      {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 mt-8">
              <Search size={40} className="mx-auto mb-4 opacity-20" />
              <p>لا يوجد عميل بهذا الاسم أو الرقم أو الإيميل.</p>
          </div>
      )}
    </div>
  );
};

export default ClientsPage;