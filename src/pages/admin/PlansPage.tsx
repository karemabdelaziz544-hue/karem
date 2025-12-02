import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, User, Calendar } from 'lucide-react';

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('plans')
        .select('*, profiles(full_name), plan_tasks(count)')
        .order('created_at', { ascending: false });
      setPlans(data || []);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل الأرشيف...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-forest mb-8">أرشيف الأنظمة ({plans.length})</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="bg-orange/10 p-3 rounded-xl text-orange"><FileText size={24}/></div>
              <div>
                <h3 className="font-bold text-lg text-forest">{plan.title}</h3>
                <div className="flex flex-col gap-1 text-sm text-gray-500 mt-1">
                   <span className="flex items-center gap-1"><User size={14}/> {plan.profiles?.full_name}</span>
                   <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(plan.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 text-center">
              {plan.plan_tasks[0]?.count || 0} مهام
            </div>
          </div>
        ))}
      </div>
      {plans.length === 0 && <div className="text-center text-gray-400 py-10">الأرشيف فارغ</div>}
    </div>
  );
};

export default PlansPage;