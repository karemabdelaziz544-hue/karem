import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, User, Phone, CheckCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  if (loading) return <div className="p-10 text-center text-forest font-bold">جاري تحميل العملاء...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-forest">قائمة العملاء</h1>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center w-full md:w-96">
          <Search className="text-gray-400 ml-2" size={20} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الرقم..." 
            className="bg-transparent outline-none w-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <Link to={`/admin/clients/${user.id}`} key={user.id}>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-orange/50 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-100 group-hover:bg-orange transition-colors" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-forest font-bold text-xl group-hover:bg-forest group-hover:text-white transition-colors">
                    {user.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-orange transition-colors">{user.full_name || 'بدون اسم'}</h3>
                    <p className="text-gray-400 text-sm font-mono dir-ltr">{user.phone}</p>
                  </div>
                </div>
                {user.subscription_status === 'active' && <CheckCircle className="text-green-500" size={20} />}
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${user.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-600'}`}>
                  {user.subscription_status === 'active' ? 'مشترك نشط' : 'اشتراك جديد'}
                </span>
                <span className="text-gray-400 text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  عرض التفاصيل <ChevronLeft size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredUsers.length === 0 && <div className="text-center py-20 text-gray-400">لا يوجد عملاء مطابقين للبحث</div>}
    </div>
  );
};

export default ClientsPage;