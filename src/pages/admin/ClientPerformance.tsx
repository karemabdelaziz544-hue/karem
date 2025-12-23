import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
    Users, CheckCircle2, AlertTriangle, XCircle, 
    MessageSquare, Search, TrendingUp,
    Activity, Baby // أيقونة لتمييز الحساب الفرعي
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { ar } from 'date-fns/locale';
import ClientDetailsModal from '../../pages/admin/ClientDetailsModal';

interface ClientData {
  id: string;
  full_name: string;
  phone_number: string;
  avatar_url?: string;
  lastLogDate: string | null;
  recentLogsCount: number;
  status: 'good' | 'warning' | 'critical';
  statusMsg: string;
  isSubAccount: boolean; // جديد: هل هو حساب فرعي؟
  managerName?: string;  // جديد: اسم المدير
}

const ClientPerformance: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'good'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const stats = {
      total: clients.length,
      critical: clients.filter(c => c.status === 'critical').length,
      warning: clients.filter(c => c.status === 'warning').length,
      good: clients.filter(c => c.status === 'good').length,
  };

  useEffect(() => {
    fetchClientPerformance();
  }, []);

  const fetchClientPerformance = async () => {
    setLoading(true);
    try {
      // 1. جلب كل البروفايلات (الأبناء والآباء)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin');

      if (!profiles) return;

      // عمل Map للبحث السريع عن حالة الآباء
      // المفتاح: ID الأب، القيمة: بيانات الأب كاملة
      const profilesMap = new Map(profiles.map(p => [p.id, p]));

      // 2. تحليل الأداء لكل عميل
      const threeDaysAgo = subDays(new Date(), 3).toISOString().split('T')[0];

      const performanceData = await Promise.all(profiles.map(async (client) => {
        
        // --- 🔥 منطق تصحيح حالة الاشتراك للحسابات الفرعية 🔥 ---
        let isSubscriptionActive = false;

        if (client.manager_id && profilesMap.has(client.manager_id)) {
            // لو حساب فرعي -> نشوف حالة الأب
            const manager = profilesMap.get(client.manager_id);
            // نفحص حالة اشتراك الأب + تاريخ الانتهاء
            isSubscriptionActive = manager.subscription_status === 'active';
            // (اختياري: ممكن تضيف فحص التاريخ كمان للتأكد)
            // && new Date(manager.subscription_end_date) > new Date()
        } else {
            // لو حساب رئيسي -> نشوف حالته هو
            isSubscriptionActive = client.subscription_status === 'active';
        }

        // جلب السجلات
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('date, completed_tasks')
          .eq('user_id', client.id)
          .gte('date', threeDaysAgo)
          .order('date', { ascending: false });

        const recentLogs = logs || [];
        const lastLogDate = recentLogs.length > 0 ? recentLogs[0].date : null;
        
        let totalTasksDone = 0;
        recentLogs.forEach(log => {
            if (log.completed_tasks) totalTasksDone += log.completed_tasks.length;
        });

        // تصنيف الحالة (Performance Status)
        let status: 'good' | 'warning' | 'critical' = 'good';
        let statusMsg = 'ملتزم وممتاز 💪';

        // لو الاشتراك منتهي (للأب أو الابن)، نعطيه حالة خاصة أو نعتبره critical
        // هنا سنركز على "الالتزام بالدخول" وليس الدفع، لكن لو أردت تمييزه:
        /* if (!isSubscriptionActive) {
            status = 'critical';
            statusMsg = 'اشتراك منتهي ❌';
        } 
        */

        if (!lastLogDate) {
             status = 'critical'; statusMsg = 'منقطع تماماً 🚨';
        } else if (isAfter(subDays(new Date(), 2), new Date(lastLogDate))) {
            status = 'critical'; statusMsg = 'غائب منذ يومين ⚠️';
        } else if (totalTasksDone < 3) {
            status = 'warning'; statusMsg = 'أداء ضعيف 📉';
        }

        return {
          ...client,
          lastLogDate,
          recentLogsCount: recentLogs.length,
          status,
          statusMsg,
          // بيانات إضافية للعرض
          isSubAccount: !!client.manager_id,
          managerName: client.manager_id ? profilesMap.get(client.manager_id)?.full_name : undefined
        };
      }));

      // ترتيب: الحالات الحرجة أولاً
      const sorted = performanceData.sort((a, b) => {
          const priority = { critical: 3, warning: 2, good: 1 };
          return priority[b.status] - priority[a.status];
      });

      setClients(sorted);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (client: ClientData) => {
      navigate('/admin/chat', { state: { selectedUserId: client.id } });
  };

  const filteredClients = clients.filter(client => {
      const matchesFilter = filter === 'all' || client.status === filter;
      const matchesSearch = client.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  if (loading) return (
      <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
      </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in" dir="rtl">
      
      {/* 1. Header & Stats */}
      <div>
          <h1 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
             <div className="bg-orange/10 p-2 rounded-xl text-orange"><TrendingUp size={32}/></div>
             متابعة التزام العملاء
          </h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="إجمالي العملاء" value={stats.total} icon={Users} color="bg-blue-50 text-blue-600" />
              <StatCard label="يحتاجون متابعة" value={stats.critical} icon={XCircle} color="bg-red-50 text-red-600" />
              <StatCard label="أداء متوسط" value={stats.warning} icon={AlertTriangle} color="bg-orange/10 text-orange" />
              <StatCard label="ملتزمون" value={stats.good} icon={CheckCircle2} color="bg-green-50 text-green-600" />
          </div>
      </div>

      {/* 2. Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-0 z-10">
          <div className="flex gap-1 bg-gray-100/80 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto">
              <TabButton active={filter === 'all'} onClick={() => setFilter('all')} label="الكل" count={stats.total} />
              <TabButton active={filter === 'critical'} onClick={() => setFilter('critical')} label="منقطع" count={stats.critical} isCritical />
              <TabButton active={filter === 'warning'} onClick={() => setFilter('warning')} label="تنبيه" count={stats.warning} />
              <TabButton active={filter === 'good'} onClick={() => setFilter('good')} label="ملتزم" count={stats.good} />
          </div>

          <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                  type="text" 
                  placeholder="بحث عن عميل..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-forest/20 focus:border-forest outline-none transition-all"
              />
          </div>
      </div>

      {/* 3. Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
              <div key={client.id} className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-forest/30 transition-all duration-300 relative overflow-hidden">
                  
                  <div className={`absolute top-0 right-0 w-1.5 h-full 
                      ${client.status === 'critical' ? 'bg-red-500' : 
                        client.status === 'warning' ? 'bg-orange' : 'bg-green-500'}
                  `}></div>

                  <div className="flex justify-between items-start mb-4 pr-3">
                      <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl border-2 shadow-sm
                              ${client.status === 'critical' ? 'bg-red-50 text-red-500 border-red-100' : 
                                client.status === 'warning' ? 'bg-orange/5 text-orange border-orange/10' : 
                                'bg-green-50 text-green-600 border-green-100'}
                          `}>
                              {client.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-forest transition-colors">
                                  {client.full_name || 'بدون اسم'}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                  {/* حالة الالتزام */}
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                                      ${client.status === 'critical' ? 'bg-red-100 text-red-600' : 
                                        client.status === 'warning' ? 'bg-orange/10 text-orange' : 
                                        'bg-green-100 text-green-600'}
                                  `}>
                                      {client.statusMsg}
                                  </span>

                                  {/* 🔥 تمييز الحساب الفرعي + اسم الأب 🔥 */}
                                  {client.isSubAccount && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                          <Baby size={10} /> تابع لـ: {client.managerName?.split(' ')[0]}
                                      </span>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-5 pr-3">
                      <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                          <span className="text-gray-400 text-xs block mb-1">آخر ظهور</span>
                          <span className="font-bold text-gray-700 text-sm dir-ltr">
                              {client.lastLogDate ? format(new Date(client.lastLogDate), 'd MMM', { locale: ar }) : '-'}
                          </span>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                          <span className="text-gray-400 text-xs block mb-1">نشاط (3 أيام)</span>
                          <span className="font-bold text-gray-700 text-sm">{client.recentLogsCount} مرات</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                      <button 
                          onClick={() => handleOpenChat(client)}
                          className="bg-gray-900 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-forest transition-colors text-sm"
                      >
                          <MessageSquare size={16} />
                          محادثة
                      </button>

                      <button 
                          onClick={() => setSelectedClientId(client.id)}
                          className="bg-orange/10 text-orange border border-orange/20 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange hover:text-white transition-all text-sm"
                      >
                          <Activity size={16} />
                          تقرير اليوم
                      </button>
                  </div>
              </div>
          ))}
      </div>

      {filteredClients.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">لا يوجد عملاء يطابقون البحث الحالي</p>
          </div>
      )}

      {selectedClientId && (
          <ClientDetailsModal 
              clientId={selectedClientId} 
              onClose={() => setSelectedClientId(null)} 
          />
      )}

    </div>
  );
};

// --- Helper Components ---
const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-gray-400 text-xs font-bold">{label}</p>
            <p className="text-2xl font-black text-gray-800">{value}</p>
        </div>
    </div>
);

const TabButton = ({ active, onClick, label, count, isCritical }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
            ${active 
                ? (isCritical ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200') 
                : 'text-gray-500 hover:bg-gray-200/50'}
        `}
    >
        {label}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-black/10 text-inherit' : 'bg-gray-200 text-gray-600'}`}>
            {count}
        </span>
    </button>
);

export default ClientPerformance;