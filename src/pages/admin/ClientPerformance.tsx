import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Search, User, ChevronLeft, RefreshCw, X, 
    CheckCircle, Circle, Dumbbell, Utensils, 
    Loader2, Phone, MessageSquare, Calendar,
    Award, AlertCircle, Users, Zap, UserMinus, UserCheck, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientPerformance: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active_with_plan' | 'active_no_plan' | 'inactive' | 'high' | 'low'>('all');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const navigate = useNavigate();

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`id, full_name, avatar_url, phone, subscription_status, plans (id, status, created_at)`)
        .eq('role', 'client');

      const { data: allTasks } = await supabase
        .from('plan_tasks')
        .select('plan_id, is_completed');
      
      const formatted = profiles?.map((p: any) => {
        const latestPlan = p.plans?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const pTasks = allTasks?.filter(t => t.plan_id === latestPlan?.id) || [];
        const done = pTasks.filter(t => t.is_completed).length;
        const total = pTasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return { 
          ...p, 
          activePlan: latestPlan, 
          doneCount: done, 
          totalCount: total, 
          percentage: pct,
          isSubscribed: p.subscription_status === 'active'
        };
      });

      setClients(formatted || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  // منطق الفلترة المتقدم (شامل كل الحالات)
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'active_with_plan') return matchesSearch && c.isSubscribed && c.activePlan;
    if (filterType === 'active_no_plan')   return matchesSearch && c.isSubscribed && !c.activePlan;
    if (filterType === 'inactive')        return matchesSearch && !c.isSubscribed;
    if (filterType === 'high')            return matchesSearch && c.percentage >= 70 && c.totalCount > 0;
    if (filterType === 'low')             return matchesSearch && c.percentage < 40 && c.totalCount > 0;
    
    return matchesSearch;
  });

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen font-tajawal text-right" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4 px-2">
        <div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight">إدارة العملاء والمتابعة 🦁</h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">تحليل حالة {clients.length} متدرب مسجل</p>
        </div>
        <button onClick={fetchInitialData} className="p-3 bg-white text-forest rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-all">
          <RefreshCw size={22} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Search & Smart Filters Bar */}
      <div className="space-y-4 mb-8">
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-forest transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="بحث سريع باسم البطل..." 
            className="w-full p-5 pr-12 rounded-[2rem] border-none shadow-sm font-bold text-sm outline-none focus:ring-4 focus:ring-forest/5 transition-all bg-white" 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
           <FilterBtn active={filterType === 'all'} onClick={() => setFilterType('all')} icon={<Users size={14}/>} label="الكل" color="bg-slate-800" />
           <FilterBtn active={filterType === 'active_with_plan'} onClick={() => setFilterType('active_with_plan')} icon={<UserCheck size={14}/>} label="نشط بنظام" color="bg-forest" />
           <FilterBtn active={filterType === 'active_no_plan'} onClick={() => setFilterType('active_no_plan')} icon={<ClipboardList size={14}/>} label="نشط بدون نظام" color="bg-amber-500" />
           <FilterBtn active={filterType === 'inactive'} onClick={() => setFilterType('inactive')} icon={<UserMinus size={14}/>} label="غير مشترك" color="bg-rose-500" />
           <FilterBtn active={filterType === 'high'} onClick={() => setFilterType('high')} icon={<Award size={14}/>} label="ملتزم (+70%)" color="bg-emerald-500" />
           <FilterBtn active={filterType === 'low'} onClick={() => setFilterType('low')} icon={<AlertCircle size={14}/>} label="مقصر (-40%)" color="bg-orange" />
        </div>
      </div>

      {/* Clients List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4 animate-pulse">
             <div className="w-12 h-12 bg-forest/20 rounded-full flex items-center justify-center">
                <Loader2 className="animate-spin text-forest" size={24} />
             </div>
             <p className="text-slate-400 font-black text-xs italic tracking-widest">جاري فرز البيانات بدقة...</p>
          </div>
        ) : filteredClients.length > 0 ? filteredClients.map(client => (
          <div key={client.id} onClick={() => setSelectedClient(client)} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            
            {/* مؤشر الحالة الجانبي */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${client.isSubscribed ? (client.activePlan ? 'bg-forest' : 'bg-amber-500') : 'bg-slate-200'}`}></div>

            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 overflow-hidden shrink-0 border-2 border-slate-50 shadow-inner group-hover:border-forest/20 transition-all">
              {client.avatar_url ? <img src={client.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-200" />}
            </div>

            <div className="flex-1 text-right">
              <div className="flex items-center gap-2">
                 <h3 className="font-black text-slate-800 text-base group-hover:text-forest transition-colors">{client.full_name}</h3>
                 {!client.isSubscribed && <span className="text-[8px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-md font-black italic">منتهي</span>}
              </div>
              
              <div className="flex items-center gap-3 mt-1.5">
                {client.activePlan ? (
                  <>
                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${client.percentage > 50 ? 'bg-forest' : 'bg-orange'}`} style={{ width: `${client.percentage}%` }}></div>
                    </div>
                    <span className={`text-[10px] font-black ${client.percentage > 50 ? 'text-forest' : 'text-orange'}`}>{client.percentage}% التزام</span>
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 italic">لا يوجد نظام حالياً</span>
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl text-slate-300 group-hover:bg-forest group-hover:text-white transition-all shadow-sm">
               <ChevronLeft size={18} />
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <Search size={30} />
             </div>
             <p className="text-slate-400 font-bold text-sm">لم نجد أي متدرب بهذه الحالة</p>
          </div>
        )}
      </div>

      {/* Modal & LiveTasks (يتم استخدام نفس مكون LiveTasks السابق) */}
      {selectedClient && (
        <DetailModal selectedClient={selectedClient} onClose={() => setSelectedClient(null)} navigate={navigate} />
      )}
    </div>
  );
};

// مكون زر الفلتر المصغر
const FilterBtn = ({ active, onClick, icon, label, color }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap shadow-sm border ${active ? `${color} text-white border-transparent shadow-lg scale-105` : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
  >
    {icon} {label}
  </button>
);

// مكون المودال المنفصل (لأناقة الكود)
const DetailModal = ({ selectedClient, onClose, navigate }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4" onClick={onClose}>
    <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
      <div className="relative px-8 py-10 border-b border-slate-50 text-center">
        <button onClick={onClose} className="absolute left-8 top-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-orange transition-all"><X size={22}/></button>
        <div className="w-24 h-24 bg-white rounded-[2rem] mx-auto mb-5 overflow-hidden border-4 border-slate-50 shadow-xl">
           {selectedClient.avatar_url ? <img src={selectedClient.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-8 text-slate-200" />}
        </div>
        <h2 className="text-2xl font-black text-slate-800">{selectedClient.full_name}</h2>
        <div className="flex justify-center gap-2 mt-3">
          <span className={`px-4 py-1 rounded-full text-[9px] font-black italic ${selectedClient.isSubscribed ? 'bg-forest/10 text-forest' : 'bg-rose-50 text-rose-500'}`}>
            {selectedClient.isSubscribed ? 'مشترك نشط' : 'غير مشترك'}
          </span>
          {selectedClient.activePlan && <span className="px-4 py-1 bg-orange/10 text-orange rounded-full text-[9px] font-black italic">نظام متاح</span>}
        </div>
      </div>
      <div className="p-8 overflow-y-auto max-h-[50vh] bg-slate-50/20">
         <LiveTasks planId={selectedClient.activePlan?.id} />
      </div>
      <div className="p-8 bg-white border-t border-slate-50 flex gap-4">
         <a href={`https://wa.me/${selectedClient.phone}`} target="_blank" className="flex-1 bg-[#25D366] text-white py-5 rounded-[1.8rem] font-black text-xs flex items-center justify-center gap-3 shadow-lg hover:scale-105 transition-all"><Phone size={18}/> واتساب</a>
         <button onClick={() => navigate(`/admin/chat/${selectedClient.id}`)} className="flex-1 bg-forest text-white py-5 rounded-[1.8rem] font-black text-xs flex items-center justify-center gap-3 shadow-lg hover:scale-105 transition-all"><MessageSquare size={18}/> فتح الشات</button>
      </div>
    </div>
  </div>
);

const LiveTasks = ({ planId }: { planId: string }) => {
    const [commitmentDays, setCommitmentDays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const load = async () => {
        if (!planId) { setLoading(false); return; }
        const { data: allTasks } = await supabase.from('plan_tasks').select('*').eq('plan_id', planId).order('order_index', { ascending: true });
        if (allTasks) {
          const grouped = allTasks.reduce((acc: any, task: any) => {
            const day = task.day_name || "يوم غير محدد";
            if (!acc[day]) acc[day] = [];
            acc[day].push(task);
            return acc;
          }, {});
          const formatted = Object.keys(grouped).map(dayName => ({
            dayName, tasks: grouped[dayName],
            completedCount: grouped[dayName].filter((t: any) => t.is_completed).length,
            totalTasks: grouped[dayName].length,
            progress: Math.round((grouped[dayName].filter((t: any) => t.is_completed).length / grouped[dayName].length) * 100)
          }));
          setCommitmentDays(formatted);
        }
        setLoading(false);
      };
      load();
    }, [planId]);
  
    if (loading) return <div className="py-20 text-center animate-pulse text-slate-300 font-bold italic">جاري تحميل سجل النظام...</div>;
    if (!planId) return <p className="text-center py-10 text-slate-400 font-bold italic text-sm">لم يتم تعيين نظام لهذا العميل بعد.</p>;

    return (
      <div className="space-y-6">
        {commitmentDays.map((day, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] p-6 border-2 border-slate-50 shadow-sm transition-all hover:border-forest/20 group">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-forest/10 group-hover:text-forest transition-colors"><Calendar size={14} /></div>
                  <h4 className="font-black text-slate-800 text-[11px]">{day.dayName}</h4>
               </div>
               <span className="text-[10px] font-black text-forest">{day.progress}%</span>
            </div>
            <div className="space-y-3">
              {day.tasks.map((t: any) => (
                 <div key={t.id} className="flex items-center gap-3 py-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${t.is_completed ? 'bg-forest border-forest text-white' : 'border-slate-200 text-transparent'}`}><CheckCircle size={12} fill="currentColor" /></div>
                    <div className="flex-1 text-right">
                      <p className={`text-[10px] font-bold ${t.is_completed ? 'text-forest/50 line-through' : 'text-slate-600'}`}>{t.content}</p>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
};

export default ClientPerformance;