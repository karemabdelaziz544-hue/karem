import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  CreditCard, History, CheckCircle, AlertTriangle, ArrowRight,
  RefreshCw, Settings, Clock, Loader2, Users, Crown,
  Calendar, ShieldCheck, Sparkles, TrendingUp, Heart, Award, X
} from 'lucide-react';
import ModifySubscriptionModal from '../components/dashboard/ModifySubscriptionModal';
import QuickRenewModal from '../components/dashboard/QuickRenewModal';
import SubscribeFirstTime from '../components/dashboard/SubscribeFirstTime';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Database } from '../types/supabase';

type PaymentRequest = Database['public']['Tables']['payment_requests']['Row'];

/* ─────────────────────────────────────────────
    Trust Badge Component
───────────────────────────────────────────── */
const TrustBadge: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold">
    <span className="text-forest">{icon}</span>
    {label}
  </div>
);

/* ─────────────────────────────────────────────
    Stat Pill Component
───────────────────────────────────────────── */
const StatPill: React.FC<{ label: string; value: string; icon: React.ReactNode; accent?: string }> = ({
  label, value, icon, accent = 'text-forest bg-forest/8'
}) => (
  <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 min-w-[100px]">
    <span className={`text-[10px] font-bold mb-1 text-gray-400 tracking-wide uppercase`}>{label}</span>
    <div className={`flex items-center gap-1.5 font-black text-gray-800`}>
      <span className={`${accent} p-1 rounded-lg`}>{icon}</span>
      <span className="text-xl leading-none">{value}</span>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
    Action Card Component
───────────────────────────────────────────── */
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'featured';
  badge?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon, title, description, ctaLabel, onClick, disabled, variant = 'primary', badge
}) => {
  const isPrimary = variant === 'primary';
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-3xl p-7 transition-all duration-300 group
        ${disabled ? 'opacity-50 pointer-events-none grayscale-[0.4]' : 'cursor-pointer'}
        ${isPrimary
          ? 'bg-white border border-gray-100 hover:border-forest/40 hover:shadow-xl'
          : 'bg-gradient-to-br from-amber-50 to-white border-2 border-orange/20 hover:border-orange/60 hover:shadow-xl'
        }
      `}
    >
      {badge && (
        <div className="absolute -top-3 right-5">
          <span className="bg-gradient-to-r from-orange to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
            {badge}
          </span>
        </div>
      )}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isPrimary ? 'bg-forest/8 text-forest' : 'bg-orange/10 text-orange'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-gray-800 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">{description}</p>
      <div className={`inline-flex items-center gap-2 font-bold text-sm ${isPrimary ? 'text-forest' : 'text-orange'}`}>
        <span>{ctaLabel}</span>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${isPrimary ? 'bg-forest' : 'bg-orange'}`}>
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
};

const Subscriptions: React.FC = () => {
  const { currentProfile, loading: familyLoading } = useFamily();
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PaymentRequest | null>(null);
  const [subAccountsCount, setSubAccountsCount] = useState(0);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showQuickRenewModal, setShowQuickRenewModal] = useState(false);

  // 1. تحديث جلب البيانات ليكون أكثر دقة وشامل للسجل
  useEffect(() => {
    if (!currentProfile) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // جلب الطلبات المعلقة
        const { data: pending } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('user_id', currentProfile.id)
          .eq('status', 'pending')
          .maybeSingle();
        setPendingRequest(pending);
        
        // جلب السجل الكامل (مقبول أو مرفوض أو معلق)
        const { data: hist, count: historyCount } = await supabase
          .from('payment_requests')
          .select('*', { count: 'exact' })
          .eq('user_id', currentProfile.id)
          .order('created_at', { ascending: false });

        setHistory(hist || []);
        setHasHistory(historyCount ? historyCount > 0 : false);
        
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('manager_id', currentProfile.id);
        setSubAccountsCount(count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, currentProfile]);

  if (authLoading || familyLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-forest" size={36} />
          <p className="text-sm text-gray-400 font-medium">جاري تحديث بيانات اشتراكك...</p>
        </div>
      </div>
    );
  }

  const isSubAccount = currentProfile?.manager_id || profile?.manager_id;
  const isExpired = currentProfile?.subscription_status === 'expired';

  if (isSubAccount && isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-xl shadow-red-100/50 border border-red-50 text-center relative overflow-hidden animate-in fade-in zoom-in-95">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">تنبيه بخصوص اشتراكك ⚠️</h2>
            <div className="space-y-4 mb-10 text-right">
              <p className="text-gray-500 leading-relaxed font-medium">
                نحيطك علماً بأنه <span className="text-red-600 font-bold">تم استثناء هذا الحساب</span> من الاشتراك العائلي الجديد، أو أن الباقة قد انتهت صلاحيتها حالياً.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">ماذا تفعل الآن؟</p>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">• تواصل مع مدير الحساب الأساسي</li>
                  <li className="flex items-center gap-2">• أو تحدث مع خدمة عملائنا للمساعدة</li>
                </ul>
              </div>
            </div>
            <button onClick={() => navigate('/dashboard/support')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all">
              تحدث مع خدمة العملاء
              <ArrowRight size={18} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !hasHistory && !pendingRequest && !isSubAccount) {
    return <SubscribeFirstTime />;
  }

  const isActive = currentProfile?.subscription_status === 'active' && currentProfile.subscription_end_date && new Date(currentProfile.subscription_end_date) > new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16 px-1" dir="rtl">
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } } .fade-up { animation: fadeUp 0.45s ease both; }`}</style>
      
      <div className="fade-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-right">إدارة الاشتراك</h1>
          <p className="text-sm text-gray-400 mt-0.5 text-right">تحكم في باقة عائلة هيليكس</p>
        </div>
        <div className="bg-gray-100 rounded-2xl p-1 flex">
          <button onClick={() => setActiveTab('current')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'current' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>باقتي</button>
          <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>السجل المالي</button>
        </div>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-6">
          <div className={`fade-up relative rounded-[2.5rem] overflow-hidden ${isActive ? 'bg-slate-900 text-white shadow-xl' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-right">
              <div className="flex items-start gap-5">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 ${isActive ? 'bg-forest/20 text-green-400' : 'bg-gray-200 text-gray-400'}`}><Crown size={32} /></div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">هيليكس المتكاملة</h2>
                  <p className={`text-sm font-bold ${isActive ? 'text-green-400' : 'text-red-400'}`}>{isActive ? 'الاشتراك ساري' : 'الاشتراك منتهي'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <StatPill label="فرعي" value={String(subAccountsCount)} icon={<Users size={14}/>} />
                <StatPill label="الإجمالي" value={String(1 + subAccountsCount)} icon={<Heart size={14}/>} accent="text-orange bg-orange/10" />
              </div>
            </div>
          </div>

          <div className="fade-up flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-right">
            <TrustBadge icon={<ShieldCheck size={14} />} label="أنظمة غذائية مخصصة" />
            <TrustBadge icon={<TrendingUp size={14} />} label="نتائج مضمونة" />
            <TrustBadge icon={<Sparkles size={14} />} label="سهولة إدارة عائلتك" />
          </div>

          {pendingRequest ? (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center text-amber-700 font-bold">
              <Clock size={40} className="mx-auto mb-3 animate-pulse" />
              <p>طلبك قيد المراجعة حالياً.. سيتم تفعيل الباقة فور التأكد من التحويل.</p>
            </div>
          ) : (
            <div className={`grid md:grid-cols-2 gap-5 ${isActive ? 'opacity-30 pointer-events-none' : ''}`}>
              <ActionCard icon={<RefreshCw size={26} />} title="تجديد الاشتراك" description="الاستمرار بنفس عدد أفراد العائلة الحالي." ctaLabel="تجديد سريع" onClick={() => setShowQuickRenewModal(true)} />
              <ActionCard icon={<Settings size={26} />} title="تعديل العائلة" description="إضافة أفراد جدد أو تقليل العدد." ctaLabel="تعديل العائلة" onClick={() => setShowModifyModal(true)} variant="featured" badge="إدارة" />
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────
            2. واجهة السجل المالي المحدثة
        ───────────────────────────────────────────── */
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {history.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed p-20 text-center">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <History size={32} />
              </div>
              <p className="text-gray-400 font-bold">لا توجد معاملات مالية مسجلة حتى الآن</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center justify-between group hover:border-forest/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    item.status === 'approved' ? 'bg-green-50 text-green-600' : 
                    item.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.status === 'approved' ? <CheckCircle size={24} /> : 
                     item.status === 'rejected' ? <X size={24} /> : <Clock size={24} />}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800 leading-tight">
                      {item.plan_type === 'helix_integrated' ? 'باقة هيليكس المتكاملة' : 'تجديد اشتراك'}
                    </p>
                    <p className="text-[11px] text-gray-400 font-bold mt-1">
                      {item.created_at ? format(new Date(item.created_at), 'PPP', { locale: ar }) : ''}
                    </p>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end gap-1">
                  <p className="text-lg font-black text-slate-900 leading-none">{item.amount} EGP</p>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                    item.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'approved' ? 'مقبول' : item.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showQuickRenewModal && <QuickRenewModal onClose={() => setShowQuickRenewModal(false)} />}
      {showModifyModal && <ModifySubscriptionModal onClose={() => setShowModifyModal(false)} />}
    </div>
  );
};

export default Subscriptions;