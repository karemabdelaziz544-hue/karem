import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import EventDetailsModal from './EventDetailsModal'; // 👈 استيراد النافذة الجديدة

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👇 حالة النافذة (الايفينت المختار)
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString()) 
        .order('event_date', { ascending: true })
        .limit(3);
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  if (loading) return (
    <div className="py-20 text-center">
        <Loader2 className="animate-spin mx-auto text-forest" />
    </div>
  );

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-orange font-bold text-sm tracking-wider uppercase mb-2 block">مجتمع هيليكس</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-forest mb-4">فعاليات ولقاءات قادمة</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">انضم إلينا في ورش العمل والندوات الصحية لتعزيز نمط حياتك.</p>
        </div>

        {/* Content */}
        {events.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد فعاليات قادمة حالياً</h3>
                <p className="text-gray-400">نعمل على تحضير مفاجآت جديدة.. تابعونا قريباً! 🚀</p>
            </div>
        ) : (
            <div className="grid md:grid-cols-3 gap-8">
            {events.map((event) => (
                <div 
                    key={event.id} 
                    className="group cursor-pointer"
                    onClick={() => setSelectedEvent(event)} // 👈 عند الضغط يفتح النافذة
                >
                    {/* صورة الفعالية */}
                    <div className="relative h-64 rounded-2xl overflow-hidden mb-6 shadow-lg bg-gray-100">
                        <div className="absolute inset-0 bg-forest/20 group-hover:bg-forest/0 transition-all duration-500 z-10" />
                        <img 
                            src={event.image_url || 'https://images.unsplash.com/photo-1544367563-12123d8959bd?auto=format&fit=crop&q=80'} 
                            alt={event.title} 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl z-20 shadow-sm text-center min-w-[70px]">
                            <span className="block text-2xl font-black text-orange leading-none">{new Date(event.event_date).getDate()}</span>
                            <span className="block text-xs font-bold text-gray-500">{new Date(event.event_date).toLocaleString('ar-EG', { month: 'short' })}</span>
                        </div>
                    </div>

                    {/* تفاصيل الفعالية */}
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                            <Calendar size={14}/> 
                            {new Date(event.event_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin size={14}/> 
                            {event.location || 'أونلاين'}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-forest mb-2 group-hover:text-orange transition-colors line-clamp-1">{event.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{event.description}</p>
                    
                    <button className="text-forest font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                        تفاصيل أكثر <ArrowRight size={16} />
                    </button>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* 👇 استدعاء النافذة المنبثقة هنا */}
      {selectedEvent && (
        <EventDetailsModal 
            event={selectedEvent} 
            isOpen={!!selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
        />
      )}
    </section>
  );
};

export default Events;