import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar, MapPin, Clock, Users, Search, Sparkles
} from 'lucide-react';
import EventDetailsModal from '../components/EventDetailsModal';

const EventsPage: React.FC = () => {
  // DB states
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Category filter state
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  // Search state
  const [query, setQuery] = useState('');

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });
        if (data) setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const categories = ['الكل', 'التغذية', 'الرياضة', 'الأسرة', 'الصحة النفسية', 'الأطفال', 'ورش العمل'];

  const whyAttend = [
    { title: "تعلم من الخبراء", desc: "نخبة من الأطباء وأخصائيي التغذية والرياضة المعتمدين يقدمون أفضل النصائح الطبية والعملية." },
    { title: "قابل مجتمع Healix", desc: "التقِ بأشخاص يشاركونك نفس الرغبة في التغيير الصحي وتبادل معهم قصص النجاح والدعم." },
    { title: "أنشطة للعائلة", desc: "لقاءاتنا وورش العمل مصممة لتناسب الكبار والأطفال، لتكون الرحلة الصحية تجربة ممتعة لكل الأسرة." },
    { title: "ورش تطبيقية", desc: "لا نكتفي بالتنظير، بل نطبق عملياً إعداد الوجبات الصحية، قياسات الجسم، والتمارين الوقائية." },
    { title: "جوائز وهدايا", desc: "سحوبات وجوائز تشجيعية وعينية للملتزمين والمشاركين الفاعلين في اللقاءات والمسابقات." }
  ];

  // Filtered events
  const filteredEvents = events.filter(e => {
    const matchesQuery = !query ||
      e.title?.toLowerCase().includes(query.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(query.toLowerCase()) ||
      (e.location || '').toLowerCase().includes(query.toLowerCase());
    const matchesCat = activeCategory === 'الكل' || e.category === activeCategory;
    return matchesQuery && matchesCat;
  });

  const handleSearch = (val: string) => {
    setQuery(val);
  };

  return (
    <div className="bg-[#fbfdf7] text-forest min-h-screen pt-20 overflow-x-hidden font-thmanyah selection:bg-forest selection:text-white" dir="rtl">

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-12 px-5 md:px-16 text-center">
        {/* Soft gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f8f2] via-[#fbfdf7] to-[#fbfdf7] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-forest tracking-tight leading-[1.1]">
            فعاليات هيليكس
          </h1>
          <p className="text-base md:text-lg text-forest/75">
            انضم إلى مجتمع هيليكس وشارك في لقاءات وورش عمل تساعدك وعائلتك على بناء أسلوب حياة صحي ومستدام.
          </p>
        </div>
      </section>

      {/* ── Search Bar ───────────────────────────────────── */}
      <section className="px-5 md:px-16 pb-6 pt-4">
        <div className="relative max-w-xl mx-auto group">
          <div className="relative flex items-center bg-white rounded-full px-5 py-3.5 shadow-sm border border-gray-100 focus-within:border-forest transition-all duration-300">
            <Search size={18} className="text-forest/50 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="ابحث في الفعاليات…"
              className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-right text-sm placeholder:text-gray-400 text-forest"
              dir="rtl"
            />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="ml-2 text-forest/60 hover:text-forest transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Category Pills ────────────────────────────────── */}
      <section className="px-5 md:px-16 pb-12">
        <div className="flex flex-wrap justify-center gap-2.5 max-w-5xl mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition-all duration-300 active:scale-95 ${activeCategory === cat
                  ? 'bg-forest text-white shadow-md'
                  : 'bg-white text-forest border border-gray-100 hover:bg-forest/5'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Main Content / Events Grid ────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[420px] bg-white border border-gray-100 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد فعاليات تطابق بحثك حالياً</h3>
            <p className="text-xs text-gray-400">تصفح الأقسام الأخرى أو عد لاحقاً لرؤية التحديثات!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[440px] cursor-pointer group"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={event.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80"}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-forest/90 backdrop-blur-sm text-white text-[9px] font-black shadow-md">
                    {event.category || "فعالية"}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between text-right space-y-4">
                  <div>
                    <h4 className="text-base font-black text-forest group-hover:text-orange transition-colors leading-snug line-clamp-2">
                      {event.title}
                    </h4>
                    <p className="text-xs text-forest/65 line-clamp-3 mt-1.5">{event.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-50 text-[10px] text-forest/70 font-bold">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-orange" />
                      <span>{new Date(event.event_date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-orange" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 font-black">
                      <span>المقاعد المتبقية: {event.available_seats}</span>
                      <span className="text-orange text-xs">
                        {event.price === 0 ? 'مجانًا' : `${event.price} ريال`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* SECTION 5: Why Attend Healix Events */}
      <section className="py-24 px-6 md:px-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-orange font-bold text-sm block">القيمة التي نقدمها</span>
            <h2 className="text-3xl md:text-5xl font-black text-forest">لماذا تحضر فعاليات Healix؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {whyAttend.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-3 hover:-translate-y-1 transition-transform duration-300"
              >
                <h3 className="text-sm font-black text-forest">{item.title}</h3>
                <p className="text-[11px] text-forest/70 leading-relaxed font-bold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

    </div>
  );
};

export default EventsPage;