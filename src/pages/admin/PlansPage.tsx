import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, User, Calendar, Eye, Search, Mail, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PlanDetailsModal from '../../components/PlanDetailsModal';

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // حالة النافذة المنبثقة
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      // جلب الخطط مع بيانات العميل (الاسم والإيميل) وعدد المهام
      const { data } = await supabase
        .from('plans')
        .select('*, profiles(full_name, email), plan_tasks(count)')
        .order('created_at', { ascending: false });
      setPlans(data || []);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  // منطق البحث (فلترة)
  const filteredPlans = plans.filter(plan => {
    const query = searchQuery.toLowerCase();
    const planTitle = plan.title?.toLowerCase() || '';
    const clientName = plan.profiles?.full_name?.toLowerCase() || '';
    const clientEmail = plan.profiles?.email?.toLowerCase() || '';

    return planTitle.includes(query) || clientName.includes(query) || clientEmail.includes(query);
  });

  const openPlanDetails = (planId: string) => {
    setSelectedPlanId(planId);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-10 text-center font-bold text-forest">جاري تحميل الأرشيف...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      {/* الهيدر وشريط البحث */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-forest">
             أرشيف الأنظمة ({filteredPlans.length})
        </h1>
        
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center w-full md:w-96 group focus-within:border-orange transition-colors">
          <Search className="text-gray-400 ml-2 group-focus-within:text-orange" size={20} />
          <input 
            type="text" 
            placeholder="بحث باسم الخطة، العميل، أو الإيميل..." 
            className="bg-transparent outline-none w-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* شبكة الكروت */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map(plan => (
          <div 
            key={plan.id} 
            className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all group relative"
          >
            <div className="flex items-start gap-4">
              <div className="bg-orange/10 p-3 rounded-xl text-orange group-hover:bg-orange group-hover:text-white transition-colors">
                <FileText size={24}/>
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg text-forest truncate" title={plan.title}>{plan.title}</h3>
                
                <div className="flex flex-col gap-1 text-sm text-gray-500 mt-1">
                   {/* اسم العميل */}
                   <span className="flex items-center gap-1 truncate">
                     <User size={14}/> {plan.profiles?.full_name || 'عميل غير معروف'}
                   </span>
                   
                   {/* إيميل العميل */}
                   {plan.profiles?.email && (
                       <span className="flex items-center gap-1 truncate text-xs text-gray-400" title={plan.profiles.email}>
                         <Mail size={12}/> {plan.profiles.email}
                       </span>
                   )}
                   
                   {/* التاريخ */}
                   <span className="flex items-center gap-1 text-xs mt-1">
                     <Calendar size={12}/> {new Date(plan.created_at).toLocaleDateString('ar-EG')}
                   </span>
                </div>
              </div>
            </div>
            
            {/* الفوتر: عدد المهام والأزرار */}
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50">
                <div className="bg-gray-50 px-3 py-1 rounded-lg text-xs font-bold text-gray-500 border border-gray-100">
                  {plan.plan_tasks[0]?.count || 0} مهام
                </div>
                
                <div className="flex gap-2">
                    {/* زر التعديل */}
                    <button 
                        onClick={() => navigate(`/admin/plans/edit/${plan.id}`)}
                        className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        title="تعديل النظام"
                    >
                        <Edit size={16} />
                        تعديل
                    </button>

                    {/* زر العرض */}
                    <button 
                        onClick={() => openPlanDetails(plan.id)}
                        className="flex items-center gap-1 text-sm font-bold text-orange hover:bg-orange/5 px-3 py-1.5 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                    >
                        <Eye size={16} />
                        عرض
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPlans.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-4">
              <Search size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">لا توجد نتائج مطابقة للبحث.</p>
          </div>
      )}

      {/* نافذة التفاصيل */}
      <PlanDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        planId={selectedPlanId} 
      />
    </div>
  );
};

export default PlansPage;