import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ChevronRight, FileText, Activity, 
  Plus, Phone, Mail, HeartPulse, 
  AlertTriangle, Coffee, Moon, Droplet, 
  CheckCircle2, Info
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import DoctorMedicalView from './DoctorMedicalView';

import { Database } from '../../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Plan = Database['public']['Tables']['plans']['Row'];

const DoctorClientDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Profile | null>(null);
  const [pastPlans, setPastPlans] = useState<Plan[]>([]);
  
  // 🔥 حالات البيانات الجديدة
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [lifestyleProfile, setLifestyleProfile] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        // 1. جلب بيانات العميل الأساسية
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id!)
          .single();
        
        if (error) {
          navigate('/doctor-dashboard');
          return;
        }

        if (profile) {
          setClient(profile);
          
          // 2. جلب الخطط السابقة
          const { data: plans } = await supabase
            .from('plans')
            .select('*')
            .eq('user_id', id!)
            .order('created_at', { ascending: false });
          setPastPlans(plans || []);

          // 3. جلب الملف الطبي (الجديد)
          const { data: health } = await supabase
            .from('health_profile')
            .select('*')
            .eq('user_id', id!)
            .single();
          setHealthProfile(health);

          // 4. جلب نمط الحياة (الجديد)
          const { data: lifestyle } = await supabase
            .from('lifestyle_profile')
            .select('*')
            .eq('user_id', id!)
            .single();
          setLifestyleProfile(lifestyle);
        }
      } catch (err) {
        console.error("Error fetching client details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [id, navigate]);

  if (loading) return <div className="p-20 text-center font-black text-forest animate-pulse">جاري جلب بيانات المريض...</div>;

  // 🚨 منطق التنبيه الذكي (Smart Alert Logic)
  const needsAttention = healthProfile && (
    (healthProfile.diseases && healthProfile.diseases.length > 0) ||
    healthProfile.has_allergies ||
    (healthProfile.medications && healthProfile.medications.trim() !== '')
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-tajawal pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-8 font-bold">
        <Link to="/doctor-dashboard" className="hover:text-forest">لوحة التحكم</Link>
        <ChevronRight size={14} />
        <span className="text-slate-800">ملف {client?.full_name}</span>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <Avatar src={client?.avatar_url ?? undefined} name={client?.full_name ?? undefined} size="xl" />
          <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">{client?.full_name}</h1>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
              <span className="flex items-center gap-2"><Phone size={16} className="text-forest"/> {client?.phone}</span>
              <span className="flex items-center gap-2"><Mail size={16} className="text-forest"/> {client?.email}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/doctor-dashboard/plans/new/${client?.id}`)}
          className="bg-orange text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-orange/20 hover:scale-105 transition-all shrink-0"
        >
          <Plus size={20} /> إضافة نظام جديد
        </button>
      </div>

      {/* Medical Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* العمود الجانبي (المؤشرات والأنظمة) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* مؤشرات سريعة */}
          <div className="bg-forest text-white p-8 rounded-[2.5rem] shadow-lg">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
               <Activity size={20} /> مؤشرات سريعة
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-white/10 pb-2 text-sm">
                <span>حالة الاشتراك</span>
                <span className="font-black">{client?.subscription_status === 'active' ? 'نشط' : 'منتهي'}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2 text-sm">
                <span>تاريخ الانضمام</span>
                <span className="font-black">{client?.created_at ? new Date(client.created_at).toLocaleDateString('ar-EG') : '-'}</span>
              </div>
            </div>
          </div>

          {/* سجل الأنظمة السابقة */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-orange" /> سجل الأنظمة
            </h3>
            <div className="space-y-4">
              {pastPlans.length > 0 ? (
                pastPlans.map((plan) => (
                  <div 
                    key={plan.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-forest/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/doctor-dashboard/plans/edit/${plan.id}`)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-black text-[13px] text-slate-800 group-hover:text-forest transition-colors">
                          {plan.title || 'نظام غذائي وتدريبي'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {new Date(plan.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <span className="text-[9px] bg-white px-2 py-1 rounded-lg border border-slate-100 font-black text-slate-400 group-hover:text-forest group-hover:border-forest/20 transition-all">
                        مراجعة
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-[11px] font-bold text-slate-400 italic">لا يوجد سجل أنظمة لهذا البطل</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* العمود الرئيسي (السجلات الطبية InBody & Lab + Profiles) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 🚨 التنبيه الذكي (Smart Alert) */}
          {needsAttention && (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] flex items-start gap-4 animate-in fade-in zoom-in duration-500">
              <div className="bg-red-100 p-3 rounded-2xl text-red-600 shrink-0">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-red-700 font-black text-lg mb-1">This case requires attention!</h3>
                <p className="text-red-600 text-sm font-bold leading-relaxed">
                  هذا العميل يعاني من حالة طبية (أمراض مزمنة، حساسية، أو يتناول أدوية). يرجى مراجعة <strong className="bg-red-100 px-1 rounded">الملف الطبي</strong> بعناية قبل إصدار النظام الغذائي لتجنب أي تعارض.
                </p>
              </div>
            </div>
          )}

          {/* 🏥 الملف الطبي (Static Health Profile) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <HeartPulse className="text-red-500" size={24} /> الملف الطبي (Health Profile)
            </h3>
            {healthProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-2">الأمراض المزمنة</span>
                  <div className="flex flex-wrap gap-2">
                    {healthProfile.diseases?.length ? (
                      healthProfile.diseases.map((d: string) => <span key={d} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold">{d}</span>)
                    ) : <span className="text-green-600 text-sm font-bold flex items-center gap-1"><CheckCircle2 size={16}/> سليم</span>}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-2">الحساسية</span>
                  {healthProfile.has_allergies ? (
                    <span className="text-red-600 text-sm font-bold flex items-center gap-1"><AlertTriangle size={16}/> يوجد ({healthProfile.allergies_details})</span>
                  ) : <span className="text-green-600 text-sm font-bold flex items-center gap-1"><CheckCircle2 size={16}/> لا يوجد</span>}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl md:col-span-2">
                  <span className="text-xs text-slate-400 font-bold block mb-2">الأدوية والمكملات الحالية</span>
                  <p className="text-sm text-slate-700 font-bold whitespace-pre-wrap">{healthProfile.medications || 'لا يوجد'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-2">نوع النظام المفضل</span>
                  <p className="text-sm text-forest font-bold">{healthProfile.diet_type || 'عادي'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-2">تاريخ مرضي بالعائلة</span>
                  <div className="flex flex-wrap gap-2">
                    {healthProfile.family_history?.length ? (
                      healthProfile.family_history.map((d: string) => <span key={d} className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">{d}</span>)
                    ) : <span className="text-slate-500 text-sm font-bold">لا يوجد</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Info size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm font-bold">لم يقم العميل بإدخال بياناته الطبية حتى الآن.</p>
              </div>
            )}
          </div>

          {/* ☕ نمط الحياة (Lifestyle Profile) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Coffee className="text-orange" size={24} /> نمط الحياة (Lifestyle Profile)
            </h3>
            {lifestyleProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">الهدف</span>
                  <span className="text-forest text-sm font-black">{lifestyleProfile.goal || '-'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">المياه والمشروبات</span>
                  <span className="text-blue-600 text-sm font-black">{lifestyleProfile.water_liters} لتر يومياً</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">النشاط الرياضي</span>
                  <span className="text-slate-700 text-sm font-black">{lifestyleProfile.activity_level}</span>
                  {lifestyleProfile.does_exercise && <p className="text-[10px] text-slate-500 mt-1">{lifestyleProfile.exercise_details?.type} ({lifestyleProfile.exercise_details?.days} أيام)</p>}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">عادات الأكل</span>
                  <ul className="text-[11px] text-slate-600 font-bold space-y-1 mt-1">
                    <li>إفطار: {lifestyleProfile.has_breakfast ? 'نعم' : 'لا'}</li>
                    <li>سناكس: {lifestyleProfile.has_snacks ? 'نعم' : 'لا'}</li>
                    <li>أكل متأخر: {lifestyleProfile.late_night_eating ? 'نعم' : 'لا'}</li>
                  </ul>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">النوم والتوتر</span>
                  <p className="text-[11px] text-slate-600 font-bold space-y-1 mt-1">
                    نوم: {lifestyleProfile.sleep_hours} ساعات ({lifestyleProfile.sleep_quality})<br/>
                    توتر: {lifestyleProfile.stress_level}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl md:col-span-3 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-green-600 font-bold block mb-1">أطعمة مفضلة</span>
                    <span className="text-slate-700 text-sm font-bold bg-white px-2 py-1 rounded">{lifestyleProfile.favorite_foods || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-red-500 font-bold block mb-1">أطعمة غير مفضلة (أو ممنوعة)</span>
                    <span className="text-slate-700 text-sm font-bold bg-white px-2 py-1 rounded">{lifestyleProfile.disliked_foods || '-'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Moon size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm font-bold">لم يقم العميل بإدخال عاداته اليومية حتى الآن.</p>
              </div>
            )}
          </div>

          {/* 📊 السجلات الطبية (InBody & Labs) - الـ Component القديم */}
          <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
             <DoctorMedicalView targetUserId={client?.id ?? ''} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorClientDetails;