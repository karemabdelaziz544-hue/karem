import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Clock, FileText, User, RefreshCw, AlertCircle, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

type PaymentRequest = {
  id: string;
  user_id: string;
  amount: number;
  plan_type: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt_url: string;
  renewal_metadata: any;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string;
    phone: string;
  };
};

const AdminPayments: React.FC = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // جلب الطلبات مع بيانات العميل
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

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    if (!window.confirm(newStatus === 'approved' ? 'هل أنت متأكد من قبول الدفع وتجديد الاشتراك؟' : 'هل أنت متأكد من رفض الطلب؟')) return;
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(newStatus === 'approved' ? "تم قبول الطلب وتجديد الاشتراك ✅" : "تم رفض الطلب ❌");
      fetchRequests(); // تحديث القائمة
    } catch (error: any) {
      toast.error("حدث خطأ: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // تصفية البيانات حسب التاب النشط
  const filteredRequests = requests.filter(r => 
    activeTab === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  );

  const translatePlanType = (type: string) => {
    if (type === 'standard') return 'تعديل (Standard)';
    if (type === 'pro') return 'تعديل (Pro)';
    if (type === 'renewal') return 'تجديد سريع';
    return type;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800">إدارة المدفوعات</h1>
        <button onClick={fetchRequests} className="p-2 hover:bg-gray-100 rounded-full"><RefreshCw size={20}/></button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-fit">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'pending' ? 'bg-orange text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Clock size={16}/> طلبات الانتظار 
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-white text-orange px-1.5 rounded-full text-xs">{requests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-forest text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FileText size={16}/> أرشيف العمليات
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
           <div className="p-10 text-center text-gray-400">جاري التحميل...</div>
        ) : filteredRequests.length === 0 ? (
           <div className="p-16 text-center text-gray-400 flex flex-col items-center">
              <FileText size={48} className="mb-4 opacity-20"/>
              <p>لا توجد طلبات في هذه القائمة</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">العميل</th>
                  <th className="p-4">تفاصيل الطلب</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">الإيصال</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* العميل */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={req.profiles?.avatar_url} name={req.profiles?.full_name} size="sm" />
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{req.profiles?.full_name || 'مجهول'}</div>
                          <div className="text-xs text-gray-400">{req.profiles?.phone || req.profiles?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* التفاصيل */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-gray-700">{translatePlanType(req.plan_type)}</span>
                        {req.renewal_metadata?.keep_member_ids && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded w-fit">
                             سيتم الإبقاء على {req.renewal_metadata.keep_member_ids.length} أفراد
                          </span>
                        )}
                      </div>
                    </td>

                    {/* المبلغ */}
                    <td className="p-4">
                      <span className="font-black text-forest text-lg">{req.amount}</span> <span className="text-xs text-gray-500">EGP</span>
                    </td>

                    {/* الإيصال */}
                    <td className="p-4">
                      <a 
                        href={req.receipt_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={14}/> عرض الإيصال
                      </a>
                    </td>

                    {/* التاريخ */}
                    <td className="p-4 text-xs text-gray-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar size={12}/>
                        {format(new Date(req.created_at), 'dd/MM/yyyy')}
                      </div>
                      <div className="mt-1 opacity-60">
                        {format(new Date(req.created_at), 'hh:mm a')}
                      </div>
                    </td>

                    {/* الإجراءات */}
                    <td className="p-4">
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(req.id, 'approved')}
                            disabled={!!processingId}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="قبول"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(req.id, 'rejected')}
                            disabled={!!processingId}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="رفض"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {req.status === 'approved' ? 'مقبول' : 'مرفوض'}
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