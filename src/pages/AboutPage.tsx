import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Check, X, ArrowLeft, Heart, Sparkles, Brain, 
  Users, Activity, Lock, CheckCircle, Database, 
  Award as Ribbon
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: "easeOut" as const }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: { once: true, margin: "-100px" }
  };

  return (
    <div className="bg-[#fbfdf7] text-forest min-h-screen pt-24 overflow-x-hidden font-thmanyah selection:bg-forest selection:text-white" dir="rtl">
      
      {/* 1. Hero Section */}
      <section className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-[#f5f8f2] to-[#fbfdf7]">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-10 left-10 w-96 h-96 bg-sage/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-emerald-100/30 rounded-full filter blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center relative z-10">
          <div className="md:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
              <Sparkles size={12} className="text-orange" />
              <span>هيليكس للصحة الذكية</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-forest leading-[1.1] tracking-tight">
              من أجل حياة صحية...
              <br />
              <span className="bg-gradient-to-r from-forest to-emerald-700 bg-clip-text text-transparent font-black">أسهل، أذكى، وأكثر استدامة.</span>
            </h1>

            <p className="text-lg md:text-xl text-forest/70 font-medium leading-relaxed max-w-2xl">
              هيليكس ليست مجرد تطبيق لتصميم الوجبات الغذائية أو حساب السعرات الحرارية. نحن منظومة صحية متكاملة مدعومة بالذكاء الاصطناعي الفائق وتحت إشراف طبي كامل بنسبة 100٪، مصممة خصيصاً لترقية جودة حياتك وحياة عائلتك.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/signup" className="px-8 py-4 bg-forest text-white rounded-full font-black text-sm hover:bg-orange shadow-lg shadow-forest/15 hover:scale-105 active:scale-95 transition-all duration-300">
                ابدأ رحلتك اليوم
              </Link>
              <a href="#how-it-works" className="px-8 py-4 bg-forest/5 hover:bg-forest/10 border border-forest/10 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all duration-300">
                شاهد كيف نعمل
              </a>
            </div>
          </div>

          {/* Floating UI Elements Side */}
          <div className="md:col-span-5 relative flex justify-center items-center h-[400px]">
            {/* Background Glow */}
            <div className="absolute w-72 h-72 bg-emerald-100 rounded-full filter blur-2xl z-0" />
            
            {/* UI Card 1: Family Dashboard */}
            <motion.div 
              initial={{ opacity: 0, y: 40, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-4 right-4 w-72 bg-white rounded-3xl p-5 shadow-xl border border-gray-100 z-20 hover:scale-[1.03] transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-400">حساب العائلة المشترك</span>
                <Users size={16} className="text-forest" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">أب</div>
                    <div className="text-right">
                      <p className="text-[11px] font-black">محمد (الأب)</p>
                      <p className="text-[9px] text-gray-400">معدل التزام 94%</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center text-xs font-black">أم</div>
                    <div className="text-right">
                      <p className="text-[11px] font-black">سارة (الأم)</p>
                      <p className="text-[9px] text-gray-400">معدل التزام 98%</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
              </div>
            </motion.div>

            {/* UI Card 2: AI Health Agent */}
            <motion.div 
              initial={{ opacity: 0, y: -40, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 3 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute bottom-6 left-4 w-80 bg-forest text-white rounded-3xl p-5 shadow-2xl z-10 hover:scale-[1.03] transition-transform"
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-orange" />
                <span className="text-[10px] font-black text-white/70">تحليل الذكاء الاصطناعي من Healix</span>
              </div>
              <p className="text-xs font-bold leading-relaxed text-right mb-3">
                "بناءً على نتائج تحليل فيتامين د الأخير، قمنا بزيادة الدهون الصحية في الفطور لتسهيل امتصاص الفيتامين."
              </p>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-orange rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Our Story Section */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 bg-white relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">قصتنا وبدايتنا</h2>
            <p className="text-base text-forest/70 max-w-2xl mx-auto font-medium">
              كيف ولدت فكرة هيليكس لتسد الفجوة الكبيرة في عالم الرعاية الصحية والتغذية المخصصة.
            </p>
          </div>

          {/* Timeline Layout */}
          <div className="relative border-r border-gray-100 pr-8 mr-4 space-y-16">
            
            {/* Timeline Item 1: Problem */}
            <motion.div {...fadeInUp} className="relative">
              <div className="absolute right-[-41px] top-1.5 w-6 h-6 rounded-full bg-red-100 border-4 border-white flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="bg-red-50/20 border border-red-100/50 rounded-3xl p-8 hover:shadow-md transition-shadow">
                <span className="text-xs font-black text-red-500 mb-2 block">المشكلة والدافع</span>
                <h3 className="text-xl md:text-2xl font-black text-forest mb-4">فشل الأنظمة التقليدية وحساب السعرات السطحي</h3>
                <p className="text-sm md:text-base text-forest/80 font-medium leading-relaxed">
                  الغالبية العظمى من تطبيقات التغذية والصحة المتوفرة حالياً تركز فقط على كميات الطعام وتصميم وجبات جامدة. إنها تتجاهل تماماً التاريخ المرضي للفرد، نتائج تحاليل الدم المعملية، نمط التزام عائلته، والمتابعة الطبية المستمرة. هذا يؤدي إلى إحباط المشتركين والتخلي عن الأنظمة في وقت قصير.
                </p>
              </div>
            </motion.div>

            {/* Timeline Item 2: The Solution */}
            <motion.div {...fadeInUp} className="relative">
              <div className="absolute right-[-41px] top-1.5 w-6 h-6 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-3xl p-8 hover:shadow-md transition-shadow">
                <span className="text-xs font-black text-forest mb-2 block">التأسيس والحل</span>
                <h3 className="text-xl md:text-2xl font-black text-forest mb-4">نشأة هيليكس: المنظومة الصحية الشاملة</h3>
                <p className="text-sm md:text-base text-forest/80 font-medium leading-relaxed">
                  تأسست هيليكس لإلغاء هذا التجزؤ. لقد جمعنا بين قوة التكنولوجيا المتقدمة ممثلة في محرك ذكاء اصطناعي فائق، والخبرة الطبية والإنسانية للأطباء ومستشاري التغذية. من خلال دمج التحاليل الطبية والملفات الصحية لعائلتك في مكان واحد، أصبح بإمكاننا تصميم برامج حياة مخصصة 100% تدوم للأبد.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Vision Section */}
      <section className="py-24 px-6 md:px-12 bg-forest text-white relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <motion.div {...fadeInUp} className="inline-flex p-3 bg-white/10 rounded-2xl">
            <Heart size={32} className="text-orange" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-black leading-tight max-w-3xl mx-auto"
          >
            "رؤيتنا أن تصبح هيليكس المنصة الصحية الأولى التي تعتمد عليها كل أسرة عربية للوقاية وتطوير جودة الحياة."
          </motion.h2>
          <div className="w-20 h-1 bg-orange mx-auto rounded-full" />
        </div>
      </section>

      {/* 4. Mission Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            
            <div className="md:col-span-5 space-y-6 text-right">
              <h2 className="text-3xl md:text-5xl font-black text-forest">رسالتنا وقيمنا التأسيسية</h2>
              <p className="text-base text-forest/70 font-medium leading-relaxed">
                نحن هنا لإعادة تعريف نمط الحياة الصحي. رسالتنا واضحة وتدفع كل سطر برمجي نكتبه وكل مكالمة استشارية يقوم بها أطباؤنا.
              </p>
              <div className="border-t border-forest/10 pt-6">
                <p className="text-xs font-black text-forest/50">أولوية هيليكس:</p>
                <p className="text-sm font-black text-orange mt-1">الوقاية الطبية الذكية والتغذية المبنية على الدليل</p>
              </div>
            </div>

            <div className="md:col-span-7 grid sm:grid-cols-2 gap-6">
              
              {/* Mission Card 1 */}
              <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle className="text-forest mb-4" size={24} />
                <h3 className="text-lg font-black mb-2">تبسيط النمط الصحي</h3>
                <p className="text-xs text-forest/70 font-bold leading-relaxed">
                  نجعل تناول الطعام الصحي والتمرين ممتعاً وخالياً من التعقيد للمشتركين وعائلاتهم.
                </p>
              </motion.div>

              {/* Mission Card 2 */}
              <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <Brain className="text-forest mb-4" size={24} />
                <h3 className="text-lg font-black mb-2">ربط العلم بالتكنولوجيا</h3>
                <p className="text-xs text-forest/70 font-bold leading-relaxed">
                  نصنع حلقة ربط فورية بين أحدث خوارزميات الذكاء الاصطناعي وخبرات الاستشاريين الأطباء.
                </p>
              </motion.div>

              {/* Mission Card 3 */}
              <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <Users className="text-forest mb-4" size={24} />
                <h3 className="text-lg font-black mb-2">تمكين الأسرة كاملة</h3>
                <p className="text-xs text-forest/70 font-bold leading-relaxed">
                  نؤمن أن صحة الفرد تبدأ من بيته، لذا نصمم حسابات عائلية متكاملة ترعى الصغار والكبار معاً.
                </p>
              </motion.div>

              {/* Mission Card 4 */}
              <motion.div {...fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <Activity className="text-forest mb-4" size={24} />
                <h3 className="text-lg font-black mb-2">الاستدامة طويلة الأمد</h3>
                <p className="text-xs text-forest/70 font-bold leading-relaxed">
                  لا نصمم خططاً طارئة أو مؤقتة، بل نهدف إلى إعادة بناء العادات الصحية لتدوم مدى الحياة.
                </p>
              </motion.div>

            </div>

          </div>
        </div>
      </section>

      {/* 5. Our Philosophy */}
      <section className="py-24 px-6 md:px-12 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">فلسفتنا في الرعاية</h2>
            <p className="text-base text-forest/70 max-w-2xl mx-auto font-medium">
              الركائز الأساسية التي نبني عليها كل قرار صحي داخل منصة هيليكس.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Philosophy Card 1 */}
            <motion.div variants={fadeInUp} className="bg-[#fbfdf7] rounded-[2rem] p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange mb-2 block">٠١</span>
              <h3 className="text-xl font-black mb-4">الصحة أسلوب حياة</h3>
              <p className="text-sm text-forest/70 font-medium leading-relaxed">
                الصحة لا تُقاس بالحرمان أو فترات الجوع المؤقتة، بل بمستوى طاقتك اليومي، وجودة نومك، وراحة جهازك الهضمي واستدامة عاداتك.
              </p>
            </motion.div>

            {/* Philosophy Card 2 */}
            <motion.div variants={fadeInUp} className="bg-[#fbfdf7] rounded-[2rem] p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange mb-2 block">٠٢</span>
              <h3 className="text-xl font-black mb-4">الالوقاية أفضل من العلاج</h3>
              <p className="text-sm text-forest/70 font-medium leading-relaxed">
                قراءة تحاليلك الطبية ومتابعة مؤشراتك الحيوية بشكل استباقي يمنحك القوة لتلافي المشاكل الصحية قبل حدوثها أو تفاقمها.
              </p>
            </motion.div>

            {/* Philosophy Card 3 */}
            <motion.div variants={fadeInUp} className="bg-[#fbfdf7] rounded-[2rem] p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange mb-2 block">٠٣</span>
              <h3 className="text-xl font-black mb-4">البيانات تصنع قرارات أفضل</h3>
              <p className="text-sm text-forest/70 font-medium leading-relaxed">
                لا نعتمد على الحدس أو الخطط العامة. كل تفصيل في نظامك الغذائي والرياضي مبني على بياناتك الطبية وتفضيلاتك الشخصية.
              </p>
            </motion.div>

            {/* Philosophy Card 4 */}
            <motion.div variants={fadeInUp} className="bg-[#fbfdf7] rounded-[2rem] p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange mb-2 block">٠٤</span>
              <h3 className="text-xl font-black mb-4">كل فرد مختلف</h3>
              <p className="text-sm text-forest/70 font-medium leading-relaxed">
                النظام الذي ينجح مع صديقك قد يضرك. جيناتك، نمط حياتك، وهرموناتك متفردة، وخطتك العلاجية يجب أن تكون فريدة كذلك.
              </p>
            </motion.div>

            {/* Philosophy Card 5 */}
            <motion.div variants={fadeInUp} className="bg-[#fbfdf7] rounded-[2rem] p-8 border border-gray-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange mb-2 block">٠٥</span>
              <h3 className="text-xl font-black mb-4">العائلة تبدأ من شخص واحد</h3>
              <p className="text-sm text-forest/70 font-medium leading-relaxed">
                عندما يتغير شخص واحد في البيت نحو نمط حياة صحي أفضل، فإنه يلهم عائلته كاملة ويصنع مستقبلاً صحياً للأجيال القادمة.
              </p>
            </motion.div>

            {/* Philosophy Card 6 */}
            <motion.div variants={fadeInUp} className="bg-forest text-white rounded-[2rem] p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
              <h3 className="text-2xl font-black leading-tight">هيليكس.. شريكك الصحي الدائم.</h3>
              <Link to="/signup" className="flex items-center gap-2 text-orange text-sm font-black hover:text-white transition-colors mt-8">
                اشترك الآن وابدأ رحلتك
                <ArrowLeft size={16} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. Why Healix is Different */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">لماذا تختلف هيليكس؟</h2>
            <p className="text-base text-forest/70 max-w-2xl mx-auto font-medium">
              مقارنة واضحة بين تطبيقات الأنظمة الغذائية العادية والحل المتكامل الذي تقدمه هيليكس.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            
            {/* Left: Traditional Apps */}
            <div className="bg-gray-100/50 rounded-3xl p-8 border border-gray-200/50 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                  <X size={20} />
                </div>
                <h3 className="text-lg font-black text-gray-500">برامج التغذية التقليدية</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 border-b border-gray-200/50 pb-4">
                  <span className="text-red-500 text-sm font-black mt-0.5">✕</span>
                  <div>
                    <h4 className="text-sm font-black text-forest">جدول وجبات فقط (Meal Plan only)</h4>
                    <p className="text-xs text-forest/60 mt-1">توليد تلقائي لنظام موحد دون مراعاة لحالتك الفردية.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-b border-gray-200/50 pb-4">
                  <span className="text-red-500 text-sm font-black mt-0.5">✕</span>
                  <div>
                    <h4 className="text-sm font-black text-forest">غياب المتابعة (No Follow-up)</h4>
                    <p className="text-xs text-forest/60 mt-1">لا يوجد طبيب حقيقي يراجع تحاليلك أو يراقب تطور حالتك.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-b border-gray-200/50 pb-4">
                  <span className="text-red-500 text-sm font-black mt-0.5">✕</span>
                  <div>
                    <h4 className="text-sm font-black text-forest">لا دعم للعائلة (No Family Support)</h4>
                    <p className="text-xs text-forest/60 mt-1">يجب على كل فرد في عائلتك التسجيل بشكل مستقل وبسعر كامل.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-4">
                  <span className="text-red-500 text-sm font-black mt-0.5">✕</span>
                  <div>
                    <h4 className="text-sm font-black text-forest">لا تحليل للمختبر (No Lab Analysis)</h4>
                    <p className="text-xs text-forest/60 mt-1">لا يعبأ النظام بوجود مشاكل سمنة، ضغط، أو اضطرابات هرمونية مخبرية.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Healix */}
            <div className="bg-forest text-white rounded-3xl p-8 border border-forest/10 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full filter blur-xl" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-orange">
                  <Check size={20} />
                </div>
                <h3 className="text-lg font-black text-white">منصة هيليكس المتكاملة</h3>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-3 border-b border-white/10 pb-4">
                  <span className="text-orange text-sm font-black mt-0.5">✓</span>
                  <div>
                    <h4 className="text-sm font-black text-white">الملف الطبي الشامل (Medical Profile)</h4>
                    <p className="text-xs text-white/60 mt-1">تحديد حالتك بناءً على تاريخك الطبي وتحاليل الدم المخبرية.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-b border-white/10 pb-4">
                  <span className="text-orange text-sm font-black mt-0.5">✓</span>
                  <div>
                    <h4 className="text-sm font-black text-white">طبيب + ذكاء اصطناعي (Doctor + AI)</h4>
                    <p className="text-xs text-white/60 mt-1">تنسيق كامل بين التحليل الآلي الفوري وإشراف الطبيب البشري المعالج.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-b border-white/10 pb-4">
                  <span className="text-orange text-sm font-black mt-0.5">✓</span>
                  <div>
                    <h4 className="text-sm font-black text-white">حسابات عائلية (Family Accounts)</h4>
                    <p className="text-xs text-white/60 mt-1">حساب واحد للتحكم بصحة عائلتك وأطفالك ومراقبة التزامهم معاً.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-4">
                  <span className="text-orange text-sm font-black mt-0.5">✓</span>
                  <div>
                    <h4 className="text-sm font-black text-white">تحليل معملي ذكي (AI Analysis)</h4>
                    <p className="text-xs text-white/60 mt-1">قراءة دقيقة لنتائج الدم والتحاليل وربطها الفوري بنوعية التغذية والمكملات.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Healix Journey Section */}
      <section className="py-24 px-6 md:px-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">رحلة المشترك في هيليكس</h2>
            <p className="text-base text-forest/70 max-w-2xl mx-auto font-medium">
              الخطوات المنظمة والذكية لبناء خطتك الصحية الشخصية.
            </p>
          </div>

          {/* Horizontal Journey Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-9 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow relative">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">١</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">الملف الطبي</h4>
                <p className="text-[10px] text-forest/60 mt-1">تسجيل تاريخك الصحي والوراثي بدقة.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">٢</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">رفع التحاليل</h4>
                <p className="text-[10px] text-forest/60 mt-1">إرفاق تقارير الدم والفحوصات الأخيرة.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">٣</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">تحليل الذكاء الاصطناعي</h4>
                <p className="text-[10px] text-forest/60 mt-1">تحديد مؤشرات النقص والاحتياجات فوراً.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">٤</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">مراجعة الطبيب</h4>
                <p className="text-[10px] text-forest/60 mt-1">تدقيق البيانات والتحاليل من الطبيب البشري.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">٥</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">الخطة الغذائية</h4>
                <p className="text-[10px] text-forest/60 mt-1">تصميم جدول التغذية والتمارين المخصص.</p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">٦</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">لوحة التحكم اليومية</h4>
                <p className="text-[10px] text-forest/60 mt-1">متابعة وجباتك ومهام التزامك اليومية.</p>
              </div>
            </div>

            {/* Step 7 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">٧</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">المتابعة الطبية</h4>
                <p className="text-[10px] text-forest/60 mt-1">تواصل مستمر وتعديل النظام عند الحاجة.</p>
              </div>
            </div>

            {/* Step 8 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-6 border border-gray-100 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">٨</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">حساب العائلة</h4>
                <p className="text-[10px] text-forest/60 mt-1">إضافة أفراد العائلة لنفس منصة المراقبة.</p>
              </div>
            </div>

            {/* Step 9 */}
            <div className="bg-forest text-white rounded-3xl p-6 flex flex-col justify-between min-h-[180px] shadow-lg">
              <span className="w-8 h-8 rounded-full bg-white text-forest flex items-center justify-center text-xs font-black">٩</span>
              <div className="mt-4">
                <h4 className="text-sm font-black">أسلوب حياة صحي</h4>
                <p className="text-[10px] text-white/70 mt-1">بلوغ مرحلة الالتزام الذاتي الدائم لمدى طويل.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Numbers Section */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-r from-forest to-[#003828] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          
          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-black text-orange">١٠٠٪</h3>
            <p className="text-sm text-white/80 font-black">أنظمة وخطط مخصصة</p>
            <p className="text-[10px] text-white/50">تعتمد بالكامل على تحاليلك وتفضيلاتك</p>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-black text-orange">٢٤/٧</h3>
            <p className="text-sm text-white/80 font-black">مراقبة صحية ذكية</p>
            <p className="text-[10px] text-white/50">متابعة فورية للمؤشرات الحيوية والغذائية</p>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-black text-orange">لا محدود</h3>
            <p className="text-sm text-white/80 font-black">متابعة طبية مباشرة</p>
            <p className="text-[10px] text-white/50">تواصل مباشر مع الطبيب والاستشاري بأي وقت</p>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-5xl md:text-6xl font-black text-orange">أسرة واحدة</h3>
            <p className="text-sm text-white/80 font-black">منصة صحة العائلة</p>
            <p className="text-[10px] text-white/50">لوحة واحدة تجمع كافة الأجيال والأبناء</p>
          </div>

        </div>
      </section>

      {/* 9. Our Values Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">قيمنا الجوهرية</h2>
            <p className="text-base text-forest/70 max-w-2xl mx-auto font-medium">
              الأسس التي نوجه بها تصرفاتنا اليومية وندير بها علاقتنا مع عملائنا.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Value 1 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <Shield size={20} />
              </div>
              <h4 className="text-base font-black text-forest">الموثوقية</h4>
              <p className="text-xs text-forest/60 font-bold leading-relaxed">خطط علاجية وغذائية مبنية على حقائق علمية ودلائل معملية راسخة.</p>
            </div>

            {/* Value 2 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <Lock size={20} />
              </div>
              <h4 className="text-base font-black text-forest">الخصوصية التامة</h4>
              <p className="text-xs text-forest/60 font-bold leading-relaxed">بياناتك الطبية مشفرة ومحمية بالكامل، ولا يتم مشاركتها أو بيعها لأي جهة.</p>
            </div>

            {/* Value 3 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <CheckCircle size={20} />
              </div>
              <h4 className="text-base font-black text-forest">الدقة الطبية</h4>
              <p className="text-xs text-forest/60 font-bold leading-relaxed">نظام فحص دقيق للوجبات والتحاليل لضمان الجودة والسلامة الطبية.</p>
            </div>

            {/* Value 4 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-right space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-forest/5 flex items-center justify-center text-forest">
                <Sparkles size={20} />
              </div>
              <h4 className="text-base font-black text-forest">الابتكار والالتزام</h4>
              <p className="text-xs text-forest/60 font-bold leading-relaxed">تطوير خوارزميات ذكية لتسهيل المتابعة، والالتزام بالشفافية المطلقة.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 10. Technology Section */}
      <section className="py-24 px-6 md:px-12 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">التكنولوجيا والعلوم في هيليكس</h2>
            <p className="text-base text-forest/70 max-w-2xl mx-auto font-medium">
              كيف ندمج بين التكنولوجيا السحابية المتقدمة، والذكاء الاصطناعي، والعلوم الطبية الحديثة.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Tech Card 1 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-8 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center">
                <Brain size={24} />
              </div>
              <h3 className="text-lg font-black">الذكاء الاصطناعي (AI)</h3>
              <p className="text-xs text-forest/70 font-bold leading-relaxed">
                محرك ذكاء اصطناعي يقوم بتحليل مؤشرات تحاليل الدم وتوقع معدلات النقص في الفيتامينات والمعادن، واقتراح تعديلات فورية للنظام الغذائي.
              </p>
            </div>

            {/* Tech Card 2 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-8 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center">
                <Database size={24} />
              </div>
              <h3 className="text-lg font-black">البنية السحابية الآمنة</h3>
              <p className="text-xs text-forest/70 font-bold leading-relaxed">
                أنظمة قواعد بيانات سحابية متقدمة تضمن حفظ وتصنيف سجلات عائلتك الطبية والغذائية مع سرعة فائقة في استدعاء وتحديث البيانات.
              </p>
            </div>

            {/* Tech Card 3 */}
            <div className="bg-[#fbfdf7] rounded-3xl p-8 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center">
                <Activity size={24} />
              </div>
              <h3 className="text-lg font-black">علوم السلوك والتغذية</h3>
              <p className="text-xs text-forest/70 font-bold leading-relaxed">
                تطبيق استراتيجيات علم النفس السلوكي المتقدمة لمساعدتك على الالتزام وتخطي تحديات الرغبة الشديدة في السكريات وبناء عادات مستدامة.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 11. Privacy & Security */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7] relative">
        <div className="max-w-5xl mx-auto bg-forest text-white rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-12 items-center">
          <div className="absolute top-[-20%] right-[-10%] w-[30rem] h-[30rem] bg-emerald-700/30 rounded-full filter blur-3xl z-0" />
          
          <div className="md:w-7/12 space-y-6 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange">
              <Lock size={24} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black">بياناتك الطبية مشفرة ومحمية بالكامل</h2>
            <p className="text-sm text-white/80 font-bold leading-relaxed">
              في هيليكس، نضع أمان معلوماتك الصحية والخاصة في مقدمة أولوياتنا. نطبق أفضل معايير التشفير والامتثال الطبية لضمان سلامة بياناتك وخصوصيتها بنسبة 100%.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs font-black text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-orange">✓</span> بيانات مشفرة بالكامل
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange">✓</span> سحابة طبية محمية
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange">✓</span> خصوصية مطلقة للأسرة
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange">✓</span> ملكية كاملة لبياناتك
              </div>
            </div>
          </div>

          <div className="md:w-5/12 relative z-10 flex justify-center">
            {/* Visual Security Panel */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-6 w-72 space-y-4 text-right shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-emerald-300">حالة تشفير الخادم</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="bg-white/5 p-3 rounded-2xl space-y-1.5">
                <p className="text-[10px] text-white/50">تشفير البيانات الطبية</p>
                <p className="text-xs font-black">AES-256 Bit Encryption</p>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl space-y-1.5">
                <p className="text-[10px] text-white/50">سياسة مشاركة البيانات</p>
                <p className="text-xs font-black text-orange">ممنوع البيع أو المشاركة نهائياً</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 12. Meet Healix / App Showcase */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-forest">شاشات منصة هيليكس</h2>
            <p className="text-base text-forest/70 max-w-2xl mx-auto font-medium">
              استكشف واجهة المنظومة الصحية المتكاملة التي تدير بها صحتك وصحة عائلتك يومياً.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Panel 1: Dashboard */}
            <div className="bg-[#fbfdf7] rounded-[2.5rem] p-6 border border-gray-100 space-y-6 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange">الواجهة الرئيسية</span>
              <h3 className="text-xl font-black">لوحة التحكم اليومية (Dashboard)</h3>
              <p className="text-xs text-forest/70 font-bold leading-relaxed">
                متابعة المهام، الالتزام، شرب الماء، الوجبات المقررة لليوم بشكل منظم وبسيط.
              </p>
              
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-[10px] font-black">الفطور المجدول</span>
                  <span className="text-[9px] bg-emerald-50 text-forest px-2 py-0.5 rounded-full font-black">تم تناولها</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black">شرب الماء (٣ لتر)</span>
                  <span className="text-[9px] bg-orange/5 text-orange px-2 py-0.5 rounded-full font-black">جاري التقدم</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Nutrition Plan */}
            <div className="bg-[#fbfdf7] rounded-[2.5rem] p-6 border border-gray-100 space-y-6 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange">الخطة التغذوية</span>
              <h3 className="text-xl font-black">جدول التغذية والوصفات (Nutrition Plan)</h3>
              <p className="text-xs text-forest/70 font-bold leading-relaxed">
                تصفح ووصفات الوجبات المصممة لتدوم وتحقق أهدافك بناءً على فحص مؤشراتك.
              </p>
              
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-forest rounded-full" />
                </div>
                <div className="flex justify-between text-[9px] font-black">
                  <span>بروتين: ٩٠ غرام</span>
                  <span>كربوهيدرات: ١٢٠ غرام</span>
                  <span>دهون: ٤٥ غرام</span>
                </div>
              </div>
            </div>

            {/* Panel 3: Medical Records */}
            <div className="bg-[#fbfdf7] rounded-[2.5rem] p-6 border border-gray-100 space-y-6 hover:shadow-xl transition-all duration-300">
              <span className="text-xs font-black text-orange">السجلات الطبية</span>
              <h3 className="text-xl font-black">التحاليل والفحوصات الطبية (Medical Records)</h3>
              <p className="text-xs text-forest/70 font-bold leading-relaxed">
                عرض ومقارنة نتائج تحاليل الدم المعملية السابقة ومراقبة تحسن المؤشرات مع الوقت.
              </p>
              
              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span>فيتامين د (Vitamin D)</span>
                  <span className="text-emerald-500">تحسن +٢٤٪</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span>السكر التراكمي (HbA1c)</span>
                  <span className="text-emerald-500">طبيعي 5.2</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 13. Our Promise Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7] relative text-center">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl" />
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <Ribbon size={40} className="text-orange mx-auto" />
          <h2 className="text-4xl md:text-5xl font-black text-forest">نعدك أن تكون صحتك وصحة عائلتك أولوية دائماً</h2>
          <p className="text-base md:text-lg text-forest/70 leading-relaxed font-medium">
            نحن في هيليكس نلتزم بتقديم الرعاية الصحية الأكثر دقة وموثوقية وخصوصية. نعدك بتقديم خطط غذائية ونمط حياة واقعي يسهل الالتزام به ويحقق أفضل النتائج المستدامة لعائلتك دون حرمان أو تعقيد.
          </p>
        </div>
      </section>

      {/* 14. CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-forest to-[#003828] text-white rounded-[3rem] p-8 md:p-16 text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-emerald-700/30 rounded-full filter blur-3xl z-0" />
          
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black leading-tight">ابدأ رحلتك الصحية مع عائلتك اليوم</h2>
            <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed">
              انضم إلى آلاف العائلات العربية التي تثق في هيليكس لإدارة وتوجيه أسلوب حياتها الصحي تحت إشراف طبي كامل.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 relative z-10 pt-4">
            <Link to="/signup" className="px-8 py-4 bg-orange text-white rounded-full font-black text-sm hover:bg-white hover:text-forest hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-orange/15">
              ابدأ الآن مجاناً
            </Link>
            <a href="/#pricing" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all duration-300">
              استكشف باقات الأسرة
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
