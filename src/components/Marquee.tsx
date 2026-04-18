import React from 'react';
import { motion } from 'framer-motion';

const Marquee: React.FC = () => {
  const text = "بدون حرمان • متابعة يومية • أطباء حقيقيون • نتائج مضمونة • لا للأنظمة الجاهزة • ";
  const duplicatedText = text.repeat(4);

  return (
    <div className="w-full bg-forest py-6 overflow-hidden border-y border-sage/20">
      <motion.div
        className="whitespace-nowrap flex"
        // In RTL, standard negative x translate moves left, which is what we want for scrolling right-to-left effect naturally
        // But to make it read naturally, we might want it to flow. Let's keep standard marquee behavior.
        animate={{ x: "0%" }} // Reset start
        initial={{ x: "-50%" }}
        whileInView={{ x: "0%" }} // Move from left to right for Arabic reading flow logic
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 25,
          from: "-50%"
        }}
      >
        <span className="text-2xl md:text-3xl font-bold text-sage/80 font-tajawal tracking-wider px-4">
          {duplicatedText}
        </span>
      </motion.div>
    </div>
  );
};

export default Marquee;