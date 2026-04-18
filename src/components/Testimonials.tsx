import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, User, Loader2, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Testimonials: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      if (data) setReviews(data);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [reviews]);

  if (loading) return <div className="py-24 bg-forest text-center"><Loader2 className="animate-spin mx-auto text-orange" size={40} /></div>;
  if (reviews.length === 0) return null;

  return (
    <section className="py-32 bg-forest relative overflow-hidden flex flex-col items-center justify-center">
      {/* نص خلفية ضخم للتصميم */}
      <div className="absolute inset-0 flex flex-col justify-center items-center opacity-[0.03] pointer-events-none select-none italic">
         <h2 className="text-[15vw] font-black text-white leading-none uppercase">SUCCESS</h2>
         <h2 className="text-[15vw] font-black text-white leading-none uppercase">STORIES</h2>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">آراء عائلة هيليكس</h2>
          <div className="w-24 h-2 bg-orange mx-auto rounded-full" />
        </div>

        <div className="relative h-[400px] flex items-center justify-center">
          {reviews.map((review, index) => {
            const isCenter = index === activeIndex;
            const isRight = index === (activeIndex + 1) % reviews.length;
            const isLeft = index === (activeIndex - 1 + reviews.length) % reviews.length;

            if (!isCenter && !isRight && !isLeft && reviews.length > 3) return null;

            return (
              <motion.div
                key={review.id}
                animate={{
                  x: isCenter ? 0 : isRight ? 400 : -400,
                  scale: isCenter ? 1.1 : 0.85,
                  opacity: isCenter ? 1 : 0.4,
                  zIndex: isCenter ? 30 : 10,
                  filter: isCenter ? "blur(0px)" : "blur(6px)",
                }}
                transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
                className={`absolute w-[340px] md:w-[450px] bg-white rounded-[3rem] p-10 shadow-2xl border-t-8 border-orange text-right`}
              >
                <Quote className="text-orange/10 absolute top-10 left-10" size={80} />
                
                <div className="flex items-center gap-4 mb-8">
                  {/* أيقونة فيكتور بدلاً من الصورة */}
                  <div className="w-16 h-16 bg-forest text-orange rounded-2xl flex items-center justify-center shadow-lg">
                    <User size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-black text-forest text-xl leading-tight">{review.name}</h4>
                    <p className="text-xs text-orange font-bold mt-1 uppercase tracking-widest">{review.role}</p>
                  </div>
                </div>

                <p className="text-forest/80 text-lg font-bold leading-relaxed mb-8 min-h-[100px]">
                  "{review.content}"
                </p>

                <div className="flex justify-between items-center pt-6 border-t border-forest/5">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-orange text-orange" />)}
                  </div>
                  <span className="text-[10px] font-black text-forest/40 uppercase tracking-tighter">Verified Review</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;