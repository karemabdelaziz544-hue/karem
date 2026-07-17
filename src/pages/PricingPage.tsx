import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Check, X, Sparkles, Users, HelpCircle, ArrowLeft,
  Heart, Shield, Eye, Award as Ribbon, ChevronRight,
  ChevronLeft, Plus, Minus, Smartphone, CheckCircle,
  TrendingUp, Activity, Lock, Key, Calendar
} from 'lucide-react';

const PricingPage: React.FC = () => {


  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Animation defaults
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: "easeOut" as const }
  };

  const faqItems = [
    { q: "هل الاشتراك شهري؟", a: "نعم، نظام الاشتراك في هيليكس شهري مرن، يمكنك تجديده أو إلغاؤه في أي وقت دون أي التزامات طويلة الأجل." },
    { q: "هل يمكن إضافة أفراد لاحقاً؟", a: "نعم تماماً، يمكنك إضافة أفراد عائلتك وتفعيل حساباتهم التابعة في أي وقت من لوحة تحكم حسابك الرئيسي مباشرة." },
    { q: "هل يمكن حذف أفراد؟", a: "نعم، يمكنك تعديل أفراد عائلتك أو حذف الحسابات التابعة متى أردت، وسيتم تحديث الفاتورة تلقائياً للاشتراك القادم." },
    { q: "كيف يتم الدفع؟", a: "نقبل جميع وسائل الدفع الآمنة والبطاقات الائتمانية وخدمات مدى وApple Pay لتسهيل عمليات التفعيل التلقائي." },
    { q: "هل يمكن التجديد؟", a: "نعم، يتم تجديد الاشتراك تلقائياً كل شهر لضمان استمرارية رعايتك ومتابعة طبيبك المعالج دون انقطاع." },
    { q: "هل البيانات آمنة؟", a: "خصوصيتكم هي أولويتنا. جميع البيانات الطبية، السجلات والتحاليل مشفرة بالكامل طبقاً لمعايير الأمن الطبية العالمية الحامية للسرية التامة." }
  ];

  const comparisons = [
    { name: "خطة غذائية مخصصة", main: true, sub: true },
    { name: "تقارير صحية دورية", main: true, sub: true },
    { name: "تتبع القياسات والوزن", main: true, sub: true },
    { name: "مساعد الذكاء الاصطناعي 24/7", main: true, sub: true },
    { name: "قراءة المدونة الطبية", main: true, sub: true },
    { name: "الفعاليات وورش العمل الحية", main: true, sub: true },
    { name: "الدعم الفني المباشر", main: true, sub: true },
    { name: "متابعة طبية مباشرة مع الطبيب المعالج", main: true, sub: false },
    { name: "إدارة الحسابات العائلية", main: true, sub: false }
  ];

  return (
    <div className="bg-[#fbfdf7] text-forest min-h-screen pt-20 overflow-x-hidden font-thmanyah selection:bg-forest selection:text-white" dir="rtl">

      {/* SECTION 1: Hero */}
      <section className="relative py-20 md:py-32 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-[#f5f8f2] to-[#fbfdf7] text-center">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-10 left-10 w-96 h-96 bg-sage/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-emerald-100/30 rounded-full filter blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
            <Sparkles size={12} className="text-orange" />
            <span>باقات اشتراك مرنة لكل الأسرة</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-forest leading-tight">
            اختر الخطة المناسبة لعائلتك
          </h1>

          <p className="text-base md:text-xl text-forest/70 font-medium leading-relaxed max-w-2xl mx-auto">
            ابدأ رحلتك نحو حياة صحية أفضل مع نظام اشتراك بسيط ومرن يناسب احتياجات كل أسرة.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-xs md:text-sm font-black text-forest/80 pt-4">
            <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-50">
              <span className="text-emerald-500">✔</span> نظام غذائي شخصي
            </div>
            <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-50">
              <span className="text-emerald-500">✔</span> متابعة مستمرة
            </div>
            <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-50">
              <span className="text-emerald-500">✔</span> ذكاء اصطناعي
            </div>
            <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-50">
              <span className="text-emerald-500">✔</span> حسابات للعائلة
            </div>
          </div>

          <div className="pt-6">
            <a
              href="#pricing-card"
              className="px-10 py-4 bg-forest text-white rounded-full font-black text-sm hover:bg-orange shadow-lg shadow-forest/15 hover:scale-105 active:scale-95 transition-all duration-300 inline-block"
            >
              ابدأ الآن
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 2: Main Pricing Card */}
      <section id="pricing-card" className="py-12 px-6 md:px-12 bg-white relative">
        <div className="max-w-xl mx-auto">

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#fbfdf7] rounded-[3rem] p-6 md:p-10 border-2 border-forest/30 shadow-2xl relative overflow-hidden text-center group hover:border-forest/60 transition-all duration-500"
          >
            {/* Top Tag */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-forest text-white text-[10px] font-black px-6 py-2 rounded-b-2xl uppercase tracking-wider">
              الباقة الأكثر اختياراً
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-forest">الباقة الأساسية</h2>

              <div className="py-4">
                <span className="text-5xl md:text-6xl font-black text-forest">٥٠٠ جنيه</span>
                <span className="text-xs font-black text-forest/50 block mt-2">شهرياً</span>
              </div>

              <p className="text-xs text-forest/70 max-w-md mx-auto font-medium leading-relaxed">
                تشمل باقة المتابعة المتكاملة والربط الطبي مع الطبيب المعالج والذكاء الاصطناعي.
              </p>

              <div className="border-t border-dashed border-forest/10 pt-8 text-right">
                <h4 className="text-sm font-black text-forest mb-4">مميزات الباقة الأساسية:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "حساب رئيسي للأب أو الأم",
                    "خطة غذائية علاجية مخصصة",
                    "متابعة مستمرة للوزن والتقدم",
                    "متابعة القياسات والماكروز",
                    "تتبع استهلاك المياه اليومي",
                    "تقارير صحية دورية شاملة",
                    "مستشار الذكاء الاصطناعي 24/7",
                    "المدونة والمقالات الحصرية",
                    "الفعاليات وصالونات الحوار",
                    "الدعم الفني المباشر",
                    "إمكانية إضافة أفراد للعائلة"
                  ].map((feat, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs font-bold text-forest/80">
                      <span className="text-emerald-600 font-bold">✔</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <a
                  href="/#download"
                  className="w-full md:w-auto px-16 py-5 text-base md:text-lg bg-forest text-white rounded-full font-black hover:bg-orange shadow-xl shadow-forest/15 hover:scale-105 active:scale-95 transition-all duration-300 inline-block text-center"
                >
                  تحميل التطبيق الآن
                </a>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* SECTION 4: Comparison Table */}
      <section className="py-24 px-6 md:px-12 bg-white relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">ماذا ستحصل عليه؟</h2>
            <p className="text-base text-forest/70">مقارنة شاملة لخصائص الحساب الرئيسي والحسابات الفرعية.</p>
          </div>

          <div className="border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-lg bg-[#fbfdf7]">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-forest text-white text-xs font-black">
                  <th className="p-5 font-black">الميزة</th>
                  <th className="p-5 text-center font-black">الحساب الرئيسي</th>
                  <th className="p-5 text-center font-black">الحساب الفرعي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-forest">
                {comparisons.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-white transition-colors">
                    <td className="p-5 font-black">{comp.name}</td>
                    <td className="p-5 text-center">
                      {comp.main ? <span className="text-emerald-500 font-bold text-lg">✔</span> : <span className="text-red-500 font-bold text-lg">✘</span>}
                    </td>
                    <td className="p-5 text-center">
                      {comp.sub ? <span className="text-emerald-500 font-bold text-lg">✔</span> : <span className="text-red-500 font-bold text-lg">✘</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5: Why Families Choose Healix */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7] border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-orange font-bold text-xs block">لماذا تختار الأسر هيليكس؟</span>
            <h2 className="text-3xl md:text-5xl font-black text-forest">منصة مصممة للعائلة</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

            {/* Card 1 */}
            <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-3 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-black text-forest">أسرة واحدة</h3>
              <p className="text-[11px] text-forest/70 leading-relaxed font-bold">ربط وإدارة حسابات جميع أفراد العائلة في نظام دفع واشتراك موحد ومريح.</p>
            </motion.div>

            {/* Card 2 */}
            <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-3 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <Smartphone size={20} />
              </div>
              <h3 className="text-sm font-black text-forest">عدة حسابات مستقلة</h3>
              <p className="text-[11px] text-forest/70 leading-relaxed font-bold">كل فرد من أفراد الأسرة له واجهة خاصة لتسجيل طعامه وتتبع عاداته اليومية.</p>
            </motion.div>

            {/* Card 3 */}
            <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-3 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <Shield size={20} />
              </div>
              <h3 className="text-sm font-black text-forest">خصوصية كاملة</h3>
              <p className="text-[11px] text-forest/70 leading-relaxed font-bold">سجلاتك الطبية وبياناتك محمية بالكامل ولا تظهر للآخرين إلا بموافقتك.</p>
            </motion.div>

            {/* Card 4 */}
            <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-3 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <Activity size={20} />
              </div>
              <h3 className="text-sm font-black text-forest">تقارير منفصلة</h3>
              <p className="text-[11px] text-forest/70 leading-relaxed font-bold">متابعة دقيقة وتحاليل دم دورية وقياسات منفصلة لكل حساب فرعي عائلي.</p>
            </motion.div>

            {/* Card 5 */}
            <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-3 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <CheckCircle size={20} />
              </div>
              <h3 className="text-sm font-black text-forest">سهولة الإدارة</h3>
              <p className="text-[11px] text-forest/70 leading-relaxed font-bold">تحكم بسيط للأب أو الأم لإضافة حسابات الأولاد ومتابعة مدى التزامهم الصحي.</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ Accordion */}
      <section className="py-24 px-6 md:px-12 bg-white border-t border-gray-100">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <HelpCircle className="text-orange mx-auto" size={32} />
            <h2 className="text-3xl md:text-5xl font-black text-forest">الأسئلة الشائعة</h2>
            <p className="text-base text-forest/70 font-medium">إجابات شاملة لجميع استفساراتك حول الباقات والاشتراكات العائلية.</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="bg-[#fbfdf7] rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-right font-black text-base md:text-lg flex justify-between items-center text-forest hover:text-orange transition-colors focus:outline-none"
                >
                  <span>{item.q}</span>
                  <div className={`p-1.5 rounded-full transition-colors ${openFaq === idx ? 'bg-orange text-white' : 'bg-white text-forest'}`}>
                    {openFaq === idx ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>

                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="p-6 pt-0 text-xs md:text-sm text-forest/70 font-bold leading-relaxed border-t border-dashed border-gray-100 mt-2">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Final CTA */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-forest to-[#003828] text-white rounded-[3.5rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-emerald-700/30 rounded-full filter blur-3xl z-0" />

          <div className="max-w-3xl mx-auto space-y-8 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-black leading-[1.6]">ابدأ رحلة حياة صحية لكل أفراد أسرتك</h2>
            <p className="text-base text-white/80 font-medium leading-relaxed max-w-2xl mx-auto">
              Healix لا تقدم نظاماً غذائياً فقط... بل تساعد عائلتك على بناء أسلوب حياة صحي يدوم.
            </p>
            <div className="pt-4">
              <a href="/#download" className="px-16 py-5 bg-orange text-white rounded-full font-black text-lg md:text-xl hover:bg-white hover:text-forest hover:scale-105 active:scale-95 transition-all duration-300 inline-block shadow-2xl shadow-orange/20">
                تحميل التطبيق الآن
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PricingPage;