import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useFamily } from '../contexts/FamilyContext';
import Button from '../components/Button';
import { ArrowRight, Clock, History as HistoryIcon, FileText, ChevronLeft } from 'lucide-react';
import PlanDetailsModal from '../components/PlanDetailsModal'; // 👈 استيراد المكون

const History: React.FC = () => {
  const { currentProfile } = useFamily();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 👇 حالة النافذة المنبثقة
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (currentProfile) fetchHistory();
  }, [currentProfile]);

  const fetchHistory = async () => {
    try {
      const { data } = await supabase
        .from('plans')
        .select(`*, plan_tasks (count)`) // مش لازم نجيب كل التاسكات هنا، المودال هيجيبها
        .eq('user_id', currentProfile?.id ?? '')
        .order('created_at', { ascending: false });

      setPlans(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (count: { count: number }[]) => {
    // حساب تقريبي للتقدم من عدد المهام (أو ممكن نلغي الشريط لو مش دقيق)
    // هنا بنعرض عدد المهام وخلاص
    return count && count.length > 0 ? count[0].count : 0;
  };

  const openPlanDetails = (planId: string) => {
    setSelectedPlanId(planId);
    setIsModalOpen(true);
  };

  if (!currentProfile) return <div className="text-center py-20">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" className="!p-2 rounded-xl" onClick={() => navigate('/dashboard')}>
                <ArrowRight size={20} />
            </Button>
            <div>
                <h1 className="text-2xl font-extrabold text-forest flex items-center gap-2">
                    <HistoryIcon className="text-orange" /> أرشيف رحلتك
                </h1>
                <p className="text-gray-500 text-sm">
                    سجل كامل لإنجازات <span className="font-bold text-forest">{currentProfile.full_name}</span>
                </p>
            </div>
        </div>

        {loading ? (
            <div className="text-center py-20 text-gray-400">جاري تحميل الأرشيف...</div>
        ) : plans.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">لا يوجد سجل تاريخي حتى الآن.</p>
            </div>
        ) : (
            <div className="grid gap-4">
                {plans.map((plan, index) => {
                    const taskCount = plan.plan_tasks[0]?.count || 0;
                    const isCurrent = plan.status === 'active';
                    
                    return (
                        <div 
                            key={plan.id} 
                            onClick={() => openPlanDetails(plan.id)} // 👈 فتح النافذة عند الضغط
                            className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer group
                                ${isCurrent ? 'border-orange shadow-md' : 'border-gray-100 hover:border-forest hover:shadow-md'}
                            `}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${isCurrent ? 'bg-orange/10 text-orange' : 'bg-gray-100 text-gray-500'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-forest flex items-center gap-2 group-hover:text-orange transition-colors">
                                            {plan.title}
                                            {isCurrent && <span className="bg-orange text-white text-[10px] px-2 py-0.5 rounded-full">الحالية</span>}
                                        </h3>
                                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                                            <Clock size={12} /> تم الإنشاء: {new Date(plan.created_at).toLocaleDateString('ar-EG')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 group-hover:text-orange transition-colors">
                                    <span className="text-xs font-bold bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 group-hover:bg-orange/5 group-hover:border-orange/20">
                                        {taskCount} مهمة
                                    </span>
                                    <ChevronLeft size={16} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* 👇 استدعاء النافذة هنا */}
      <PlanDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        planId={selectedPlanId} 
      />
    </div>
  );
};

export default History;