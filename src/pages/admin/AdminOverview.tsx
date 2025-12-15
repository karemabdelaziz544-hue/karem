import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CreditCard, Ticket, TrendingUp, Activity, UserPlus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Loader2 from '../../components/Preloader';

const AdminOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalEvents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
        // 1. حساب الدخل من الاشتراكات (Approved Transactions)
        const { data: subTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('status', 'approved');
        const subIncome = subTransactions?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

        // 2. حساب الدخل من الإيفينتات (Confirmed Bookings * Price)
        // بنجيب الحجوزات المؤكدة ومعاها سعر الايفينت
        const { data: eventBookings } = await supabase
            .from('event_bookings')
            .select('events(price)')
            .eq('status', 'confirmed');
        
        const eventIncome = eventBookings?.reduce((acc, curr: any) => acc + (curr.events?.price || 0), 0) || 0;

        // 3. عدد المشتركين وحالتهم
        const { data: profiles } = await supabase.from('profiles').select('subscription_status, created_at').neq('role', 'admin');
        const active = profiles?.filter(p => p.subscription_status === 'active').length || 0;
        const expired = profiles?.filter(p => p.subscription_status === 'expired').length || 0;

        // 4. تجهيز بيانات الرسم البياني (نمو المستخدمين شهرياً)
        const monthlyGrowth: Record<string, number> = {};
        profiles?.forEach(p => {
            const date = new Date(p.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            monthlyGrowth[key] = (monthlyGrowth[key] || 0) + 1;
        });

        // تحويلها لمصفوفة مرتبة
        const chart = Object.keys(monthlyGrowth).sort().map(key => ({
            name: key, // 2024-02
            users: monthlyGrowth[key]
        }));

        setStats({
            totalIncome: subIncome + eventIncome,
            activeUsers: active,
            expiredUsers: expired,
            totalEvents: 0 // ممكن نجيبها لو محتاجين
        });
        setChartData(chart);

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 /></div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <h1 className="text-3xl font-extrabold text-forest mb-8">نظرة عامة على الأداء 🚀</h1>

      {/* الكروت السريعة */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        
        {/* كارت الدخل */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-xs font-bold mb-1">إجمالي الدخل</p>
                <h3 className="text-2xl font-black text-forest">{stats.totalIncome.toLocaleString()} ج.م</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CreditCard size={24} />
            </div>
        </div>

        {/* كارت النشطين */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-xs font-bold mb-1">اشتراكات نشطة</p>
                <h3 className="text-2xl font-black text-forest">{stats.activeUsers}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity size={24} />
            </div>
        </div>

        {/* كارت المنتهية */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-xs font-bold mb-1">اشتراكات منتهية</p>
                <h3 className="text-2xl font-black text-orange">{stats.expiredUsers}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
                <Users size={24} />
            </div>
        </div>

        {/* كارت النمو (مثال) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-xs font-bold mb-1">إجمالي العملاء</p>
                <h3 className="text-2xl font-black text-gray-800">{stats.activeUsers + stats.expiredUsers}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp size={24} />
            </div>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* رسم بياني النمو (كبير) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-forest mb-6 flex items-center gap-2">
                <UserPlus className="text-orange" size={20}/> نمو المشتركين الجدد (شهرياً)
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0a3935" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0a3935" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        />
                        <Area type="monotone" dataKey="users" stroke="#0a3935" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* ملخص الحالة (Pie Chart أو بار بسيط) */}
        <div className="bg-forest text-white p-8 rounded-3xl shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange opacity-20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
            
            <h3 className="font-bold text-xl mb-6 relative z-10">نسبة التجديد</h3>
            
            <div className="flex items-end gap-2 mb-2 relative z-10">
                <span className="text-5xl font-black">
                    {Math.round((stats.activeUsers / (stats.activeUsers + stats.expiredUsers || 1)) * 100)}%
                </span>
                <span className="text-sm opacity-80 mb-2">اشتراكات نشطة</span>
            </div>
            
            <div className="w-full bg-white/20 h-2 rounded-full mt-2 relative z-10">
                <div 
                    className="h-full bg-orange rounded-full transition-all duration-1000" 
                    style={{width: `${Math.round((stats.activeUsers / (stats.activeUsers + stats.expiredUsers || 1)) * 100)}%`}}
                ></div>
            </div>

            <p className="text-xs opacity-60 mt-6 relative z-10 leading-relaxed">
                حافظ على هذا الرقم مرتفعاً من خلال متابعة العملاء المنتهية اشتراكاتهم عبر الشات.
            </p>
        </div>

      </div>
    </div>
  );
};

export default AdminOverview;