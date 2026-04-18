import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, User, Calendar, Eye, Search, Mail, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PlanDetailsModal from '../../components/PlanDetailsModal';

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    
    let query = supabase
      .from('plans')
      .select('*, profiles!user_id(full_name, email, assigned_doctor_id), plan_tasks(count)');

    const { data, error } = await query.order('created_at', { ascending: false });
    
    // إذا كان دكتور، نفلتر الأنظمة لتشمل فقط المرضى المخصصين له
    const filteredByRole = profile?.role === 'doctor' 
      ? data?.filter(p => p.profiles?.assigned_doctor_id === user.id) 
      : data;

    setPlans(filteredByRole || []);
    setLoading(false);
  };

  const filteredPlans = plans.filter(plan => {
    const q = searchQuery.toLowerCase();
    return plan.title?.toLowerCase().includes(q) || 
           plan.profiles?.full_name?.toLowerCase().includes(q) ||
           plan.profiles?.email?.toLowerCase().includes(q);
  });

  const getEditPath = (id: string) => {
    return profile?.role === 'admin' ? `/admin/plans/edit/${id}` : `/doctor-dashboard/plans/edit/${id}`;
  };

  if (loading) return <div className="p-10 text-center font-black text-forest animate-pulse">جاري تحميل الأرشيف...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-forest italic">
            أرشيف الأنظمة ({filteredPlans.length})
        </h1>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center w-full md:w-96 group focus-within:ring-2 focus-within:ring-orange/20 transition-all">
          <Search className="text-slate-400 ml-2 group-focus-within:text-orange" size={20} />
          <input 
            type="text" 
            placeholder="بحث باسم الخطة أو العميل..." 
            className="bg-transparent outline-none w-full text-sm font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map(plan => (
          <div key={plan.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="bg-orange/10 p-4 rounded-2xl text-orange group-hover:bg-orange group-hover:text-white transition-colors">
                <FileText size={24}/>
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-black text-slate-800 truncate" title={plan.title}>{plan.title}</h3>
                <div className="space-y-1 mt-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <User size={14} className="text-slate-400"/> {plan.profiles?.full_name || 'عميل'}
                  </span>
                  <span className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Calendar size={12}/> {new Date(plan.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                <div className="bg-forest/5 px-3 py-1 rounded-lg text-[10px] font-black text-forest border border-forest/10">
                  {plan.plan_tasks[0]?.count || 0} مهام
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate(getEditPath(plan.id))} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-xs font-black transition-all">تعديل</button>
                    <button onClick={() => { setSelectedPlanId(plan.id); setIsModalOpen(true); }} className="bg-orange text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-orange/20">عرض</button>
                </div>
            </div>
          </div>
        ))}
      </div>

      <PlanDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} planId={selectedPlanId} />
    </div>
  );
};

export default PlansPage;