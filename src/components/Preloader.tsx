import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-cream z-[9999] flex flex-col items-center justify-center">
      <div className="relative group">
        
        {/* الدائرة الدوارة - قمنا بتصغير الهوامش قليلاً (-inset-3 بدلاً من -inset-4) */}
        <motion.div
          className="absolute -inset-3 border-4 border-sage/30 border-t-orange rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* اللوجو النابض */}
        <motion.div
          animate={{ scale: [0.9, 1.05, 0.9] }} // قللنا نسبة التكبير أثناء النبض ليكون أهدأ
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          {/* تم تعديل الحجم هنا:
             - كان: h-24 w-24
             - أصبح: h-16 w-16 (مناسب وأنيق)
          */}
          <Logo className="h-16 w-16 shadow-xl rounded-2xl" />
        </motion.div>
      </div>
      
      {/* النص */}
      <motion.p
        className="mt-6 text-forest font-bold text-lg tracking-wider"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        جاري تجهيز صحتك...
      </motion.p>
    </div>
  );
};

export default Preloader;