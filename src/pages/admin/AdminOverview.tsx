import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CreditCard, TrendingUp, Activity, Clock, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Loader2 from '../../components/Preloader';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../../types';

const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    activeUsers: 0,
    pendingRequests: 0,
    dailyCompliance: 0,
    totalClients: 0
  });
  const [expiringSoon, setExpiringSoon] = useState<Profile[]>([]);
  const [chartData, setChartData] = useState<{ name: string; users: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const fortyEightHoursLater = new Date();
      fortyEightHoursLater.setHours(fortyEightHoursLater.getHours() + 48);

      // 1. جلب بيانات البروفايلات والاشتراكات المعلقة
      const { data: profiles } = await supabase.from('profiles').select('*').neq('role', 'admin');
      const { count: pendingCount } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      // 2. حساب الدخل (Transactions)
      const { data: subTransactions } = await supabase.from('transactions').select('amount').eq('status', 'approved');
      const totalIncome = subTransactions?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

      // 3. حساب نسبة الالتزام اليوم (Compliance Rate)
      // نجلب سجلات اليوم والمهام المرتبطة بها
      const { data: dailyLogs } = await supabase.from('daily_logs').select('completed_tasks').eq('date', today);
      
      let totalCompletedTasks = 0;
      dailyLogs?.forEach(log => {
        totalCompletedTasks += (Array.isArray(log.completed_tasks) ? log.completed_tasks.length : 0);
      });
      // نسبة تقريبية بناءً على عدد السجلات (مؤشر أداء)
      const complianceRate = dailyLogs && dailyLogs.length > 0 
        ? Math.round((totalCompletedTasks / (dailyLogs.length * 5)) * 100) 
        : 0;

      // 4. تحديد العملاء الذين سينتهي اشتراكهم قريباً (48 ساعة)
      const expiring = profiles?.filter(p => {
        if (!p.subscription_end_date) return false;
        const endDate = new Date(p.subscription_end_date);
        return endDate > new Date() && endDate <= fortyEightHoursLater;
      }) || [];

      // 5. تجهيز بيانات الرسم البياني
      const monthlyGrowth: Record<string, number> = {};
      profiles?.forEach(p => {
        const date = new Date(p.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyGrowth[key] = (monthlyGrowth[key] || 0) + 1;
      });

      const chart = Object.keys(monthlyGrowth).sort().map(key => ({
        name: key,
        users: monthlyGrowth[key]
      }));

      setStats({
        totalIncome,
        activeUsers: profiles?.filter(p => p.subscription_status === 'active').length || 0,
        pendingRequests: pendingCount || 0,
        dailyCompliance: complianceRate > 100 ? 100 : complianceRate,
        totalClients: profiles?.length || 0
      });
      setExpiringSoon(expiring);
      setChartData(chart);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 /></div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10 space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">لوحة التحكم 🚀</h1>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-gray-500">النظام يعمل بكفاءة</span>
        </div>
      </div>

      {/* الكروت الأساسية */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => navigate('/admin/transactions')} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:border-amber-400 transition-all">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={20} /></div>
            {stats.pendingRequests > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full h-fit animate-bounce">مطلوب رد</span>}
          </div>
          <p className="text-gray-400 text-xs font-bold">طلبات معلقة</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.pendingRequests} طلب</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
          </div>
          <p className="text-gray-400 text-xs font-bold">نسبة التزام اليوم</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.dailyCompliance}%</h3>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2"><div className="bg-emerald-500 h-full rounded-full" style={{width: `${stats.dailyCompliance}%`}}></div></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-right">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={20} /></div>
          </div>
          <p className="text-gray-400 text-xs font-bold">المشتركون</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.activeUsers} نشط</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center"><CreditCard size={20} /></div>
          </div>
          <p className="text-gray-400 text-xs font-bold">إجمالي الدخل</p>
          <h3 className="text-2xl font-black text-forest mt-1">{stats.totalIncome.toLocaleString()} <span className="text-xs">ج.م</span></h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* رسم بياني النمو */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp className="text-forest" size={20}/> نمو القاعدة الجماهيرية</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e5631" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1e5631" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
// في ملف AdminOverview.tsx
<Area type="monotone" dataKey="users" stroke="#1e5631" strokeWidth={3} fill="url(#colorUsers)" />              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* تنبيهات انتهاء الاشتراك */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertCircle className="text-red-500" size={18}/> ينتهي قريباً (48س)</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {expiringSoon.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                <CheckCircle2 size={40} className="mb-2" />
                <p className="text-xs font-bold">لا يوجد اشتراكات تنتهي حالياً</p>
              </div>
            ) : (
              expiringSoon.map((client) => (
                <div key={client.id} className="p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-red-200">
                    {client.avatar_url ? <img src={client.avatar_url} className="w-full h-full object-cover rounded-full" /> : <Users size={16} className="text-red-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{client.full_name}</p>
                    <p className="text-[9px] text-red-600 font-bold">ينتهي: {client.subscription_end_date ? new Date(client.subscription_end_date).toLocaleDateString('ar-EG') : '-'}</p>
                  </div>
                  <button onClick={() => navigate(`/admin/chat/${client.id}`)} className="p-2 bg-white text-forest rounded-xl shadow-sm hover:bg-forest hover:text-white transition-colors">
                    <MessageSquare size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/admin/performance')} className="w-full mt-4 py-3 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-bold hover:bg-gray-100 transition-colors">عرض جميع العملاء</button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;