import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Search, User, ChevronLeft, Activity } from 'lucide-react';

const DoctorClients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyClients = async () => {
      setLoading(true);
      try {
        // جلب العملاء المشتركين (في المستقبل هنفلتر بالدكتور المسؤول)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'client')
          .order('full_name');
        setClients(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyClients();
  }, []);

  const filtered = clients.filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 font-tajawal">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800">قائمة الأبطال 🦁</h1>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ابحث عن متدرب..." 
            className="pr-10 pl-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-forest/20"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center animate-pulse text-slate-400">جاري جلب القائمة...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div 
              key={client.id}
// جوه صفحة DoctorClients.tsx عند الضغط على الكارت
onClick={() => navigate(`/doctor-dashboard/client/${client.id}`)}              className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  {client.avatar_url ? <img src={client.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : <User size={24}/>}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">{client.full_name}</h3>
                  <span className={`text-[9px] font-bold ${client.subscription_status === 'active' ? 'text-forest' : 'text-slate-400'}`}>
                    {client.subscription_status === 'active' ? 'إشتراك نشط' : 'إشتراك منتهي'}
                  </span>
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-forest group-hover:text-white transition-all">
                <ChevronLeft size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorClients;