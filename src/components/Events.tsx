import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Video, Users, ArrowLeft } from 'lucide-react';
import Button from './Button';

const Events: React.FC = () => {
  const events = [
    {
      id: 1,
      title: "ورشة التغذية العلاجية (أونلاين)",
      date: "الجمعة، ١٥ نوفمبر - ٨ مساءً",
      type: "Online",
      location: "Zoom Meeting",
      price: "مجاناً لمشتركي Pro",
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=1000",
      description: "جلسة تفاعلية مع د. أحمد (استشاري التغذية) للإجابة على كل أسئلتكم حول مقاومة الإنسولين."
    },
    {
      id: 2,
      title: "تجمع هيليكس الرياضي (أوفلاين)",
      date: "السبت، ٢٣ نوفمبر - ٩ صباحاً",
      type: "Offline",
      location: "نادي الزهور، القاهرة",
      price: "تذكرة رمزية / مجاناً للـ Pro",
      image: "https://images.unsplash.com/photo-1571019614248-c5c7c319e578?auto=format&fit=crop&q=80&w=1000",
      description: "يوم رياضي كامل، تدريبات جماعية خفيفة، وفطار صحي مع مجتمع هيليكس."
    }
  ];

  return (
    <section id="events" className="py-24 px-6 md:px-12 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sage/30 rounded-full text-forest font-bold mb-4"
          >
            <Users size={18} />
            <span>مجتمع هيليكس</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-forest mb-4">فعاليات وإيفنتات</h2>
          <p className="text-forest/70 text-lg font-medium max-w-2xl mx-auto">
            لأن الرحلة أسهل مع صحبة، بنوفر لك لقاءات دورية (أونلاين وأوفلاين) عشان نشجع بعض.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group rounded-3xl overflow-hidden border border-sage/50 bg-cream hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row h-full"
            >
              {/* Image Side */}
              <div className="md:w-2/5 h-48 md:h-auto relative overflow-hidden">
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-forest shadow-sm flex items-center gap-1">
                  {event.type === 'Online' ? <Video size={14} /> : <MapPin size={14} />}
                  {event.type === 'Online' ? 'أونلاين' : 'أوفلاين'}
                </div>
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>

              {/* Content Side */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-orange font-bold text-sm mb-2">
                    <Calendar size={16} />
                    {event.date}
                  </div>
                  <h3 className="text-2xl font-bold text-forest mb-3">{event.title}</h3>
                  <p className="text-forest/70 text-sm leading-relaxed mb-4 font-medium">
                    {event.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-sage/20">
                  <span className="text-forest font-bold text-sm bg-sage/50 px-3 py-1 rounded-lg">
                    {event.price}
                  </span>
                  <button className="text-orange font-bold flex items-center gap-1 hover:gap-2 transition-all text-sm">
                    حجز مقعد <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Events;