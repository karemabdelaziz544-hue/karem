import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Users, Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const iconMap: any = {
  Star: <Star size={32} />,
  Target: <Target size={32} />,
  Eye: <Eye size={32} />,
  Users: <Users size={32} />,
};

const Features: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: settings } = await supabase
        .from('landing_page_settings')
        .select('about_section')
        .eq('id', 'main_page')
        .single();
      if (settings) setData(settings.about_section);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-forest" /></div>;
  if (!data) return null;

  return (
    <section id="about-us" className="py-24 px-6 md:px-12 bg-cream relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 className="text-4xl md:text-5xl font-extrabold text-forest mb-4">
            {data.main_title}
          </motion.h2>
          <motion.p className="text-lg text-forest/70 max-w-2xl mx-auto font-medium">
            {data.main_description}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
          {data.cards.map((card: any, idx: number) => (
            <FeatureCard
              key={idx}
              title={card.title}
              description={card.desc}
              icon={iconMap[card.icon] || <Star size={32} />}
              image={card.image}
              className={
                card.size === 'large' ? 'md:col-span-2 md:row-span-1' : 
                card.size === 'wide' ? 'md:col-span-2' : ''
              }
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard: React.FC<any> = ({ title, description, icon, image, className, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative overflow-hidden rounded-[2.5rem] shadow-lg group h-[300px] flex flex-col justify-between p-8 text-right ${className}`}
  >
    <div className="absolute inset-0 z-0">
      <img 
        src={image} 
        alt={title} 
        loading="lazy" // 👈 إضافة Lazy Load
        width="400" height="300"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/70 to-forest/40 transition-opacity duration-300 group-hover:opacity-95" />
    </div>

    <div className="relative z-10">
      <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-orange group-hover:border-orange transition-colors duration-300">
        {icon}
      </div>
    </div>
    
    <div className="relative z-10 text-white">
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-white/90 text-sm font-medium leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default Features;