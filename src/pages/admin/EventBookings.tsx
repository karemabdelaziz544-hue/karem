import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Calendar, Users, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loader2 from '../../components/Preloader'; // أو أي لودر بسيط

const EventBookings: React.FC = () => {
  const navigate = useNavigate();
  const [eventsStats, setEventsStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventsWithStats();
  }, []);

  const fetchEventsWithStats = async () => {
    // 1. نجيب كل الايفينتات
    // 2. نجيب معاهم الحجوزات عشان نحسب عددهم والحالة
    const { data, error } = await supabase
      .from('events')
      .select('*, event_bookings(status)')
      .order('event_date', { ascending: false });

    if (!error && data) {
        // معالجة البيانات لحساب الإحصائيات
        const stats = data.map(event => {
            const bookings = event.event_bookings || [];
            return {
                ...event,
                total_bookings: bookings.length,
                pending_count: bookings.filter((b: any) => b.status === 'pending').length,
                confirmed_count: bookings.filter((b: any) => b.status === 'confirmed').length
            };
        });
        setEventsStats(stats);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center font-bold text-forest">جاري تحميل الفعاليات...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <h1 className="text-3xl font-extrabold text-forest mb-8 flex items-center gap-2">
          <Ticket className="text-orange" /> إدارة الحجوزات (حسب الفعالية)
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventsStats.map(event => (
            <div 
                key={event.id} 
                onClick={() => navigate(`/admin/events/${event.id}`)}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden flex flex-col"
            >
                {/* الجزء العلوي: الصورة والحالة */}
                <div className="h-40 bg-gray-100 relative">
                    <img 
                        src={event.image_url || 'https://placehold.co/600x400'} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                         {/* بادج التاريخ */}
                        <span className="bg-white/90 px-3 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                            {new Date(event.event_date).toLocaleDateString('ar-EG')}
                        </span>
                    </div>
                </div>

                {/* الجزء السفلي: التفاصيل والإحصائيات */}
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-forest text-lg mb-1 line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        <Calendar size={12}/> {new Date(event.event_date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                    </p>

                    {/* الإحصائيات (مربعات ملونة) */}
                    <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                        <div className="bg-green-50 p-2 rounded-xl border border-green-100 text-center">
                            <span className="block text-lg font-black text-green-700">{event.confirmed_count}</span>
                            <span className="text-[10px] text-green-600 font-bold flex items-center justify-center gap-1">
                                <CheckCircle size={10}/> مؤكد
                            </span>
                        </div>
                        <div className={`p-2 rounded-xl border text-center ${event.pending_count > 0 ? 'bg-orange/10 border-orange/20 animate-pulse' : 'bg-gray-50 border-gray-100'}`}>
                            <span className={`block text-lg font-black ${event.pending_count > 0 ? 'text-orange' : 'text-gray-400'}`}>
                                {event.pending_count}
                            </span>
                            <span className={`text-[10px] font-bold flex items-center justify-center gap-1 ${event.pending_count > 0 ? 'text-orange' : 'text-gray-400'}`}>
                                <AlertCircle size={10}/> قيد الانتظار
                            </span>
                        </div>
                    </div>

                    <button className="w-full py-2 bg-forest text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-forest/90 transition-colors">
                        إدارة الحجوزات <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        ))}

        {eventsStats.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                لا توجد فعاليات مسجلة حالياً.
            </div>
        )}
      </div>
    </div>
  );
};

export default EventBookings;