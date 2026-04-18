import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WhatsAppBtn: React.FC = () => {
  // تذكر استبدال الرقم برقمك الحقيقي
  const phoneNumber = "123456789"; 
  const message = "مرحباً، لدي استفسار بخصوص الاشتراك في هيليكس";

  const handleClick = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 cursor-pointer group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      onClick={handleClick}
    >
      {/* Tooltip Bubble */}
      <div className="absolute bottom-full right-0 mb-3 ml-2 w-max hidden group-hover:block">
        <div className="bg-forest text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg relative">
          تواصل معنا الآن
          <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-forest rotate-45 transform"></div>
        </div>
      </div>

      {/* Button with Website Theme Green (Forest) */}
      <div className="relative">
        {/* Pulse Effect - using sage color to be subtle but visible */}
        <span className="absolute inset-0 rounded-full bg-sage opacity-60 animate-ping"></span>
        
        {/* Main Circle - using 'bg-forest' from your theme */}
        <div className="relative bg-forest w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 border-sage/30 hover:bg-orange transition-colors duration-300">
          <MessageCircle size={32} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default WhatsAppBtn;