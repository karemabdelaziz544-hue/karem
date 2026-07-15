import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Phone, ChevronRight, PlusCircle, FileText, Clock, CheckCircle, 
  Activity, TrendingUp, Users, Link as LinkIcon, Edit2, Save, X, Calendar,
  HeartPulse, AlertTriangle, Coffee, Moon, CheckCircle2, Droplet, Info, Dumbbell
} from 'lucide-react';
import Button from '../../components/Button';
import PlanDetailsModal from '../../components/PlanDetailsModal';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast'; 
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
  
  // 🔥 حالات البيانات الطبية ونمط الحياة الجديدة
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [lifestyleProfile, setLifestyleProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      if (profile?.subscription_end_date) {
          setNewDate(profile.subscription_end_date.split('T')[0]);
      } else {
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

      // 👇 جلب الملف الطبي ونمط الحياة للأدمن
      const { data: health } = await supabase.from('health_profile').select('*').eq('user_id', id!).single();
      setHealthProfile(health);

      const { data: lifestyle } = await supabase.from('lifestyle_profile').select('*').eq('user_id', id!).single();
      setLifestyleProfile(lifestyle);

      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const handleActivatePlan = async (planId: string, planType: string) => {
    try {
      // 1. Set all other plans of the same type to completed
      await supabase
        .from('plans')
        .update({ status: 'completed' })
        .eq('user_id', id!)
        .eq('plan_type', planType);

      // 2. Set this plan to active
      const { error } = await supabase
        .from('plans')
        .update({ status: 'active' })
        .eq('id', planId);

      if (error) throw error;
      toast.success("تم تنشيط النظام بنجاح! 🚀");
      
      // Refresh plans
      const { data: clientPlans } = await supabase.from('plans').select('*, plan_tasks(count)').eq('user_id', id!).order('created_at', { ascending: false });
      setPlans(clientPlans || []);
    } catch (err: any) {
      toast.error("فشل تنشيط النظام: " + err.message);
    }
  };

  const handleSaveDate = async () => {
    if (!newDate) return;
    setSavingDate(true);

    try {
      const targetDate = new Date(newDate);
      const now = new Date();
      const newStatus = targetDate > now ? 'active' : 'expired';

      const { error } = await supabase.rpc('admin_update_client_subscription', {
        p_client_id: client!.id,
        p_new_end_date: newDate,
        p_new_status: newStatus
      });

      if (error) throw error;

      toast.success(`تم التحديث: الاشتراك الآن ${newStatus === 'active' ? 'نشط' : 'منتهي'}`);
      
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

  // 🚨 منطق التنبيه الذكي
  const needsAttention = healthProfile && (
    (healthProfile.diseases && healthProfile.diseases.length > 0) ||
    healthProfile.has_allergies ||
    (healthProfile.medications && healthProfile.medications.trim() !== '')
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-6 font-tajawal font-bold">
        <Link to="/admin/clients" className="hover:text-forest">العملاء</Link>
        <ChevronRight size={14} />
        <span className="text-forest">{client.full_name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 font-tajawal">
        <div className="flex items-center gap-6">
          <div className="relative">
             <Avatar src={client.avatar_url} name={client.full_name} size="xl" />
             {manager && <div className="absolute -bottom-1 -right-1 bg-white text-orange rounded-full p-1 border-2 border-orange"><Users size={12} /></div>}
          </div>
            
           <div>
             <h1 className="text-3xl font-extrabold text-forest mb-2">{client.full_name}</h1>
             <div className="flex flex-wrap gap-4 text-gray-600 font-medium text-sm">
                {!manager && <span className="flex items-center gap-2"><Phone size={16}/> {client.phone || 'رقم غير مسجل'}</span>}
                <span className="bg-gray-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                    النوع: {client.gender === 'male' ? 'ذكر' : client.gender === 'female' ? 'أنثى' : 'غير محدد'}
                </span>
                <span className="bg-gray-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                    العمر: {client.age ? `${client.age} سنة` : 'غير محدد'}
                </span>
                <span className="bg-gray-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                    الطول: {client.height ? `${client.height} سم` : 'غير محدد'}
                </span>
                <span className="bg-gray-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                    الوزن: {client.weight ? `${client.weight} كجم` : 'غير محدد'}
                </span>
               
               {manager ? (
                   <div 
                        className="flex items-center gap-2 bg-orange/5 px-4 py-2 rounded-full text-orange font-bold border border-orange/10 cursor-pointer hover:bg-orange/10 transition-colors" 
                        onClick={() => navigate(`/admin/clients/${manager.id}`)}
                   >
                       <LinkIcon size={16} />
                       تابع لـ: {manager.full_name} (إدارة الاشتراك)
                   </div>
               ) : (
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                       <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${client.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {client.subscription_status === 'active' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                           {client.subscription_status === 'active' ? 'نشط' : 'منتهي'}
                       </span>

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
        
        <div className="flex gap-3">
          <Button className="gap-2 shadow-lg" onClick={() => navigate(`/admin/plans/new/${client.id}?type=nutrition`)}>
            <PlusCircle size={20} /> إضافة نظام غذائي جديد
          </Button>
          <Button className="gap-2 shadow-lg bg-slate-800 hover:bg-slate-700 text-white" onClick={() => navigate(`/admin/plans/new/${client.id}?type=workout`)}>
            <PlusCircle size={20} /> إضافة خطة تمارين جديدة
          </Button>
        </div>
      </div>

      {/* 🚨 التنبيه الذكي (Smart Alert) */}
      {needsAttention && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl flex items-start gap-4 mb-8 font-tajawal animate-in zoom-in duration-300">
          <div className="bg-red-100 p-3 rounded-2xl text-red-600 shrink-0">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-red-700 font-black text-lg mb-1">تنبيه طبي هام!</h3>
            <p className="text-red-600 text-sm font-bold leading-relaxed">
              هذا العميل لديه أمراض مزمنة، أو حساسية، أو أدوية نشطة. يُرجى مراجعة <strong className="bg-red-100 px-1 rounded">الملف الطبي</strong> بعناية فائقة.
            </p>
          </div>
        </div>
      )}

      {/* 🏥 الملف الطبي ونمط الحياة (جديد) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 font-tajawal">
        {/* الملف الطبي */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <HeartPulse className="text-red-500" size={24} /> الملف الطبي
          </h3>
          {healthProfile ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <span className="text-xs text-gray-400 font-bold block mb-2">الأمراض المزمنة</span>
                <div className="flex flex-wrap gap-2">
                  {healthProfile.diseases?.length ? (
                    healthProfile.diseases.map((d: string) => <span key={d} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold">{d}</span>)
                  ) : <span className="text-green-600 text-sm font-bold flex items-center gap-1"><CheckCircle2 size={16}/> سليم</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block mb-2">الحساسية</span>
                  {healthProfile.has_allergies ? (
                    <span className="text-red-600 text-sm font-bold"><AlertTriangle size={14} className="inline"/> يوجد ({healthProfile.allergies_details})</span>
                  ) : <span className="text-green-600 text-sm font-bold">لا يوجد</span>}
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block mb-2">تفضيل النظام</span>
                  <span className="text-forest text-sm font-bold">{healthProfile.diet_type || 'عادي'}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <span className="text-xs text-gray-400 font-bold block mb-2">الأدوية والمكملات</span>
                <p className="text-sm text-gray-700 font-bold whitespace-pre-wrap">{healthProfile.medications || 'لا يوجد'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold">
              <Info size={32} className="mx-auto mb-2 opacity-50" /> لم يقم العميل بإدخال ملفه الطبي
            </div>
          )}
        </div>

        {/* نمط الحياة */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <Coffee className="text-orange" size={24} /> نمط الحياة
          </h3>
          {lifestyleProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block mb-1">الهدف الأساسي</span>
                  <span className="text-forest text-sm font-black">{lifestyleProfile.goal || '-'}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block mb-1">المياه والمشروبات</span>
                  <span className="text-blue-600 text-sm font-black">{lifestyleProfile.water_liters} لتر يومياً</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block mb-1">النشاط البدني</span>
                  <span className="text-gray-700 text-sm font-black">{lifestyleProfile.activity_level}</span>
                  {lifestyleProfile.does_exercise && <p className="text-[10px] text-gray-500 mt-1">{lifestyleProfile.exercise_details?.type} ({lifestyleProfile.exercise_details?.days} أيام)</p>}
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block mb-1">النوم والتوتر</span>
                  <p className="text-[11px] text-gray-600 font-bold">نوم: {lifestyleProfile.sleep_hours} س ({lifestyleProfile.sleep_quality})</p>
                  <p className="text-[11px] text-gray-600 font-bold">توتر: {lifestyleProfile.stress_level}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-green-600 font-bold block mb-1">يفضل أكل</span>
                  <p className="text-gray-700 text-sm font-bold truncate">{lifestyleProfile.favorite_foods || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-red-500 font-bold block mb-1">لا يفضل أكل</span>
                  <p className="text-gray-700 text-sm font-bold truncate">{lifestyleProfile.disliked_foods || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold">
              <Moon size={32} className="mx-auto mb-2 opacity-50" /> لم يقم العميل بإدخال نمط حياته
            </div>
          )}
        </div>
      </div>

      {/* باقي الأقسام (أفراد العائلة، InBody، الملفات...) كما هي */}
      {!manager && familyMembers.length > 0 && (
          <div className="mb-8 font-tajawal">
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
      <div className="mb-8 font-tajawal">
        <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2"><Activity className="text-orange" /> سجلات القياس (InBody)</h2>
        {inbodyRecords.length === 0 ? <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400 font-bold">لا توجد سجلات.</div> : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-500 text-sm font-bold"><tr><th className="p-4">التاريخ</th><th className="p-4">الوزن</th><th className="p-4">تقرير AI</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{inbodyRecords.map(r => (<tr key={r.id}><td className="p-4">{new Date(r.record_date).toLocaleDateString('ar-EG')}</td><td className="p-4 font-bold">{r.weight}</td><td className="p-4 text-xs text-blue-600 truncate max-w-xs">{r.ai_summary}</td></tr>))}</tbody>
                </table>
            </div>
        )}
      </div>

      {/* Files & Subscription Info Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8 font-tajawal">
        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-gray-200">
            <h3 className="font-bold text-forest mb-4 flex items-center gap-2"><FileText className="text-orange" /> الملفات الطبية</h3>
            {docs.length === 0 ? <p className="text-gray-400 text-sm font-bold">لا توجد ملفات.</p> : <ul className="space-y-3">{docs.map(d => <li key={d.id} className="text-sm"><a href={d.file_url} target="_blank" className="text-blue-600 font-bold hover:underline">{d.file_name}</a></li>)}</ul>}
        </div>
        
        <div className="md:col-span-2 bg-forest text-white p-6 rounded-3xl relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><TrendingUp className="text-orange" /> تفاصيل الاشتراك</h3>
                <div className="flex gap-12">
                    <div>
                        <span className="block text-white/60 text-xs mb-1 font-bold">حالة الحساب</span>
                        <span className={`text-3xl font-black uppercase tracking-wider ${effectiveStatus === 'active' ? 'text-green-400' : 'text-orange'}`}>
                            {effectiveStatus === 'active' ? 'نشط' : 'منتهي'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-white/60 text-xs mb-1 font-bold">تاريخ الانتهاء</span>
                        <span className="text-xl font-bold">
                           {effectiveEndDate ? new Date(effectiveEndDate).toLocaleDateString('ar-EG') : '--'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>



    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-tajawal mb-6">
      {/* Diet Plans List */}
      <div>
        <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2"><FileText size={24} className="text-orange"/> أرشيف الأنظمة الغذائية</h2>
        <div className="space-y-4">
          {plans.filter(p => p.plan_type === 'nutrition' || !p.plan_type).length === 0 ? (
            <p className="text-gray-400 text-sm font-bold bg-white p-5 rounded-2xl border border-gray-100 text-center">لا توجد أنظمة غذائية سابقة.</p>
          ) : (
            plans.filter(p => p.plan_type === 'nutrition' || !p.plan_type).map(plan => (
              <div 
                  key={plan.id} 
                  onClick={() => { setSelectedPlanId(plan.id); setIsModalOpen(true); }}
                  className={`bg-white p-5 rounded-2xl border flex justify-between items-center cursor-pointer transition-all group ${plan.status === 'active' ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/30' : 'border-gray-200 hover:border-orange hover:shadow-md'}`}
              >
                  <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-orange transition-colors">{plan.title}</h3>
                        {plan.status === 'active' && (
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black">نشط حالياً ⚡</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{new Date(plan.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                      {plan.status !== 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivatePlan(plan.id, plan.plan_type || 'nutrition');
                          }}
                          className="text-[10px] bg-orange/10 hover:bg-orange text-orange hover:text-white px-3 py-1.5 rounded-xl font-black transition-colors"
                        >
                          تنشيط 🚀
                        </button>
                      )}
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{plan.plan_tasks[0]?.count || 0} مهمة</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-orange" />
                  </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Workout Plans List */}
      <div>
        <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2"><Dumbbell size={24} className="text-orange"/> أرشيف خطط التمارين</h2>
        <div className="space-y-4">
          {plans.filter(p => p.plan_type === 'workout').length === 0 ? (
            <p className="text-gray-400 text-sm font-bold bg-white p-5 rounded-2xl border border-gray-100 text-center">لا توجد خطط تمارين سابقة.</p>
          ) : (
            plans.filter(p => p.plan_type === 'workout').map(plan => (
              <div 
                  key={plan.id} 
                  onClick={() => { setSelectedPlanId(plan.id); setIsModalOpen(true); }}
                  className={`bg-white p-5 rounded-2xl border flex justify-between items-center cursor-pointer transition-all group ${plan.status === 'active' ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/30' : 'border-gray-200 hover:border-orange hover:shadow-md'}`}
              >
                  <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-orange transition-colors">{plan.title}</h3>
                        {plan.status === 'active' && (
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black">نشط حالياً ⚡</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{new Date(plan.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                      {plan.status !== 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivatePlan(plan.id, plan.plan_type || 'workout');
                          }}
                          className="text-[10px] bg-orange/10 hover:bg-orange text-orange hover:text-white px-3 py-1.5 rounded-xl font-black transition-colors"
                        >
                          تنشيط 🚀
                        </button>
                      )}
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{plan.plan_tasks[0]?.count || 0} تمرين</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-orange" />
                  </div>
              </div>
            ))
          )}
        </div>
      </div>
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