import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, UserPlus, Star, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from './Button';

const Pricing: React.FC = () => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPricing = async () => {
      const { data } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (data) setPlan(data);
      setLoading(false);
    };
    fetchPricing();
  }, []);

  if (loading) return (
    <div className="py-20 text-center text-white">
      <Loader2 className="animate-spin mx-auto text-orange" size={40} />
    </div>
  );
  
  if (!plan) return null;

  return (
    <section id="pricing" className="py-24 px-6 md:px-12 bg-forest relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-sage rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            باقة واحدة.. تجمع العائلة
          </motion.h2>
          <p className="text-sage/80 text-lg font-medium max-w-2xl mx-auto">
            اهتم بصحتك وصحة من تحب في مكان واحد وبإشراف طبي متكامل.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative flex flex-col p-10 rounded-[3rem] bg-cream text-forest shadow-[0_25px_60px_rgba(0,0,0,0.3)] border-4 border-orange"
          >
            {/* Badge */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange text-white px-8 py-2 rounded-full text-sm font-black shadow-lg flex items-center gap-2 whitespace-nowrap">
               عرض العائلة متاح 
            </div>

            <div className="mb-8 text-center">
              <h3 className="text-3xl font-black mb-4 text-forest">{plan.title}</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black text-orange">{plan.price}</span>
                <span className="text-lg font-bold text-gray-500">{plan.period}</span>
              </div>
            </div>

            {/* ميزة العائلة - قسم مخصص داخل الكارت */}
            <div className="bg-orange/10 border border-orange/20 rounded-2xl p-4 mb-8 flex items-center gap-4 group">
              <div className="w-12 h-12 bg-orange text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <Users size={24} />
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-forest leading-tight">ميزة العائلة</p>
                <p className="text-[11px] font-bold text-orange mt-1">
                  +{plan.extra_member_price} ج.م فقط للفرد الإضافي
                </p>
              </div>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-3 font-bold text-gray-700">
                  <div className="mt-1 p-1 rounded-full shrink-0 bg-forest text-cream">
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span className="text-base">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full py-6 text-xl rounded-2xl justify-center gap-3 bg-forest hover:bg-black text-white shadow-lg transition-transform hover:scale-[1.02]" 
              onClick={() => navigate('/signup')}
            >
              <UserPlus size={24} />
              {plan.cta_text || 'ابدأ رحلتك العائلية'}
            </Button>
            
            <p className="mt-6 text-center text-[10px] font-black text-gray-400 leading-relaxed px-4">
              * {plan.family_note}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;