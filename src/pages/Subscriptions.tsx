import React, { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { supabase } from '../lib/supabase';
import { CreditCard, History, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Settings, Clock, Loader2, Users, Star, Zap, Crown, Calendar, ShieldCheck } from 'lucide-react';
import ModifySubscriptionModal from '../components/dashboard/ModifySubscriptionModal';
import QuickRenewModal from '../components/dashboard/QuickRenewModal';
import SubscribeFirstTime from '../components/dashboard/SubscribeFirstTime';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Subscriptions: React.FC = () => {
  const { currentProfile } = useFamily(); 
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<any[]>([]);
  const [lastPlanDetails, setLastPlanDetails] = useState<any>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showQuickRenewModal, setShowQuickRenewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [hasHistory, setHasHistory] = useState(false); 
  const [pendingRequest, setPendingRequest] = useState<any | null>(null);

  // المتغير لتخزين العدد
  const [subAccountsCount, setSubAccountsCount] = useState(0);

  useEffect(() => {
    if (!currentProfile) return;

    const fetchData = async () => {
      setLoading(true);
      
      // جلب الطلبات المعلقة
      const { data: pending } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', currentProfile.id)
        .eq('status', 'pending')
        .maybeSingle();

      setPendingRequest(pending);

      // فحص السجل السابق
      const { count: historyCount } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentProfile.id);
      
      setHasHistory(historyCount ? historyCount > 0 : false);

      // جلب تفاصيل الباقة
      const { data: lastApproved } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', currentProfile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setLastPlanDetails(lastApproved);

      // جلب السجل المالي
      if (activeTab === 'history') {
        const { data: hist } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('user_id', currentProfile.id)
          .neq('status', 'pending')
          .order('created_at', { ascending: false });
        setHistory(hist || []);
      }

      // 2. 🔥 جلب العدد الحقيقي للحسابات الفرعية (تم التعديل هنا) 🔥
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }) 
          .eq('manager_id', currentProfile.id); // ✅ التعديل: manager_id بدلاً من parent_id

        if (!error && count !== null) {
          setSubAccountsCount(count);
        }
      } catch (err) {
        console.error("Error fetching sub-accounts:", err);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [activeTab, currentProfile]);

  const isActive = currentProfile?.subscription_status === 'active' && 
                   currentProfile.subscription_end_date && 
                   new Date(currentProfile.subscription_end_date) > new Date();

  const planType = lastPlanDetails?.plan_type === 'pro' ? 'Pro' : 'Standard';

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-forest"/></div>;

  if (!hasHistory && !pendingRequest) {
      return <SubscribeFirstTime />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
      
      {/* Header Tabs */}
      <div className="bg-white rounded-3xl p-1.5 shadow-sm border border-gray-100 flex w-full md:w-fit mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('current')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'current' ? 'bg-forest text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <CreditCard size={18}/> اشتراكي
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-forest text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <History size={18}/> السجل المالي
        </button>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-6">
           
           <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative group">
               <div className={`h-2 w-full ${isActive ? 'bg-gradient-to-r from-green-400 to-forest' : 'bg-gray-200'}`} />
               
               <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   
                   <div>
                       <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-2xl font-black text-gray-800">باقة هيليكس العائلية</h2>
                           <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 ${planType === 'Pro' ? 'bg-orange/10 text-orange border border-orange/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                               {planType === 'Pro' ? <Zap size={12}/> : <Star size={12}/>}
                               {planType}
                           </span>
                       </div>
                       
                       <div className="flex flex-wrap gap-3">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                               {isActive ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                               {isActive ? 'نشط وساري' : 'منتهي الصلاحية'}
                           </span>
                           
                           <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 flex items-center gap-1.5">
                               <Calendar size={14}/>
                               ينتهي: {currentProfile?.subscription_end_date ? format(new Date(currentProfile.subscription_end_date), 'dd MMMM yyyy', { locale: ar }) : '--'}
                           </span>
                       </div>
                   </div>

                   {/* تفاصيل الحسابات */}
                   <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 w-full md:w-auto">
                       <div className="flex flex-col items-center px-4 border-l border-gray-200">
                           <span className="text-xs text-gray-400 font-bold mb-1">حساب أساسي</span>
                           <div className="flex items-center gap-1 font-black text-gray-700">
                               <Crown size={18} className="text-orange mb-1"/>
                               <span className="text-xl">1</span>
                           </div>
                       </div>
                       <div className="flex flex-col items-center px-4">
                           <span className="text-xs text-gray-400 font-bold mb-1">حسابات فرعية</span>
                           <div className="flex items-center gap-1 font-black text-gray-700">
                               <Users size={18} className="text-blue-500 mb-1"/>
                               <span className="text-xl">{subAccountsCount}</span>
                           </div>
                       </div>
                   </div>

               </div>
           </div>

           {pendingRequest ? (
               <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8 text-center animate-pulse">
                   <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Clock size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-gray-800 mb-2">طلبك قيد المراجعة</h3>
                   <p className="text-gray-600 max-w-md mx-auto mb-4">
                       لقد قمت بإرسال طلب تجديد بقيمة <strong>{pendingRequest.amount} EGP</strong>.
                       <br/>سيتم تحديث حالة اشتراكك فور مراجعة الإدارة.
                   </p>
               </div>
           ) : (
               <div className="relative">
                 {isActive && (
                     <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-3xl border-2 border-green-100/50 animate-in fade-in">
                         <div className="bg-white p-4 rounded-full mb-3 text-green-500 shadow-lg shadow-green-100 animate-bounce">
                             <ShieldCheck size={40} />
                         </div>
                         <h3 className="text-2xl font-black text-gray-800 mb-2">أمورك طيبة! 🌟</h3>
                         <p className="text-gray-500 font-medium text-center max-w-xs">
                             اشتراكك فعال حالياً. ستظهر خيارات التجديد والتعديل تلقائياً عند اقتراب موعد الانتهاء.
                         </p>
                     </div>
                 )}

                 <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isActive ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
                     
                     <div 
                       className="bg-white border border-gray-100 rounded-3xl p-6 hover:border-forest/50 hover:shadow-lg hover:shadow-forest/5 transition-all cursor-pointer group" 
                       onClick={() => !isActive && setShowQuickRenewModal(true)}
                     >
                         <div className="bg-forest/5 w-14 h-14 rounded-2xl flex items-center justify-center text-forest mb-4 group-hover:bg-forest group-hover:text-white transition-colors">
                             <RefreshCw size={28} />
                         </div>
                         <h3 className="text-xl font-bold text-gray-800 mb-2">تجديد نفس الباقة</h3>
                         <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            ادفع وجدد فوراً بنفس عدد الأفراد الحاليين ({1 + subAccountsCount} أفراد) ونفس المميزات.
                         </p>
                         <div className="flex items-center text-forest font-bold text-sm gap-2 group-hover:gap-4 transition-all">
                             <span>تجديد سريع</span> <ArrowRight size={16}/>
                         </div>
                     </div>

                     <div 
                       className="bg-gradient-to-br from-white to-orange/5 border border-gray-100 rounded-3xl p-6 hover:border-orange/50 hover:shadow-lg hover:shadow-orange/5 transition-all cursor-pointer group relative overflow-hidden" 
                       onClick={() => !isActive && setShowModifyModal(true)}
                     >
                         <div className="absolute top-0 right-0 bg-orange text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">تغيير الخطة</div>
                         <div className="bg-orange/10 w-14 h-14 rounded-2xl flex items-center justify-center text-orange mb-4 group-hover:bg-orange group-hover:text-white transition-colors">
                             <Settings size={28} />
                         </div>
                         <h3 className="text-xl font-bold text-gray-800 mb-2">تعديل / ترقية الباقة</h3>
                         <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                             هل تريد التحويل إلى Pro؟ أو تغيير عدد أفراد العائلة؟ اضغط هنا لتخصيص اشتراكك.
                         </p>
                         <div className="flex items-center text-orange font-bold text-sm gap-2 group-hover:gap-4 transition-all">
                             <span>تخصيص الاشتراك</span> <ArrowRight size={16}/>
                         </div>
                     </div>
                 </div>
               </div>
           )}

        </div>
      ) : (
        /* تبويب السجل المالي */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           {history.length === 0 ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                  <History size={48} className="mb-4 opacity-20"/>
                  <p>لا يوجد سجل مدفوعات سابق</p>
              </div>
           ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-5">التاريخ</th>
                      <th className="p-5">المبلغ</th>
                      <th className="p-5">نوع العملية</th>
                      <th className="p-5">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((item) => (
                      <tr key={item.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 font-mono text-gray-600">{format(new Date(item.created_at), 'dd/MM/yyyy')}</td>
                        <td className="p-5 font-bold text-forest text-lg">{item.amount} <span className="text-xs font-normal text-gray-400">EGP</span></td>
                        <td className="p-5">
                           <span className={`text-xs px-2 py-1 rounded border ${item.plan_type === 'renewal' ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
                               {item.plan_type === 'renewal' ? 'تجديد سريع' : 
                                item.plan_type === 'new_subscription' ? 'اشتراك جديد' : 
                                `تعديل (${item.plan_type})`}
                           </span>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                            item.status === 'approved' ? 'bg-green-50 text-green-700' :
                            item.status === 'rejected' ? 'bg-red-50 text-red-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {item.status === 'approved' ? <CheckCircle size={12}/> : item.status === 'rejected' ? <AlertTriangle size={12}/> : <Clock size={12}/>}
                            {item.status === 'approved' ? 'تم القبول' : item.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           )}
        </div>
      )}

      {showQuickRenewModal && <QuickRenewModal onClose={() => setShowQuickRenewModal(false)} />}
      {showModifyModal && <ModifySubscriptionModal onClose={() => setShowModifyModal(false)} />}
    </div>
  );
};

export default Subscriptions;