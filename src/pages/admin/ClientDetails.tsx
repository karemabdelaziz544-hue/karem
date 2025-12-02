import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User, Phone, Calendar, ChevronRight, PlusCircle, FileText, Clock, CheckCircle, Trash2 } from 'lucide-react';
import Button from '../../components/Button';

const ClientDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      setClient(profile);

      const { data: clientPlans } = await supabase
        .from('plans')
        .select('*, plan_tasks(count)')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      setPlans(clientPlans || []);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const toggleSubscription = async () => {
    const newStatus = client.subscription_status === 'active' ? 'expired' : 'active';
    await supabase.from('profiles').update({ subscription_status: newStatus }).eq('id', client.id);
    setClient({ ...client, subscription_status: newStatus });
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;
  if (!client) return <div className="p-10 text-center">لم يتم العثور على العميل</div>;

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
        <Link to="/admin/clients" className="hover:text-forest">العملاء</Link>
        <ChevronRight size={14} />
        <span className="text-forest font-bold">{client.full_name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center text-orange text-3xl font-bold border-4 border-orange/5">
             {client.full_name?.[0]}
           </div>
           <div>
             <h1 className="text-3xl font-extrabold text-forest mb-2">{client.full_name}</h1>
             <div className="flex flex-wrap gap-4 text-gray-600 font-medium text-sm">
               <span className="flex items-center gap-2"><Phone size={16}/> {client.phone}</span>
               <button onClick={toggleSubscription} className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${client.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {client.subscription_status === 'active' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                  {client.subscription_status === 'active' ? 'اشتراك نشط' : 'اشتراك غير مفعل'}
               </button>
             </div>
           </div>
        </div>
        
        <Button className="gap-2 shadow-lg" onClick={() => navigate(`/admin/plans/new/${client.id}`)}>
          <PlusCircle size={20} /> إضافة نظام غذائي جديد
        </Button>
      </div>

      {/* Plans History */}
      <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
        <FileText size={24} className="text-orange"/> أرشيف الأنظمة ({plans.length})
      </h2>
      
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
             لا توجد خطط سابقة لهذا العميل. ابدأ بإنشاء واحدة!
          </div>
        ) : (
          plans.map(plan => (
            <div key={plan.id} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-orange/30 hover:shadow-md transition-all flex justify-between items-center group">
               <div className="flex items-center gap-4">
                 <div className="bg-forest/5 p-3 rounded-xl text-forest group-hover:bg-forest group-hover:text-white transition-colors">
                   <FileText size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg text-gray-800">{plan.title}</h3>
                   <p className="text-sm text-gray-400 flex items-center gap-1">
                     <Clock size={12} /> {new Date(plan.created_at).toLocaleDateString('ar-EG')}
                   </p>
                 </div>
               </div>
               <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                 {plan.plan_tasks[0]?.count || 0} مهمة
               </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientDetails;