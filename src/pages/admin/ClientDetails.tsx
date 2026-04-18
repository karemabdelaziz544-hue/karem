import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Phone, ChevronRight, PlusCircle, FileText, Clock, CheckCircle, Activity, TrendingUp, Users, Link as LinkIcon, Edit2, Save, X, Calendar } from 'lucide-react';
import Button from '../../components/Button';
import PlanDetailsModal from '../../components/PlanDetailsModal';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast'; // تأكد من تثبيت هذه المكتبة واستيرادها
import type { Profile, Plan, ClientDocument, InbodyRecord } from '../../types';

const ClientDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Profile | null>(null);
  const [manager, setManager] = useState<Profile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [inbodyRecords, setInbodyRecords] = useState<InbodyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 👇 حالات التعديل الجديدة
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          manager:profiles!manager_id ( * )
        `) 
        .eq('id', id!)
        .single();

      if (error) console.error("Error fetching profile:", error);
        
      setClient(profile);

      // تهيئة حقل التاريخ للتعديل
      if (profile?.subscription_end_date) {
          setNewDate(profile.subscription_end_date.split('T')[0]);
      } else {
          // لو مفيش تاريخ، نحط تاريخ النهاردة كبداية
          setNewDate(new Date().toISOString().split('T')[0]);
      }

      const isDependent = profile?.manager_id && profile?.manager && profile?.manager.full_name;

      if (isDependent) {
          setManager(profile.manager);
      } else {
          const { data: family } = await supabase
            .from('profiles')
            .select('*')
            .eq('manager_id', id!);
          setFamilyMembers(family || []);
      }

      const { data: clientPlans } = await supabase.from('plans').select('*, plan_tasks(count)').eq('user_id', id!).order('created_at', { ascending: false });
      setPlans(clientPlans || []);

      const { data: clientDocs } = await supabase.from('client_documents').select('*').eq('user_id', id!).order('created_at', { ascending: false });
      setDocs(clientDocs || []);

      const { data: inbodyData } = await supabase.from('inbody_records').select('*').eq('user_id', id!).order('record_date', { ascending: false });
      setInbodyRecords(inbodyData || []);

      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  // 👇 دالة الحفظ الذكية
  const handleSaveDate = async () => {
    if (!newDate) return;
    setSavingDate(true);

    try {
      // منطق ذكي: مقارنة التاريخ لتحديد الحالة
      const targetDate = new Date(newDate);
      const now = new Date();
      // لو التاريخ المختار أكبر من الآن -> نشط، غير كده -> منتهي
      const newStatus = targetDate > now ? 'active' : 'expired';

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_end_date: newDate,
          subscription_status: newStatus,
          is_locked: newStatus === 'expired' // (اختياري) قفل الحساب لو منتهي
        })
        .eq('id', client!.id);

      if (error) throw error;

      toast.success(`تم التحديث: الاشتراك الآن ${newStatus === 'active' ? 'نشط' : 'منتهي'}`);
      
      // تحديث البيانات محلياً
      setClient(prev => prev ? { ...prev, subscription_status: newStatus, subscription_end_date: newDate } : prev);
      setIsEditingDate(false);

    } catch (error) {
      toast.error("فشل التحديث");
    } finally {
      setSavingDate(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-forest">جاري التحميل...</div>;
  if (!client) return <div className="p-10 text-center">لم يتم العثور على العميل</div>;

  const effectiveStatus = manager ? manager.subscription_status : client.subscription_status;
  const effectiveEndDate = manager ? manager.subscription_end_date : client.subscription_end_date;

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
        <Link to="/admin/clients" className="hover:text-forest">العملاء</Link>
        <ChevronRight size={14} />
        <span className="text-forest font-bold">{client.full_name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
             <Avatar src={client.avatar_url} name={client.full_name} size="xl" />
             {manager && <div className="absolute -bottom-1 -right-1 bg-white text-orange rounded-full p-1 border-2 border-orange"><Users size={12} /></div>}
          </div>
           
           <div>
             <h1 className="text-3xl font-extrabold text-forest mb-2">{client.full_name}</h1>
             <div className="flex flex-wrap gap-4 text-gray-600 font-medium text-sm">
               {!manager && <span className="flex items-center gap-2"><Phone size={16}/> {client.phone || 'رقم غير مسجل'}</span>}
               
               {/* 👇 هنا الجزء المعدل: عرض الحالة والتاريخ مع التعديل */}
               {manager ? (
                   // لو تابع: عرض زر الذهاب للمدير فقط
                   <div 
                        className="flex items-center gap-2 bg-orange/5 px-4 py-2 rounded-full text-orange font-bold border border-orange/10 cursor-pointer hover:bg-orange/10 transition-colors" 
                        onClick={() => navigate(`/admin/clients/${manager.id}`)}
                   >
                       <LinkIcon size={16} />
                       تابع لـ: {manager.full_name} (إدارة الاشتراك)
                   </div>
               ) : (
                   // لو حساب رئيسي: إمكانية تعديل التاريخ
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                       {/* بادج الحالة */}
                       <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${client.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {client.subscription_status === 'active' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                           {client.subscription_status === 'active' ? 'نشط' : 'منتهي'}
                       </span>

                       {/* منطقة التاريخ والتحرير */}
                       <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                           <Calendar size={14} className="text-gray-400"/>
                           {isEditingDate ? (
                               <div className="flex items-center gap-2 animate-in fade-in">
                                   <input 
                                     type="date" 
                                     value={newDate}
                                     onChange={(e) => setNewDate(e.target.value)}
                                     className="bg-white border border-gray-300 rounded px-2 py-0.5 text-sm focus:border-forest outline-none"
                                   />
                                   <button onClick={handleSaveDate} disabled={savingDate} className="text-green-600 hover:bg-green-100 p-1 rounded">
                                       <Save size={16}/>
                                   </button>
                                   <button onClick={() => setIsEditingDate(false)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                       <X size={16}/>
                                   </button>
                               </div>
                           ) : (
                               <>
                                   <span className="text-sm font-mono text-gray-700">
                                       {client.subscription_end_date ? new Date(client.subscription_end_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                                   </span>
                                   <button 
                                     onClick={() => setIsEditingDate(true)} 
                                     className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-forest transition-colors"
                                     title="تعديل تاريخ الانتهاء"
                                   >
                                       <Edit2 size={14}/>
                                   </button>
                               </>
                           )}
                       </div>
                   </div>
               )}
             </div>
           </div>
        </div>
        
        <Button className="gap-2 shadow-lg" onClick={() => navigate(`/admin/plans/new/${client.id}`)}>
          <PlusCircle size={20} /> إضافة نظام غذائي جديد
        </Button>
      </div>

      {/* باقي الأقسام (أفراد العائلة، InBody، الملفات...) كما هي */}
      {!manager && familyMembers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
                <Users className="text-orange" /> أفراد العائلة المضافين ({familyMembers.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyMembers.map(member => (
                    <div 
                        key={member.id} 
                        onClick={() => { 
                            setLoading(true); 
                            navigate(`/admin/clients/${member.id}`); 
                            setTimeout(() => window.location.reload(), 100); 
                        }}
                        className="bg-white p-4 rounded-xl border border-gray-200 hover:border-orange cursor-pointer flex items-center gap-3 transition-all group"
                    >
                        <div className="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center text-orange font-bold group-hover:bg-orange group-hover:text-white transition-colors">
                            {member.full_name?.[0]}
                        </div>
                        <div>
                            <h4 className="font-bold text-forest group-hover:text-orange transition-colors">{member.full_name}</h4>
                            <p className="text-xs text-gray-500">{member.relation || 'تابع'}</p>
                        </div>
                        <ChevronRight className="mr-auto text-gray-300 group-hover:text-orange" size={16} />
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* InBody Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2"><Activity className="text-orange" /> سجلات القياس (InBody)</h2>
        {inbodyRecords.length === 0 ? <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400">لا توجد سجلات.</div> : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-500 text-sm font-bold"><tr><th className="p-4">التاريخ</th><th className="p-4">الوزن</th><th className="p-4">تقرير AI</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{inbodyRecords.map(r => (<tr key={r.id}><td className="p-4">{new Date(r.record_date).toLocaleDateString('ar-EG')}</td><td className="p-4 font-bold">{r.weight}</td><td className="p-4 text-xs text-blue-600 truncate max-w-xs">{r.ai_summary}</td></tr>))}</tbody>
                </table>
            </div>
        )}
      </div>

      {/* Files & Subscription Info Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-gray-200">
            <h3 className="font-bold text-forest mb-4 flex items-center gap-2"><FileText className="text-orange" /> الملفات الطبية</h3>
            {docs.length === 0 ? <p className="text-gray-400 text-sm">لا توجد ملفات.</p> : <ul className="space-y-3">{docs.map(d => <li key={d.id} className="text-sm"><a href={d.file_url} target="_blank" className="text-blue-600 hover:underline">{d.file_name}</a></li>)}</ul>}
        </div>
        
        {/* Subscription Detail Box (Updated to reflect current status) */}
        <div className="md:col-span-2 bg-forest text-cream p-6 rounded-3xl relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><TrendingUp className="text-orange" /> تفاصيل الاشتراك</h3>
                <div className="flex gap-12">
                    <div>
                        <span className="block text-white/60 text-xs mb-1">حالة الحساب</span>
                        <span className={`text-3xl font-black uppercase tracking-wider ${effectiveStatus === 'active' ? 'text-green-400' : 'text-orange'}`}>
                            {effectiveStatus === 'active' ? 'نشط' : 'منتهي'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-white/60 text-xs mb-1">تاريخ الانتهاء</span>
                        <span className="text-xl font-bold">
                           {effectiveEndDate ? new Date(effectiveEndDate).toLocaleDateString('ar-EG') : '--'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

    <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2"><FileText size={24} className="text-orange"/> أرشيف الأنظمة</h2>
  <div className="space-y-4">
    {plans.map(plan => (
        <div 
            key={plan.id} 
            onClick={() => { setSelectedPlanId(plan.id); setIsModalOpen(true); }}
            className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center cursor-pointer hover:border-orange hover:shadow-md transition-all group"
        >
            <div>
                <h3 className="font-bold text-lg text-gray-800 group-hover:text-orange transition-colors">{plan.title}</h3>
                <p className="text-sm text-gray-400">{new Date(plan.created_at).toLocaleDateString('ar-EG')}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{plan.plan_tasks[0]?.count || 0} مهمة</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-orange" />
            </div>
        </div>
    ))}
  </div>

  <PlanDetailsModal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    planId={selectedPlanId} 
  />
</div>
  );
};

export default ClientDetails;