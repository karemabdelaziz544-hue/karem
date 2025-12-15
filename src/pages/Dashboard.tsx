import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { supabase } from '../lib/supabase';
import { requestNotificationPermission } from '../lib/firebase';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import HabitTracker from '../components/dashboard/HabitTracker';
import { History, LogOut, Bell, Lock, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import SmartDashboard from '../components/dashboard/SmartDashboard'; // 👈 استيراد الداشبورد الذكية

const Dashboard: React.FC = () => {
  const { signOut } = useAuth();
  const { currentProfile } = useFamily();
  const navigate = useNavigate();
  const [notificationStatus, setNotificationStatus] = useState('default');
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isExpired = currentProfile?.subscription_status !== 'active' || 
                    (currentProfile?.subscription_end_date && new Date(currentProfile.subscription_end_date) < new Date());
  
  const isDependent = !!currentProfile?.manager_id;

  // 1. فحص هل يوجد طلب دفع معلق؟ (ذكاء النظام) 🧠
  useEffect(() => {
    const checkPendingPayments = async () => {
      if (!currentProfile || !isExpired) {
          setCheckingPayment(false);
          return;
      }

      const { data } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('user_id', currentProfile.id)
        .eq('status', 'pending')
        .limit(1);

      if (data && data.length > 0) {
        setHasPendingRequest(true);
      }
      setCheckingPayment(false);
    };

    checkPendingPayments();
  }, [currentProfile, isExpired]);

  // التحقق من اكتمال البيانات
  useEffect(() => {
    if (currentProfile) {
        const isProfileIncomplete = !currentProfile.birth_date || !currentProfile.height || !currentProfile.weight;
        if (isProfileIncomplete && isDependent) {
             toast('يرجى استكمال بياناتك الصحية للمتابعة', { icon: '📝' });
             navigate('/dashboard/settings');
        }
    }
  }, [currentProfile, navigate, isDependent]);

  // إعدادات الإشعارات
  useEffect(() => {
    const syncNotificationToken = async () => {
        if (!currentProfile) return;
        if ('Notification' in window) setNotificationStatus(Notification.permission);
        if (Notification.permission === 'granted' && !currentProfile.fcm_token) {
            const token = await requestNotificationPermission();
            if (token) await supabase.from('profiles').update({ fcm_token: token }).eq('id', currentProfile.id);
        }
    };
    syncNotificationToken();
  }, [currentProfile]);

  const enableNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token) {
        setNotificationStatus('granted');
        if (currentProfile && token !== currentProfile.fcm_token) {
            await supabase.from('profiles').update({ fcm_token: token }).eq('id', currentProfile.id);
            toast.success("تم التفعيل!");
        }
    }
  };

  if (!currentProfile || checkingPayment) return <div className="text-center py-20 font-bold text-gray-400">جاري تحميل بياناتك...</div>;

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8 font-sans" dir="rtl">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-3xl shadow-sm border border-sage/30">
        <div className="flex items-center gap-3">
           <Avatar src={currentProfile.avatar_url} name={currentProfile.full_name} size="md" />
           <div>
             <span className="font-bold text-forest block text-sm md:text-base">أهلاً، {currentProfile.full_name?.split(' ')[0]} 👋</span>
             
             {/* حالة الاشتراك الذكية */}
             {hasPendingRequest ? (
                <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit">
                    <Clock size={10}/> جاري المراجعة
                </span>
             ) : (
                <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded ${isExpired ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'} flex items-center gap-1 w-fit`}>
                    {isExpired ? <Lock size={10}/> : <CheckCircle size={10}/>}
                    {isExpired ? 'غير مشترك' : 'اشتراك نشط'}
                </span>
             )}
           </div>
        </div>
        <div className="flex gap-2">
            <Link to="/dashboard/history">
                <Button variant="ghost" className="!px-3 text-gray-500 hover:text-forest">
                    <History size={20} />
                    <span className="hidden md:inline">السجل السابق</span>
                </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="text-sm py-2 px-3 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200">
                <LogOut size={18} />
            </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {!isExpired && notificationStatus === 'default' && (
            <div className="mb-6 bg-forest/5 p-4 rounded-2xl border border-forest/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full shadow-sm text-forest"><Bell size={20} /></div>
                    <div><h4 className="font-bold text-forest text-sm">تفعيل التنبيهات</h4></div>
                </div>
                <button onClick={enableNotifications} className="bg-forest text-white px-4 py-2 rounded-xl text-xs font-bold">تفعيل</button>
            </div>
        )}

        {!isExpired && <HabitTracker userId={currentProfile.id} />}

        {/* عرض المحتوى حسب الحالة */}
        {isExpired ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-lg border-2 border-orange/10 animate-in zoom-in-95 duration-300">
                
                {/* 1. حالة وجود طلب معلق (System Intelligence) */}
                {hasPendingRequest ? (
                    <>
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600 animate-pulse">
                           <Clock size={40} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">طلبك قيد المراجعة ⏳</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            شكراً لإرسال إيصال الدفع. يقوم فريقنا بمراجعة طلبك حالياً وسيتم تفعيل اشتراكك فور التأكد من صحة البيانات.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-400">
                            عادة ما تستغرق المراجعة بضع ساعات. ستصلك رسالة فور التفعيل.
                        </div>
                    </>
                ) : (
                
                /* 2. حالة منتهي عادي */
                <>
                    <div className="w-20 h-20 bg-orange/5 rounded-full flex items-center justify-center mx-auto mb-6">
                       {isDependent ? <Lock size={32} className="text-orange"/> : <span className="text-4xl">🚀</span>}
                    </div>
                    
                    {isDependent ? (
                        <>
                            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">في انتظار التفعيل ⏳</h2>
                            <p className="text-gray-500 mb-8">يرجى من مسؤول العائلة تجديد الاشتراك لتفعيل حسابك.</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">أهلاً بك في هيليكس! 👋</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">ابدأ رحلتك الصحية الآن باختيار باقة تناسبك.</p>
                            <Button className="w-full md:w-auto px-10 py-4 text-lg justify-center shadow-xl shadow-orange/20 animate-pulse" onClick={() => navigate('/dashboard/subscriptions')}>
                                اشترك الآن
                            </Button>
                        </>
                    )}
                </>
                )}
            </div>
        ) : (
            // 👇 هنا التغيير الجوهري: عرض الداشبورد الذكية
            <SmartDashboard />
        )}
      </div>
    </div>
  );
};

export default Dashboard;