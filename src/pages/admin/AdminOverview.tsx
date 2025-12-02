import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, FileText, CheckCircle, TrendingUp } from 'lucide-react';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, plans: 0, active: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      // Get counts directly using head:true for performance
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin');
      const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');
      const { count: plansCount } = await supabase.from('plans').select('*', { count: 'exact', head: true });
      
      setStats({ users: usersCount || 0, active: activeCount || 0, plans: plansCount || 0 });
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-forest mb-2">نظرة عامة</h1>
      <p className="text-gray-500 mb-8">أهلاً بك في لوحة التحكم، إليك ملخص سريع لما يحدث.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="إجمالي العملاء" value={stats.users} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard title="اشتراكات نشطة" value={stats.active} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <StatCard title="أنظمة تم إنشاؤها" value={stats.plans} icon={FileText} color="bg-orange-50 text-orange-600" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon size={32} />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-bold">{title}</p>
      <h3 className="text-3xl font-black text-forest">{value}</h3>
    </div>
  </div>
);

export default AdminOverview;