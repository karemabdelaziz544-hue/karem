import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, MapPin, Users, ArrowRight, Check, X, User, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import type { Event } from '../../types';
import ConfirmModal from '../../components/ConfirmModal'; // 👈 استيراد المودال

const formatEventDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const rawDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const timePart = dateStr.includes('T') ? dateStr.split('T')[1] : '';
    const cleanTime = timePart.split('+')[0].split('Z')[0];
    
    // Format Date: YYYY-MM-DD to DD/MM/YYYY
    const dateParts = rawDate.split('-');
    let formattedDate = rawDate;
    if (dateParts.length === 3) {
      formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    // Format Time: HH:MM to AM/PM Arabic
    const timeParts = cleanTime.split(':');
    let formattedTime = '';
    if (timeParts.length >= 2) {
      let hour = parseInt(timeParts[0], 10);
      const minute = timeParts[1];
      const ampm = hour >= 12 ? 'م' : 'ص';
      hour = hour % 12;
      hour = hour ? hour : 12;
      formattedTime = `${hour}:${minute} ${ampm}`;
    }
    
    return formattedTime ? `${formattedDate} - ${formattedTime}` : formattedDate;
  } catch (e) {
    return dateStr;
  }
};

const EventDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالة المودال (نحتاج تخزين الأكشن والـ ID معاً)
  const [confirmAction, setConfirmAction] = useState<{ bookingId: string, action: 'confirmed' | 'rejected', userId: string } | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase.from('events').select('*').eq('id', id!).single();
      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('event_bookings')
        .select('*, profiles(full_name, phone, email, avatar_url)')
        .eq('event_id', id!)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setAttendees(bookingsData || []);

    } catch (err) {
      toast.error("فشل تحميل البيانات");
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (pathOrUrl: string) => {
    if (!pathOrUrl) return;
    const loadingToast = toast.loading('جاري تحميل الإيصال...');
    try {
        if (pathOrUrl.startsWith('http')) {
            toast.dismiss(loadingToast);
            window.open(pathOrUrl, '_blank');
            return;
        }
        const { data, error } = await supabase.storage.from('receipts').createSignedUrl(pathOrUrl, 3600);
        if (error || !data) throw new Error("لا يمكن الوصول للملف المحمي");
        
        toast.dismiss(loadingToast);
        window.open(data.signedUrl, '_blank');
    } catch (err: any) {
        toast.error(err.message, { id: loadingToast });
    }
  };

  // 👈 تنفيذ الأكشن بعد تأكيد المودال
  const executeAction = async () => {
    if (!confirmAction) return;
    const { bookingId, action, userId } = confirmAction;

    try {
        await supabase.from('event_bookings').update({ status: action }).eq('id', bookingId);
        
        await supabase.from('notifications').insert([{
            user_id: userId,
            is_admin_notification: false,
            type: 'system',
            title: action === 'confirmed' ? 'تم تأكيد حجزك ✅' : 'نعتذر، تم رفض الحجز ❌',
            message: `تحديث بخصوص حجزك في فعالية: ${event?.title ?? ''}`,
            link: '/'
        }]);

        toast.success("تم تحديث الحالة");
        fetchData();
    } catch (err) {
        toast.error("حدث خطأ");
    }
  };

  const toggleAttendance = async (bookingId: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from('event_bookings')
        .update({ attended })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success(attended ? "تم تسجيل حضور العميل ✅" : "تم إلغاء تسجيل الحضور");
      setAttendees(prev => prev.map(a => a.id === bookingId ? { ...a, attended } : a));
    } catch (err: any) {
      toast.error("فشل تحديث حالة الحضور: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
  if (!event) return <div className="p-10 text-center">لم يتم العثور على الفعالية</div>;

  const confirmedCount = attendees.filter(a => a.status === 'confirmed').length;
  const capacityPercentage = Math.min(100, (confirmedCount / (event.max_capacity || 50)) * 100);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      <button onClick={() => navigate('/admin/events')} className="flex items-center gap-2 text-gray-500 hover:text-forest mb-6 font-bold">
        <ArrowRight size={20} /> العودة للفعاليات
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 h-48 md:h-auto bg-gray-100 rounded-2xl overflow-hidden relative">
            <img src={event.image_url || 'https://placehold.co/600x400'} loading="lazy" alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-forest text-white px-3 py-1 rounded-lg text-xs font-bold">
                {(event.price ?? 0) > 0 ? `${event.price} ج.م` : 'مجاني'}
            </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-extrabold text-forest mb-2">{event.title}</h1>
            <div className="flex gap-4 text-gray-500 text-sm mb-6 font-bold">
                <span className="flex items-center gap-1"><Calendar size={16}/> {formatEventDateTime(event.event_date)}</span>
                <span className="flex items-center gap-1"><MapPin size={16}/> {event.location || 'أونلاين'}</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-forest flex items-center gap-2"><Users size={16}/> عدد الحضور المؤكد</span>
                    <span className={confirmedCount >= (event.max_capacity ?? 50) ? "text-red-500" : "text-gray-500"}>
                        {confirmedCount} / {event.max_capacity}
                    </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${confirmedCount >= (event.max_capacity ?? 50) ? 'bg-red-500' : 'bg-orange'}`} 
                        style={{ width: `${capacityPercentage}%` }} 
                    />
                </div>
                {confirmedCount >= (event.max_capacity ?? 50) && <p className="text-red-500 text-xs font-bold mt-2">⛔ العدد مكتمل</p>}
            </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-forest mb-6 flex items-center gap-2">
         <Users className="text-orange" /> كشف الحضور والحجوزات ({attendees.length})
      </h2>

      {attendees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed text-gray-400">لا توجد حجوزات بعد</div>
      ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">رقم التذكرة</th>
                            <th className="px-6 py-4">العميل</th>
                            <th className="px-6 py-4">رقم الهاتف</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4">إثبات الدفع</th>
                            <th className="px-6 py-4 text-center">حضور الفعالية</th>
                            <th className="px-6 py-4">ساعة الحضور / الحجز</th>
                            <th className="px-6 py-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {attendees.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <button 
                                      onClick={() => setSelectedTicket(booking)}
                                      className="font-mono text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded border border-slate-200 transition-colors font-bold flex items-center gap-1"
                                      title="اضغط لعرض التذكرة"
                                    >
                                        <Check className="text-orange" size={12}/>
                                        {booking.id.substring(0, 8).toUpperCase()}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={booking.profiles?.avatar_url} name={booking.profiles?.full_name} size="sm" />
                                        <span className="font-bold text-gray-700">{booking.profiles?.full_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-500">{booking.profiles?.phone}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {booking.payment_proof ? (
                                        <button 
                                          onClick={() => handleViewReceipt(booking.payment_proof)} 
                                          className="text-blue-600 hover:underline text-xs flex items-center gap-1 font-bold bg-transparent border-0 cursor-pointer p-0"
                                        >
                                            <ExternalLink size={12}/> عرض الإيصال
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <input 
                                        type="checkbox"
                                        checked={booking.attended || false}
                                        onChange={(e) => toggleAttendance(booking.id, e.target.checked)}
                                        className="rounded border-gray-300 text-forest focus:ring-forest cursor-pointer w-4 h-4"
                                    />
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                    {booking.created_at ? new Date(booking.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(booking.created_at).toLocaleDateString('ar-EG') : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {booking.status === 'pending' && (
                                        <div className="flex gap-2">
                                            {/* 👈 التعديل هنا: فتح المودال */}
                                            <button onClick={() => setConfirmAction({ bookingId: booking.id, action: 'confirmed', userId: booking.user_id })} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="قبول"><Check size={16}/></button>
                                            <button onClick={() => setConfirmAction({ bookingId: booking.id, action: 'rejected', userId: booking.user_id })} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="رفض"><X size={16}/></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {/* 👈 المودال */}
      <ConfirmModal 
         isOpen={!!confirmAction}
         title={confirmAction?.action === 'confirmed' ? 'تأكيد الحجز' : 'رفض الحجز'}
         message={confirmAction?.action === 'confirmed' ? 'هل أنت متأكد من تأكيد هذا الحجز للعميل؟' : 'هل أنت متأكد من رفض الحجز وإلغائه؟'}
         onCancel={() => setConfirmAction(null)}
         onConfirm={executeAction}
      />

      {/* Selected Ticket Preview Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95 border border-gray-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedTicket(null)} 
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-gray-500 hover:text-red-500 z-50 transition-colors shadow-sm"
            >
              <X size={18}/>
            </button>

            {/* Event Cover Image */}
            <div className="h-32 bg-gray-100 relative">
              <img 
                src={event.image_url || 'https://placehold.co/600x400'} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 right-4 text-white">
                <span className="bg-orange text-white px-2 py-0.5 rounded text-[10px] font-bold block w-fit mb-1">
                  {event.category || 'ورشة عمل'}
                </span>
                <h3 className="font-extrabold text-sm line-clamp-1">{event.title}</h3>
              </div>
            </div>

            {/* Ticket Cutouts */}
            <div className="flex justify-between items-center h-6 -mt-3 relative z-10">
              <div className="w-6 h-6 rounded-full bg-slate-800 -ml-3 border-r border-gray-200" />
              <div className="w-6 h-6 rounded-full bg-slate-800 -mr-3 border-l border-gray-200" />
            </div>

            {/* Ticket Details */}
            <div className="p-6 text-center">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 mb-4 text-right">
                <div>
                  <span className="block text-[10px] text-gray-400">الاسم</span>
                  <span className="text-gray-800">{selectedTicket.profiles?.full_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">التاريخ والوقت</span>
                  <span className="text-gray-800">{formatEventDateTime(event.event_date)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">الموقع</span>
                  <span className="text-gray-800">{event.location || 'أونلاين'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">حالة التذكرة</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    selectedTicket.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedTicket.status === 'confirmed' ? 'مؤكدة' : 'تحت المراجعة'}
                  </span>
                </div>
              </div>

              {/* Dashed line */}
              <div className="border-t border-dashed border-gray-300 my-4" />

              {/* QR Code */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-gray-700 mb-2">رمز الدخول السريع</p>
                <div className="p-2 border border-gray-200 rounded-xl bg-white">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedTicket.id}&color=004532&bgcolor=ffffff`} 
                    alt="Quick Entry QR" 
                    className="w-36 h-36"
                  />
                </div>
                <p className="text-[10px] font-mono text-gray-400 mt-2">
                  رقم التذكرة: {selectedTicket.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage;