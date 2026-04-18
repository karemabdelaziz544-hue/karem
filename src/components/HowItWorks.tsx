import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FileText, Activity, FileCheck, CalendarClock, Smile, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const iconMap: any = {
  FileText: <FileText size={28} />,
  Activity: <Activity size={28} />,
  FileCheck: <FileCheck size={28} />,
  CalendarClock: <CalendarClock size={28} />,
  Smile: <Smile size={28} />,
};

const colorMap: any = {
  sage: "bg-sage text-forest",
  orange: "bg-orange text-white",
  forest: "bg-forest text-cream",
};

/* ─────────────────────────────────────────────────────────────────────────────
   1. المكون الداخلي الذي يحتوي على الـ Scroll Logic
   هذا المكون لن يعمل إلا والبيانات جاهزة، مما يحل مشكلة الـ Hydration
───────────────────────────────────────────────────────────────────────────── */
const HowItWorksContent: React.FC<{ data: any }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="max-w-5xl mx-auto" ref={containerRef}>
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold text-forest mb-6">{data.title}</h2>
        <p className="text-forest/70 max-w-xl mx-auto text-lg font-medium">{data.description}</p>
      </div>

      <div className="relative">
        {/* الخط الرأسي المركزي */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-sage/30 -translate-x-1/2 hidden md:block rounded-full">
          <motion.div style={{ height: lineHeight }} className="w-full bg-orange origin-top rounded-full" />
        </div>

        {/* الخطوات */}
        <div className="space-y-16 relative z-10">
          {data.steps.map((step: any, index: number) => (
            <StepCard 
              key={index} 
              step={{
                ...step, 
                icon: iconMap[step.icon] || <Smile size={28} />,
                color: colorMap[step.color] || "bg-orange text-white"
              }} 
              index={index} 
              isEven={index % 2 === 0} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   2. المكون الرئيسي (المسؤول عن جلب البيانات فقط)
───────────────────────────────────────────────────────────────────────────── */
const HowItWorks: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: settings } = await supabase
          .from('landing_page_settings')
          .select('steps_section')
          .eq('id', 'main_page')
          .single();
        if (settings) setData(settings.steps_section);
      } catch (err) {
        console.error("Error fetching steps:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="py-20 flex justify-center items-center bg-white">
      <Loader2 className="animate-spin text-orange" size={32} />
    </div>
  );

  if (!data || !data.steps) return null;

  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 bg-white overflow-hidden">
       {/* استدعاء المكون الداخلي وتمرير البيانات له */}
       <HowItWorksContent data={data} />
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   3. مكون بطاقة الخطوة (StepCard)
───────────────────────────────────────────────────────────────────────────── */
const StepCard: React.FC<any> = ({ step, index, isEven }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6 }}
    className={`flex flex-col md:flex-row items-center md:gap-16 gap-6 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
  >
    <div className={`flex-1 ${isEven ? 'md:text-left' : 'md:text-right'} text-right w-full`}>
      <h3 className="text-2xl font-bold text-forest mb-2">
        <span className="text-orange md:hidden">خطوة {step.id}: </span>
        {step.title}
      </h3>
      <p className="text-forest/70 leading-relaxed font-medium text-lg">{step.desc}</p>
    </div>

    <div className="flex-shrink-0 relative z-20">
       <motion.div whileHover={{ scale: 1.1 }} className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white ${step.color}`}>
          {step.icon}
       </motion.div>
    </div>

    <div className="flex-1 hidden md:block" />
  </motion.div>
);

export default HowItWorks;