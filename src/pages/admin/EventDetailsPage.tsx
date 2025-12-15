import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, MapPin, Users, ArrowRight, Check, X, User, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar'; // تأكد من المسار

const EventDetailsPage: React.FC = () => {
  const { id } = useParams(); // نجيب آيدي الايفينت من الرابط
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // 1. جلب تفاصيل الايفينت
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (eventError) throw eventError;
      setEvent(eventData);

      // 2. جلب قائمة الحضور لهذا الايفينت فقط
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('event_bookings')
        .select('*, profiles(full_name, phone, email, avatar_url)')
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setAttendees(bookingsData || []);

    } catch (err: any) {
      toast.error("فشل تحميل البيانات");
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId: string, action: 'confirmed' | 'rejected', userId: string) => {
    if (!window.confirm(action === 'confirmed' ? "تأكيد الحجز؟" : "رفض الحجز؟")) return;

    try {
        await supabase.from('event_bookings').update({ status: action }).eq('id', bookingId);
        
        // إشعار للعميل
        await supabase.from('notifications').insert([{
            user_id: userId,
            is_admin_notification: false,
            type: 'system',
            title: action === 'confirmed' ? 'تم تأكيد حجزك ✅' : 'نعتذر، تم رفض الحجز ❌',
            message: `تحديث بخصوص حجزك في فعالية: ${event.title}`,
            link: '/'
        }]);

        toast.success("تم تحديث الحالة");
        fetchData(); // تحديث القائمة
    } catch (err) {
        toast.error("حدث خطأ");
    }
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
  if (!event) return <div className="p-10 text-center">لم يتم العثور على الفعالية</div>;

  // حساب الإحصائيات
  const confirmedCount = attendees.filter(a => a.status === 'confirmed').length;
  const capacityPercentage = Math.min(100, (confirmedCount / (event.max_capacity || 50)) * 100);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      {/* زر الرجوع */}
      <button onClick={() => navigate('/admin/events')} className="flex items-center gap-2 text-gray-500 hover:text-forest mb-6 font-bold">
        <ArrowRight size={20} /> العودة للفعاليات
      </button>

      {/* كارت تفاصيل الايفينت */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 h-48 md:h-auto bg-gray-100 rounded-2xl overflow-hidden relative">
            <img src={event.image_url || 'https://placehold.co/600x400'} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-forest text-white px-3 py-1 rounded-lg text-xs font-bold">
                {event.price > 0 ? `${event.price} ج.م` : 'مجاني'}
            </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-extrabold text-forest mb-2">{event.title}</h1>
            <div className="flex gap-4 text-gray-500 text-sm mb-6 font-bold">
                <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(event.event_date).toLocaleDateString('ar-EG')}</span>
                <span className="flex items-center gap-1"><MapPin size={16}/> {event.location || 'أونلاين'}</span>
            </div>

            {/* شريط التقدم */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-forest flex items-center gap-2"><Users size={16}/> عدد الحضور المؤكد</span>
                    <span className={confirmedCount >= event.max_capacity ? "text-red-500" : "text-gray-500"}>
                        {confirmedCount} / {event.max_capacity}
                    </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${confirmedCount >= event.max_capacity ? 'bg-red-500' : 'bg-orange'}`} 
                        style={{ width: `${capacityPercentage}%` }} 
                    />
                </div>
                {confirmedCount >= event.max_capacity && <p className="text-red-500 text-xs font-bold mt-2">⛔ العدد مكتمل</p>}
            </div>
        </div>
      </div>

      {/* جدول الحضور */}
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
                            <th className="px-6 py-4">العميل</th>
                            <th className="px-6 py-4">رقم الهاتف</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4">إثبات الدفع</th>
                            <th className="px-6 py-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {attendees.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
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
                                        <a href={booking.payment_proof} target="_blank" className="text-blue-600 hover:underline text-xs flex items-center gap-1 font-bold">
                                            <ExternalLink size={12}/> عرض الإيصال
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {booking.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(booking.id, 'confirmed', booking.user_id)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="قبول"><Check size={16}/></button>
                                            <button onClick={() => handleAction(booking.id, 'rejected', booking.user_id)} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="رفض"><X size={16}/></button>
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
    </div>
  );
};

export default EventDetailsPage;