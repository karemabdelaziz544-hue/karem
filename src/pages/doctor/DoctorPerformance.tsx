import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Search, User, ChevronLeft, RefreshCw, 
    CheckCircle, Calendar, Filter, Award, AlertCircle, X, Loader2
} from 'lucide-react';

import { Database } from '../../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PlanTask = Database['public']['Tables']['plan_tasks']['Row'];

interface ClientPerformance extends Profile {
  percentage: number;
  totalTasks: number;
  doneTasks: number;
  activePlanId?: string;
  activePlanCreatedAt?: string;
}

const DoctorPerformance: React.FC = () => {
  const [clients, setClients] = useState<ClientPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high' | 'low'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientPerformance | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. جلب العملاء مع تفاصيل الخطط بالكامل للحصول على تاريخ الإنشاء
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`id, full_name, avatar_url, plans (id, created_at)`)
        .eq('role', 'client')
        .eq('subscription_status', 'active');

      // 2. جلب حالة المهام للمقارنة
      const { data: allTasks } = await supabase
        .from('plan_tasks')
        .select('plan_id, is_completed');
      
      const formatted = profiles?.map((p) => {
        // ترتيب الخطط للحصول على الأحدث
        const latestPlan = p.plans?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const pTasks = allTasks?.filter(t => t.plan_id === latestPlan?.id) || [];
        const done = pTasks.filter(t => t.is_completed).length;
        const total = pTasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return { 
          ...p, 
          percentage: pct, 
          totalTasks: total, 
          doneTasks: done,
          activePlanId: latestPlan?.id,
          activePlanCreatedAt: latestPlan?.created_at // تخزين التاريخ لاستخدامه في المودال
        };
      });

      setClients((formatted || []) as unknown as ClientPerformance[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'high') return matchesSearch && c.percentage >= 70;
    if (filterType === 'low') return matchesSearch && c.percentage < 40 && c.totalTasks > 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 font-tajawal pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800">متابعة الأداء اليومي 📈</h1>
        <button onClick={fetchData} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:text-forest">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن بطل..." 
            className="w-full pr-10 pl-4 py-3 rounded-2xl border-none shadow-sm outline-none focus:ring-2 focus:ring-forest/20"
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="الكل" />
           <FilterButton active={filterType === 'high'} onClick={() => setFilterType('high')} label="الملتزمين" color="bg-forest" />
           <FilterButton active={filterType === 'low'} onClick={() => setFilterType('low')} label="المقصرين" color="bg-orange" />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-slate-400 font-bold">جاري تحليل الأداء...</div>
        ) : filteredClients.map(client => (
          <div 
            key={client.id} 
            onClick={() => setSelectedClient(client)}
            className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 group hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
               {client.avatar_url ? <img src={client.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-200" />}
            </div>
            <div className="flex-1">
               <h3 className="font-black text-slate-800 text-sm">{client.full_name}</h3>
               <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[150px]">
                     <div className={`h-full transition-all duration-1000 ${client.percentage > 50 ? 'bg-forest' : 'bg-orange'}`} style={{ width: `${client.percentage}%` }}></div>
                  </div>
                  <span className={`text-[10px] font-black ${client.percentage > 50 ? 'text-forest' : 'text-orange'}`}>{client.percentage}%</span>
               </div>
            </div>
            <div className="text-left">
               <p className="text-[9px] font-black text-slate-300 uppercase italic">الحالة اليوم</p>
               <p className="text-xs font-black text-slate-600">{client.doneTasks} / {client.totalTasks} مهام</p>
            </div>
          </div>
        ))}
      </div>

      {/* مودال تفاصيل المهام (تم تحديث البروبس المرسلة) */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedClient(null)}>
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-50 text-center relative">
              <button onClick={() => setSelectedClient(null)} className="absolute left-6 top-8 text-slate-300 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-xl font-black text-slate-800">{selectedClient.full_name}</h2>
              <p className="text-[10px] font-bold text-forest mt-1 uppercase italic tracking-widest">متابعة دقيقة لليوم الحالي</p>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[50vh] bg-slate-50/30">
              <PerformanceDetailView 
                planId={selectedClient.activePlanId} 
                planCreatedAt={selectedClient.activePlanCreatedAt} 
              />
            </div>

            <div className="p-6 bg-white border-t border-slate-50 text-center">
              <button 
                onClick={() => setSelectedClient(null)}
                className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs active:scale-95 transition-all shadow-lg"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* مكون عرض تفاصيل مهام "رقم اليوم الحالي" المحدث */
const PerformanceDetailView = ({ planId, planCreatedAt }: { planId?: string, planCreatedAt?: string }) => {
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDayNum, setCurrentDayNum] = useState(1);

  useEffect(() => {
    const fetchTodayTasks = async () => {
      if (!planId || !planCreatedAt) { setLoading(false); return; }
      
      try {
        // حساب رقم اليوم بناءً على تاريخ إنشاء الخطة
        const start = new Date(planCreatedAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const dayNumber = diffDays + 1; 
        
        setCurrentDayNum(dayNumber);
        const dayString = `اليوم ${dayNumber}`;

        const { data } = await supabase
          .from('plan_tasks')
          .select('*')
          .eq('plan_id', planId)
          .eq('day_name', dayString) 
          .order('order_index', { ascending: true });
        
        setTasks(data || []);
      } catch (err) {
        console.error("Error calculating day:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayTasks();
  }, [planId, planCreatedAt]);

  if (loading) return <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-forest" /></div>;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-2 border-b border-slate-100 pb-3">
        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <Calendar size={14} className="text-forest" /> مهام الخطة: {`اليوم ${currentDayNum}`}
        </h4>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">متابعة حية</span>
      </div>

      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${task.is_completed ? 'bg-forest text-white' : 'bg-slate-50 text-slate-200 border border-slate-100'}`}>
                <CheckCircle size={14} fill={task.is_completed ? "currentColor" : "none"} />
              </div>
              <span className={`text-xs font-bold ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {task.content}
              </span>
            </div>
            <span className={`text-[8px] font-black px-2 py-1 rounded-md ${task.task_type === 'workout' ? 'bg-blue-50 text-blue-500' : 'bg-orange/10 text-orange'}`}>
              {task.task_type === 'workout' ? 'تمرين' : 'وجبة'}
            </span>
          </div>
        ))
      ) : (
        <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold italic text-xs">لا توجد مهام مسجلة لـ {`اليوم ${currentDayNum}`}</p>
          <p className="text-[10px] text-slate-300 mt-2 italic">يتم الفلترة بناءً على تاريخ استلام العميل للنظام</p>
        </div>
      )}
    </div>
  );
};

const FilterButton = ({ active, onClick, label, color = "bg-slate-800" }: { active: boolean, onClick: () => void, label: string, color?: string }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${active ? `${color} text-white shadow-lg shadow-slate-200` : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
  >
    {label}
  </button>
);

export default DoctorPerformance;