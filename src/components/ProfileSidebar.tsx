import React, { useEffect, useState } from 'react';
import { X, ExternalLink, HeartPulse, Activity, AlertTriangle, Coffee, Moon, Droplet, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import type { HealthProfile, LifestyleProfile } from '../types';

interface ProfileSidebarProps {
  userId: string;
  userName: string;
  userAvatar: string | null;
  onClose: () => void;
  detailsLink: string; // e.g. /admin/clients/:id or /doctor-dashboard/client/:id
}

const InfoItem = ({ label, value, icon }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
      {icon && <span className="mt-0.5 text-slate-400">{icon}</span>}
      <div className="flex-1 text-right">
        <span className="text-[10px] font-bold text-slate-400 block">{label}</span>
        <span className="text-xs font-black text-slate-700">{String(value)}</span>
      </div>
    </div>
  );
};

const ArrayDisplay = ({ items }: { items: string[] | null | undefined }) => {
  if (!items || items.length === 0) return <span className="text-xs text-slate-400">لا يوجد</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((item, i) => (
        <span key={i} className="text-[10px] px-2 py-1 bg-slate-100 rounded-lg font-bold text-slate-600">{item}</span>
      ))}
    </div>
  );
};

const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
    <span className="text-forest">{icon}</span>
    <h4 className="font-black text-sm text-slate-700">{title}</h4>
  </div>
);

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ userId, userName, userAvatar, onClose, detailsLink }) => {
  const [health, setHealth] = useState<HealthProfile | null>(null);
  const [lifestyle, setLifestyle] = useState<LifestyleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const [healthRes, lifestyleRes] = await Promise.all([
        supabase.from('health_profile').select('*').eq('user_id', userId).single(),
        supabase.from('lifestyle_profile').select('*').eq('user_id', userId).single(),
      ]);
      setHealth(healthRes.data as HealthProfile | null);
      setLifestyle(lifestyleRes.data as LifestyleProfile | null);
      setLoading(false);
    };
    fetchProfiles();
  }, [userId]);

  return (
    <div className="w-80 bg-white border-r border-gray-100 absolute md:relative z-30 h-full flex flex-col shadow-xl md:shadow-none text-right animate-in slide-in-from-left duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-forest">بيانات العميل</h3>
        <button onClick={onClose} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg"><X size={20} /></button>
      </div>

      {/* Avatar */}
      <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gray-50/50">
        <Avatar src={userAvatar} name={userName} size="lg" />
        <h2 className="text-lg font-black text-forest mt-3">{userName}</h2>
      </div>

      {/* Scrollable Content */}
      <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-forest" /></div>
        ) : (
          <>
            {/* ── Health Profile ── */}
            {health ? (
              <>
                <SectionHeader title="الملف الطبي" icon={<HeartPulse size={16} />} />
                <InfoItem label="الأمراض" value={health.diseases?.join('، ') || 'لا يوجد'} icon={<AlertTriangle size={12} />} />
                <InfoItem label="الحساسيات" value={health.has_allergies ? health.allergies_details || 'نعم' : 'لا يوجد'} />
                <InfoItem label="نوع الحمية" value={health.diet_type} />
                <InfoItem label="الأدوية" value={health.medications || 'لا يوجد'} />
                <InfoItem label="العمليات الجراحية" value={health.surgeries || 'لا يوجد'} />
                <InfoItem label="الإصابات" value={health.injuries || 'لا يوجد'} />
                <InfoItem label="مشاكل الهضم" value={health.digestive_issues?.join('، ') || 'لا يوجد'} />
                <InfoItem label="الحالة الهرمونية" value={health.hormonal_status || 'لا يوجد'} />
                <div className="mt-1">
                  <span className="text-[10px] font-bold text-slate-400">التاريخ العائلي</span>
                  <ArrayDisplay items={health.family_history} />
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs">
                <HeartPulse size={20} className="mx-auto mb-2 opacity-30" />
                لم يكمل العميل الملف الطبي بعد
              </div>
            )}

            {/* ── Lifestyle Profile ── */}
            {lifestyle ? (
              <>
                <SectionHeader title="نمط الحياة" icon={<Activity size={16} />} />
                <InfoItem label="الهدف" value={lifestyle.goal} icon={<CheckCircle2 size={12} />} />
                <InfoItem label="مستوى النشاط" value={lifestyle.activity_level} icon={<Activity size={12} />} />
                <InfoItem label="ساعات النوم" value={lifestyle.sleep_hours ? `${lifestyle.sleep_hours} ساعة` : null} icon={<Moon size={12} />} />
                <InfoItem label="جودة النوم" value={lifestyle.sleep_quality} />
                <InfoItem label="المياه يومياً" value={lifestyle.water_liters ? `${lifestyle.water_liters} لتر` : null} icon={<Droplet size={12} />} />
                <InfoItem label="عدد الوجبات" value={lifestyle.meals_per_day} />
                <InfoItem label="طبيعة العمل" value={lifestyle.work_nature || 'غير محدد'} />
                <InfoItem label="الأكل العاطفي" value={lifestyle.emotional_eating ? 'نعم' : 'لا'} />
                <InfoItem label="تاريخ الحمية" value={lifestyle.diet_history || 'لا يوجد'} />
                <InfoItem label="المكملات" value={lifestyle.supplements || 'لا يوجد'} />
                <InfoItem label="الكافيين" value={lifestyle.caffeine_intake || 'غير محدد'} icon={<Coffee size={12} />} />
                <InfoItem label="مستوى الشهية" value={lifestyle.appetite_level || 'غير محدد'} />
                <InfoItem label="ثبات الوزن" value={lifestyle.weight_plateau ? 'نعم' : 'لا'} />
                <InfoItem label="مدخن" value={lifestyle.smoker ? 'نعم' : 'لا'} />
                <InfoItem label="مستوى الإجهاد" value={lifestyle.stress_level} />
                <div className="mt-1">
                  <span className="text-[10px] font-bold text-slate-400">المشروبات</span>
                  <ArrayDisplay items={lifestyle.beverages} />
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs">
                <Activity size={20} className="mx-auto mb-2 opacity-30" />
                لم يكمل العميل بيانات نمط الحياة بعد
              </div>
            )}
          </>
        )}

        {/* Full Details Link */}
        <a
          href={detailsLink}
          className="mt-4 w-full py-3 bg-forest text-white rounded-xl font-bold text-sm hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-forest/20 block"
        >
          <ExternalLink size={18} /> عرض الملف الكامل للعميل
        </a>
      </div>
    </div>
  );
};

export default ProfileSidebar;
