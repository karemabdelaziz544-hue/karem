import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ChevronRight, FileText, Activity, Image as ImageIcon, 
  Plus, Calendar, Mail, Phone, HeartPulse
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
  const [pastPlans, setPastPlans] = useState<Plan[]>([]); // سجل الأنظمة السابقة
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
          
          // 2. جلب الخطط السابقة لهذا العميل مرتبة من الأحدث للأقدم
          const { data: plans } = await supabase
            .from('plans')
            .select('*')
            .eq('user_id', id!)
            .order('created_at', { ascending: false });
          
          setPastPlans(plans || []);
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
          className="bg-orange text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-orange/20 hover:scale-105 transition-all"
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

          {/* سجل الأنظمة السابقة (التعديل الجديد) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-orange" /> سجل الأنظمة السابقة
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
                        تعديل
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

        {/* العمود الرئيسي (السجلات الطبية InBody & Lab) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
             <DoctorMedicalView targetUserId={client?.id ?? ''} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorClientDetails;