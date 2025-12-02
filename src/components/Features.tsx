import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Users, Star } from 'lucide-react'; // تغيير الأيقونات لتناسب المحتوى الجديد

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  className?: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, image, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative overflow-hidden rounded-3xl shadow-lg group h-[300px] flex flex-col justify-between p-8 text-right ${className}`}
  >
    {/* Background Image with Zoom Effect */}
    <div className="absolute inset-0 z-0">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/70 to-forest/40 transition-opacity duration-300 group-hover:opacity-95" />
    </div>

    {/* Content */}
    <div className="relative z-10">
      <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center text-white mb-6 shadow-sm group-hover:bg-orange group-hover:border-orange transition-colors duration-300">
        {icon}
      </div>
    </div>
    
    <div className="relative z-10 text-white">
      <h3 className="text-2xl font-bold mb-2 text-white shadow-sm">{title}</h3>
      <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed drop-shadow-md">
        {description}
      </p>
    </div>
  </motion.div>
);

const Features: React.FC = () => {
  return (
    <section id="about-us" className="py-24 px-6 md:px-12 bg-cream relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold text-forest mb-4"
          >
            عن هيليكس
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-forest/70 max-w-2xl mx-auto font-medium"
          >
            في كل بيت حياة صحية.. لأن كل جسم ليه نظامه، وكل بيت يستحق يعيش بصحة.
          </motion.p>
        </div>

        {/* Bento Grid - Content Updated to "About Us" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
          
          {/* من هي هيليكس؟ (الكارت الكبير) */}
          <FeatureCard
            title="من هي Healix؟"
            description="منصة تغذية وإشراف طبي مصممة لخدمة البيت المصري، بنقدّم برامج غذائية مخصصة مش جاهزة، مع متخصصين في كل فرع."
            icon={<Star size={32} />}
            // يمكنك استخدام نفس الصور الموجودة أو تغييرها بصور تعبر عن الفريق/الشركة
            image="/pediatrics.jpg" 
            className="md:col-span-2 md:row-span-1"
            delay={0.1}
          />

          {/* الرسالة */}
          <FeatureCard
            title="رسالتنا"
            description="نوصل لكل بيت مصري بنظام غذائي يناسبه.. لأن التغذية مش دايت، التغذية أسلوب حياة."
            icon={<Target size={32} />}
            image="/women-health.jpg"
            delay={0.2}
          />

          {/* الرؤية */}
          <FeatureCard
            title="رؤيتنا"
            description="نحسن صحة مليون أسرة خلال ٣ سنوات، ونغير مفهوم الدايت التقليدي."
            icon={<Eye size={32} />}
            image="/men-health.jpg"
            delay={0.3}
          />
          
          {/* الفريق الطبي (الكارت العريض الأسفل) */}
          <FeatureCard
            title="فريقنا الطبي"
            description="نخبة من الأطباء والأخصائيين المعتمدين لضمان خطة آمنة، علمية، ومبنية على معايير التغذية العلاجية."
            icon={<Users size={32} />}
            image="/elderly.jpg"
            className="md:col-span-2"
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
};

export default Features;