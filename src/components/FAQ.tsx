import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FAQ: React.FC = () => {
  const [faqData, setFaqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqData = async () => {
      const { data } = await supabase
        .from('landing_page_settings')
        .select('faq_section')
        .eq('id', 'main_page')
        .single();

      if (data) {
        setFaqData(data.faq_section);
      }
      setLoading(false);
    };
    fetchFaqData();
  }, []);

  if (loading) return (
    <div className="py-20 text-center bg-cream">
      <Loader2 className="animate-spin mx-auto text-orange" size={32} />
    </div>
  );

  // لو مفيش أسئلة مضافة، مش هنعرض السيكشن
  if (!faqData || !faqData.questions || faqData.questions.length === 0) return null;

  return (
    <section id="faq" className="py-24 px-6 md:px-12 bg-cream relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="text-orange" size={24} />
            <span className="text-orange font-bold">كل ما يهمك معرفته</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-forest mb-6">
            {faqData.title || "الأسئلة الشائعة"}
          </h2>
          <p className="text-forest/70 text-lg font-medium">
            {faqData.subtitle || "جمعنا لك إجابات لأكثر الأسئلة التي قد تدور في ذهنك."}
          </p>
        </div>

        <div className="space-y-4">
          {faqData.questions.map((item: any, index: number) => (
            <AccordionItem 
              key={index} 
              question={item.q} 
              answer={item.a} 
              delay={index * 0.1} 
            />
          ))}
        </div>
      </div>
    </section>
    
  );
};

const AccordionItem: React.FC<{ question: string; answer: string; delay: number }> = ({ question, answer, delay }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="border border-sage/50 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-right focus:outline-none"
      >
        <span className="text-lg md:text-xl font-bold text-forest ml-4">{question}</span>
        <div className={`p-2 rounded-full transition-colors duration-300 ${isOpen ? 'bg-orange text-white' : 'bg-sage/30 text-forest'}`}>
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6 pt-0 text-forest/80 text-lg font-medium leading-relaxed border-t border-dashed border-sage/30 mt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQ;