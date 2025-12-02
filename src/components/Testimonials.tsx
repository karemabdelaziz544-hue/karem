import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, User } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: "مروة علي",
    role: "أم لثلاثة أطفال",
    content: "تجربة هيليكس غيرت حياة ولادي. الدكتور المتابع كان فاهم جداً لمشاكلهم، وبدأنا نلاحظ فرق في مناعتهم.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: 2,
    name: "أحمد كمال",
    role: "مشترك باقة Pro",
    content: "كنت فاكر الدايت حرمان، بس مع هيليكس باكل كل حاجة من البيت. نزلت ١٠ كيلو في شهرين وصحتي اتحسنت.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: 3,
    name: "سارة حسن",
    role: "طالبة جامعية",
    content: "المتابعة على الواتساب مريحة جداً. الدكتور بيرد بسرعة وبيشجعني لما بكسل. أحلى حاجة إن الأكل مش مكلف.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
  }
];

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const getCardStyle = (index: number) => {
    if (index === activeIndex) return "center";
    if (index === (activeIndex + 1) % reviews.length) return "right";
    return "left";
  };

  return (
    <section className="py-24 bg-forest relative overflow-hidden min-h-[850px] flex flex-col items-center justify-center">
      
      {/* الخلفية */}
      <div className="absolute inset-0 flex flex-col justify-center items-center opacity-5 pointer-events-none select-none">
         <h2 className="text-[12vw] font-black text-cream leading-none">FEEDBACK</h2>
         <h2 className="text-[12vw] font-black text-transparent stroke-text leading-none" style={{ WebkitTextStroke: '2px #fff7ed' }}>OPINIONS</h2>
         <h2 className="text-[12vw] font-black text-cream leading-none">REVIEWS</h2>
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* === صورة العائلة (من ملفاتك المحلية) === */}
        <div className="relative mb-[-80px] z-0 flex justify-center w-full">
             {/* إضاءة خلفية لتمييز الصورة */}
             <div className="absolute bottom-0 w-[500px] h-[400px] bg-orange/20 rounded-full blur-[100px] transform translate-y-20" />
             
             <img 
               // تم تغيير المصدر هنا ليقرأ من مجلد public
               src="/family-feedback.png" 
               alt="Happy Family" 
               className="relative z-10 w-[650px] md:w-[800px] object-contain drop-shadow-2xl"
               style={{ 
                 // تأثير الدمج: يجعل الصورة تتلاشى من الأسفل
                 maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                 WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' 
               }}
             />
        </div>
        {/* ======================================== */}

        {/* كروت الآراء */}
        <div className="relative w-full h-[300px] flex items-center justify-center perspective-1000 mt-10">
          {reviews.map((review, index) => {
            const position = getCardStyle(index);
            const isCenter = position === "center";
            const xOffset = isCenter ? 0 : position === "right" ? 350 : -350;
            const scale = isCenter ? 1 : 0.8;
            const opacity = isCenter ? 1 : 0.5;
            const zIndex = isCenter ? 20 : 10;
            const blur = isCenter ? "0px" : "4px";

            return (
              <motion.div
                key={review.id}
                initial={false}
                animate={{
                  x: xOffset,
                  scale: scale,
                  opacity: opacity,
                  zIndex: zIndex,
                  filter: `blur(${blur})`,
                }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                className={`absolute top-0 w-[320px] md:w-[380px] bg-cream/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/50 text-right
                  ${isCenter ? 'shadow-[0_20px_50px_rgba(249,115,22,0.15)] border-orange/30' : ''}
                `}
                style={{ 
                    left: '50%', 
                    marginLeft: '-160px',
                    ...(window.innerWidth < 768 ? { x: 0, opacity: isCenter ? 1 : 0 } : {}) 
                }} 
              >
                <div className="absolute -top-6 right-6">
                   <img 
                     src={review.image} 
                     alt={review.name} 
                     className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover"
                   />
                </div>

                <div className="mt-6">
                   <div className="flex justify-between items-start mb-3">
                       <div>
                           <h4 className="font-bold text-forest text-lg">{review.name}</h4>
                           <p className="text-xs text-orange font-bold">{review.role}</p>
                       </div>
                       <div className="flex gap-0.5">
                           {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-orange text-orange" />)}
                       </div>
                   </div>
                   
                   <p className="text-forest/80 text-sm font-medium leading-relaxed">
                       "{review.content}"
                   </p>
                   
                   <div className="mt-4 pt-4 border-t border-forest/5 flex justify-center">
                       <div className="bg-forest text-white text-xs py-1.5 px-4 rounded-full font-bold flex items-center gap-2">
                           <User size={12} />
                           <span>عميل موثق</span>
                       </div>
                   </div>
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