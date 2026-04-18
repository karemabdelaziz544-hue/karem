import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, Zap, AlertCircle, UserPlus, 
  ArrowUpRight, CheckCircle2, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    noPlan: 0,
    expiringSoon: 0
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. إجمالي العملاء
        const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client');
        
        // 2. المشتركين النشطين
        const { count: active } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');

        // 3. عملاء نشطين بدون نظام (محتاجين اهتمام فوري)
        const { data: activeUsers } = await supabase
          .from('profiles')
          .select('id, plans(id)')
          .eq('role', 'client')
          .eq('subscription_status', 'active');
        const noPlanCount = activeUsers?.filter(u => !u.plans || u.plans.length === 0).length || 0;

        // 4. أحدث 5 عملاء انضموا
        const { data: latest } = await supabase
          .from('profiles')
          .select('id, full_name, created_at, subscription_status')
          .eq('role', 'client')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          total: total || 0,
          active: active || 0,
          noPlan: noPlanCount,
          expiringSoon: 0 // ممكن نطورها لاحقاً بحسبة التواريخ
        });
        setRecentClients(latest || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-20 text-center font-black text-forest animate-pulse">جاري جمع بيانات العيادة...</div>;

  return (
    <div className="space-y-8 font-tajawal pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 italic">لوحة التحكم الذكية 🦁</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">متابعة حية للبيانات</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
           <Clock size={14} className="text-forest" />
           <span className="text-[10px] font-black text-slate-500">{new Date().toLocaleDateString('ar-EG')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatItem title="إجمالي الأبطال" value={stats.total} icon={<Users size={20}/>} color="bg-forest" />
        <StatItem title="نشطين حالياً" value={stats.active} icon={<Zap size={20}/>} color="bg-orange" />
        <StatItem title="بحاجة لنظام" value={stats.noPlan} icon={<AlertCircle size={20}/>} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* أحدث المتدربين */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800">أحدث الأبطال المنضمين</h3>
            <button className="text-[10px] font-black text-forest underline">عرض الكل</button>
          </div>
          <div className="space-y-4">
            {recentClients.map(client => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-forest/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-300 group-hover:text-forest group-hover:bg-white transition-all">
                    {client.full_name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">{client.full_name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">انضم في: {new Date(client.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                <span className={`text-[8px] font-black px-2 py-1 rounded-md ${client.subscription_status === 'active' ? 'bg-forest/10 text-forest' : 'bg-slate-200 text-slate-500'}`}>
                  {client.subscription_status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* تنبيهات سريعة */}
        <div className="bg-forest text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-black text-lg mb-6">تنبيهات الطبيب 🩺</h3>
            <div className="space-y-4">
              {stats.noPlan > 0 ? (
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold leading-relaxed">هناك {stats.noPlan} مشتركين جدد في انتظار استلام أنظمتهم الغذائية والتدريبية.</p>
                </div>
              ) : (
                <div className="text-center py-6">
                   <CheckCircle2 className="mx-auto mb-2 text-white/50" size={32} />
                   <p className="text-xs font-bold">لا توجد طلبات معلقة حالياً.</p>
                </div>
              )}
              <button className="w-full bg-orange text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-orange/20 active:scale-95 transition-all">توزيع الأنظمة الآن</button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// مكون الكارت الإحصائي
const StatItem = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-forest/20 transition-all">
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h3>
    </div>
    <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
      {icon}
    </div>
  </div>
);

export default DoctorDashboard;