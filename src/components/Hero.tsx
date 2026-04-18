import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';
import CountUp from './CountUp';

const Hero: React.FC = () => {
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      const { data } = await supabase
        .from('landing_page_settings')
        .select('hero_section')
        .eq('id', 'main_page')
        .single();

      if (data) {
        setHeroData(data.hero_section);
      }
      setLoading(false);
    };
    fetchHeroData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
       <Loader2 className="animate-spin text-orange" size={40} />
    </div>
  );

  return (
    <section className="relative pt-32 pb-20 px-6 md:px-12 min-h-screen flex items-center overflow-hidden bg-white">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sage/30 rounded-full blur-[100px] -z-10 animate-float" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange/10 rounded-full blur-[80px] -z-10 animate-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Right: Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 text-right"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-sage"
          >
            <Heart size={16} className="text-orange fill-orange animate-pulse" />
            <span className="text-sm font-bold text-forest tracking-wide">
              {heroData?.badge || "لأن كل جسم ليه نظامه"}
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-forest leading-[1.2] tracking-tight">
            {heroData?.title_part1 || "Healix.."} <br />
            <span className="text-orange relative inline-block">
              {heroData?.title_highlight || "في كل بيت"}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-sage -z-10 opacity-60" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 15 Q 50 0 100 15" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
            {" "} {heroData?.title_part2 || "حياة صحية."}
          </h1>

          <p className="text-lg md:text-xl text-forest/80 max-w-xl leading-relaxed font-medium ml-auto">
            {heroData?.description || "نقدّم أنظمة غذائية علاجية وتخصصية بإشراف دكاترة تغذية وأخصائيين."}
          </p>

          {/* الأزرار الديناميكية */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-end">
            {heroData?.primary_btn?.show && (
              <Button variant="primary" onClick={() => window.open(heroData.primary_btn.link, '_blank')}>
                <MessageCircle size={20} />
                {heroData.primary_btn.text}
              </Button>
            )}
            {heroData?.secondary_btn?.show && (
              <Button variant="outline" onClick={() => window.location.href = heroData.secondary_btn.link}>
                {heroData.secondary_btn.text} <ArrowLeft size={18} />
              </Button>
            )}
          </div>

          {/* إحصائيات النجاح الديناميكية */}
          <div className="flex items-center justify-end gap-4 pt-8">
            <div className="text-sm font-bold text-forest text-right">
               {heroData?.success_label || "أكثر من"} <span className="text-orange text-lg">
                 {heroData?.success_count_text || "1,000+"}
               </span> قصة نجاح.
            </div>
            <div className="flex -space-x-3 space-x-reverse">
              {heroData?.success_avatars?.map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm bg-gray-100"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Left: Visual */}
        <div className="relative h-[400px] md:h-[500px] flex items-center justify-center">
          <motion.div
            className="relative w-full h-full flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="relative w-[90%] h-[90%] md:w-full md:h-full max-w-[500px] max-h-[500px]">
                <div className="w-full h-full rounded-[60%_40%_30%_70%/60%_30%_70%_40%] overflow-hidden shadow-2xl border-[6px] border-white/50 animate-float z-10 relative bg-white">
                     <img 
                       src={heroData?.image_url || "/family.jpg"} 
                       alt="عائلة هيليكس السعيدة" 
                       className="w-full h-full object-cover"
                    />
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;