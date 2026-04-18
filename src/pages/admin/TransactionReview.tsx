import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Clock, FileText, RefreshCw, Eye, Calendar ,Users} from 'lucide-react';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

type PaymentRequest = {
  id: string;
  user_id: string;
  amount: number;
  plan_type: string;
  status: string | null;
  receipt_url: string | null;
  renewal_metadata: any;
  created_at: string | null;
  updated_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
};

const AdminPayments: React.FC = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*, profiles(full_name, email, avatar_url, phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

const handleStatusUpdate = async (request: PaymentRequest, newStatus: 'approved' | 'rejected') => {
  if (!window.confirm(newStatus === 'approved' ? 'تأكيد تفعيل الباقة؟' : 'رفض الطلب؟')) return;
  
  setProcessingId(request.id);
  try {
if (newStatus === 'approved') {
  const newExpiryDate = addDays(new Date(), 30).toISOString();
  
  // 1. استخراج الـ IDs والتأكد من أنها مصفوفة
  const keepIds = Array.isArray(request.renewal_metadata?.keep_member_ids) 
                  ? request.renewal_metadata.keep_member_ids 
                  : [];

  // 2. تحديث الحساب الرئيسي
  await supabase.from('profiles').update({ 
    subscription_status: 'active',
    subscription_end_date: newExpiryDate 
  }).eq('id', request.user_id);

  // 3. جلب "كل" الحسابات التابعة لهذا المدير أولاً لمعرفتها
  const { data: allSubAccounts } = await supabase
    .from('profiles')
    .select('id')
    .eq('manager_id', request.user_id);

  if (allSubAccounts && allSubAccounts.length > 0) {
    // 4. تنفيذ التحديث لكل حساب على حدة لضمان تخطي أي تعليق في الـ Cache
    for (const account of allSubAccounts) {
      const shouldBeActive = keepIds.includes(account.id);
      
      await supabase
        .from('profiles')
        .update({ 
          subscription_status: shouldBeActive ? 'active' : 'expired',
          subscription_end_date: shouldBeActive ? newExpiryDate : null
        })
        .eq('id', account.id);
    }
  }
}
    // 5. تحديث حالة الطلب
    const { error: requestErr } = await supabase
      .from('payment_requests')
      .update({ status: newStatus })
      .eq('id', request.id);

    if (requestErr) throw requestErr;

    toast.success("تمت العملية بنجاح وتحديث الحسابات");
    fetchRequests();
  } catch (error) {
    console.error("Critical Admin Error:", error);
    toast.error("حدث خطأ");
  } finally {
    setProcessingId(null);
  }
}; const filteredRequests = requests.filter(r => 
    activeTab === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800 text-right w-full">إدارة المدفوعات والاشتراكات</h1>
        <button onClick={fetchRequests} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-fit">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'pending' ? 'bg-orange text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Clock size={16}/> طلبات قيد الانتظار 
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-white text-orange px-1.5 rounded-full text-[10px] font-black">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FileText size={16}/> أرشيف العمليات
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && requests.length === 0 ? (
           <div className="p-20 text-center flex flex-col items-center gap-3">
             <RefreshCw className="animate-spin text-forest" size={32}/>
             <p className="text-gray-400 font-medium">جاري جلب البيانات من السيرفر...</p>
           </div>
        ) : filteredRequests.length === 0 ? (
           <div className="p-20 text-center text-gray-400 flex flex-col items-center">
              <FileText size={48} className="mb-4 opacity-10"/>
              <p className="font-bold">لا توجد طلبات لعرضها حالياً</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-4">العميل (المدير)</th>
                  <th className="p-4">الباقة المطلوبة</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">إيصال الدفع</th>
                  <th className="p-4">تاريخ الطلب</th>
                  <th className="p-4">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={req.profiles?.avatar_url ?? undefined} name={req.profiles?.full_name ?? undefined} size="sm" />
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{req.profiles?.full_name}</div>
                          <div className="text-[10px] text-gray-400">{req.profiles?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs bg-slate-100 px-2 py-1 rounded w-fit text-slate-600">
                          {req.plan_type === 'helix_integrated' ? 'هيليكس المتكاملة' : req.plan_type}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-forest font-bold">
                           <Users size={10}/> سعة العائلة: {req.renewal_metadata?.sub_count + 1} أفراد
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-slate-800">{req.amount}</span> <span className="text-[10px] text-gray-400">EGP</span>
                    </td>
                    <td className="p-4">
                      <a href={req.receipt_url ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                        <Eye size={14}/> عرض الإيصال
                      </a>
                    </td>
                    <td className="p-4 text-[10px] text-gray-500 font-bold">
                      <div className="flex items-center gap-1"><Calendar size={12}/> {req.created_at ? format(new Date(req.created_at), 'dd/MM/yyyy') : '-'}</div>
                    </td>
                    <td className="p-4">
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(req, 'approved')}
                            disabled={!!processingId}
                            className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-100 disabled:opacity-50"
                          >
                            <Check size={20} />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(req, 'rejected')}
                            disabled={!!processingId}
                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {req.status === 'approved' ? 'مقبول ومفعل' : 'مرفوض'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;