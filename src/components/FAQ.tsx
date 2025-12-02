import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const questions = [
  {
    question: "هل الأنظمة الغذائية مناسبة للأطفال أو مرضى الأمراض المزمنة؟",
    answer: "نعم، بالتأكيد. في هيليكس، كل مشترك يتم تقييم حالته بواسطة طبيب متخصص. لو المشترك طفل، بيتابع مع دكتور أطفال، ولو مريض سكر أو ضغط، بيتابع مع دكتور باطنة لضمان سلامته."
  },
  {
    question: "هل الأكل في النظام مكلف أو صعب التحضير؟",
    answer: "لا إطلاقاً. فلسفتنا هي 'الدايت من أكل البيت'. بنصمم نظامك بناءً على ميزانيتك والأكل المتوفر في بيتك، بدون طلبات خزعبلية أو مكونات نادرة."
  },
  {
    question: "كيف يتم التواصل مع الطبيب؟",
    answer: "التواصل بيكون مباشر عبر الواتساب. في الباقة الأساسية (Standard) المتابعة يومية لمدة ٨ ساعات، وفي باقة المحترفين (Pro) المتابعة ممتدة لـ ١٦ ساعة مع ميتينج زووم كل أسبوعين."
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "نوفر طرق دفع سهلة ومناسبة للجميع مثل فودافون كاش، إنستا باي (InstaPay)، والتحويل البنكي."
  },
  {
    question: "هل يمكنني تجميد الاشتراك؟",
    answer: "نعم، يمكنك تجميد الاشتراك لمرة واحدة خلال فترة الباقة في حالة حدوث أي ظروف طارئة تمنعك من الاستمرار."
  }
];

const FAQ: React.FC = () => {
  return (
    <section className="py-24 px-6 md:px-12 bg-cream relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="text-orange" size={24} />
                <span className="text-orange font-bold">كل ما يهمك معرفته</span>
            </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-forest mb-6">الأسئلة الشائعة</h2>
          <p className="text-forest/70 text-lg font-medium">
            جمعنا لك إجابات لأكثر الأسئلة التي قد تدور في ذهنك.
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <AccordionItem key={index} question={q.question} answer={q.answer} delay={index * 0.1} />
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