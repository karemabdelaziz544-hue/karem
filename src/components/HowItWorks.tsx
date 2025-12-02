import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FileText, Activity, FileCheck, CalendarClock, Smile } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "استمارة التقييم",
    desc: "بتملا استمارة تقييم أولية بنعرف منها تاريخك الصحي وأهدافك.",
    icon: <FileText size={28} />,
    color: "bg-sage text-forest"
  },
  {
    id: 2,
    title: "قياس الحالة",
    desc: "بنحلل حالتك بالكامل (وزن، دهون، نشاط، نمط يوم، وتحاليل طبية) عشان نفهم جسمك.",
    icon: <Activity size={28} />,
    color: "bg-orange text-white"
  },
  {
    id: 3,
    title: "استلام النظام",
    desc: "بنكتبلك نظامك المخصص، مبني على الأكل المصري المتوفر في بيتك.",
    icon: <FileCheck size={28} />,
    color: "bg-sage text-forest"
  },
  {
    id: 4,
    title: "المتابعة والتعديل",
    desc: "متابعة أسبوعية دقيقة لتعديل النظام حسب استجابة جسمك والنتائج.",
    icon: <CalendarClock size={28} />,
    color: "bg-forest text-cream"
  },
  {
    id: 5,
    title: "الدعم المستمر",
    desc: "دعم يومي وتشجيع لحد ما توصل لهدفك وتثبته.",
    icon: <Smile size={28} />,
    color: "bg-orange text-white"
  }
];

const HowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto" ref={containerRef}>
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-forest mb-6">
            كيف نبدأ معك؟
          </h2>
          <p className="text-forest/70 max-w-xl mx-auto text-lg font-medium">
            رحلة منظمة ومدروسة لضمان وصولك للهدف.
          </p>
        </div>

        <div className="relative">
          {/* Central Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-sage/30 -translate-x-1/2 hidden md:block rounded-full">
            <motion.div style={{ height: lineHeight }} className="w-full bg-orange origin-top rounded-full" />
          </div>

          {/* Steps */}
          <div className="space-y-16 relative z-10">
            {steps.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} isEven={index % 2 === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  step: { id: number; title: string; desc: string; icon: React.ReactNode; color: string };
  index: number;
  isEven: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ step, index, isEven }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col md:flex-row items-center md:gap-16 gap-6 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      <div className={`flex-1 ${isEven ? 'md:text-left pl-0 md:pl-10' : 'md:text-right pr-0 md:pr-10'} text-right w-full md:w-auto pr-16 md:pr-0`}>
        <h3 className="text-2xl font-bold text-forest mb-2 flex items-center gap-2 md:block">
          <span className="text-orange md:hidden">خطوة {step.id}:</span>
          {step.title}
        </h3>
        <p className="text-forest/70 leading-relaxed font-medium text-lg">{step.desc}</p>
      </div>

      <div className="absolute right-0 md:relative md:right-auto flex-shrink-0">
         <motion.div whileHover={{ scale: 1.1 }} className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white z-10 ${step.color}`}>
            {step.icon}
         </motion.div>
      </div>

      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
};

export default HowItWorks;