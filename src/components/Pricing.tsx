import React from 'react';
import { motion } from 'framer-motion';
import { Check, MessageCircle, Star, Zap } from 'lucide-react';
import Button from './Button';

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 px-6 md:px-12 bg-forest relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-sage rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">باقات الاشتراك</h2>
          <p className="text-sage/80 text-lg font-medium max-w-2xl mx-auto">
            اختر الباقة المناسبة لهدفك، وابدأ رحلتك بإشراف طبي كامل.
          </p>
        </div>

        {/* Grid changed to 2 columns for Standard vs Pro */}
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          
          {/* Standard Plan */}
          <PricingCard
            title="الباقة الأساسية (Standard)"
            price="٥٠٠"
            period="ج.م / شهرياً"
            features={[
              "نظام غذائي مخصص لمدة شهر",
              "إشراف طبي متخصص (حسب الحالة)",
              "متابعة يومية (٨ ساعات/يوم)",
              "تعديل النظام مرة واحدة عند الحاجة",
              "تحليل التاريخ الطبي"
            ]}
            message="مرحباً، أرغب في الاشتراك في الباقة الأساسية (Standard) - 500ج"
            delay={0.1}
          />

          {/* Pro Plan */}
          <PricingCard
            title="باقة المحترفين (Pro)"
            price="٧٥٠"
            period="ج.م / شهرياً"
            isPopular
            features={[
              "نظامين غذائيين (تجديد كل أسبوعين)",
              "إشراف طبي متخصص ودقيق",
              "متابعة مكثفة (١٦ ساعة/يوم)",
              "٢ ميتينج زووم مع دكتور التغذية",
              "دعوات حصرية للإيفنتات (أونلاين/أوفلاين)",
              "أولوية في الرد وتعديل الخطط"
            ]}
            message="مرحباً، أرغب في الاشتراك في باقة المحترفين (Pro) - 750ج"
            delay={0.2}
          />

        </div>
      </div>
    </section>
  );
};

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  message: string;
  delay: number;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, period, features, isPopular, message, delay }) => {
  // تذكر استبدال الرقم برقم الواتساب الحقيقي الخاص بالشركة
  const phoneNumber = "123456789"; 

  const handleSubscribe = () => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10 }}
      className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300
        ${isPopular 
          ? 'bg-cream text-forest shadow-[0_0_40px_rgba(249,115,22,0.3)] border-4 border-orange md:scale-105 z-10' 
          : 'bg-white/5 backdrop-blur-sm text-cream border border-white/10 hover:bg-white/10'}
      `}
    >
      {isPopular && (
        <div className="absolute -top-5 left-1/2 translate-x-1/2 bg-orange text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 whitespace-nowrap">
          <Star size={14} fill="white" /> الأكثر طلباً <Star size={14} fill="white" />
        </div>
      )}

      <div className="mb-6 text-center">
        <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-forest' : 'text-sage'}`}>{title}</h3>
        <div className="flex items-center justify-center gap-1">
          <span className={`text-4xl font-extrabold ${isPopular ? 'text-orange' : 'text-white'}`}>{price}</span>
        </div>
        <span className={`text-sm font-medium ${isPopular ? 'text-gray-500' : 'text-sage/60'}`}>{period}</span>
      </div>

      <div className="w-full h-px bg-current opacity-10 mb-6" />

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 font-medium">
            <div className={`mt-1 p-0.5 rounded-full shrink-0 ${isPopular ? 'bg-orange text-white' : 'bg-sage/20 text-sage'}`}>
              <Check size={14} strokeWidth={3} />
            </div>
            <span className={isPopular ? 'text-gray-700' : 'text-sage/80'}>{feature}</span>
          </li>
        ))}
      </ul>

      <Button 
        variant={isPopular ? 'primary' : 'outline'} 
        className={`w-full justify-center ${!isPopular && 'border-sage/30 text-sage hover:bg-sage hover:text-forest hover:border-sage'}`} 
        onClick={handleSubscribe}
      >
        <MessageCircle size={18} />
        {isPopular ? 'اشترك في باقة المحترفين' : 'اشترك في الباقة الأساسية'}
      </Button>
    </motion.div>
  );
};

export default Pricing;