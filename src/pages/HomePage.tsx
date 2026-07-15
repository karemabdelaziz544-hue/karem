import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Shield, Check, X, ArrowLeft, Heart, Sparkles, Brain,
  Users, Activity, Lock, CheckCircle, Database, Calendar,
  MapPin, Clock, MessageSquare, ChevronRight, ChevronLeft,
  Plus, Minus, HelpCircle, Award as Ribbon
} from 'lucide-react';
import EventDetailsModal from '../components/EventDetailsModal';

const HEADLINES = [
  { part1: "رحلتك نحو حياة صحية", highlight: "تبدأ بخطوة واحدة." },
  { part1: "هذه المرة...", highlight: "ستستمر." },
  { part1: "كل يوم صغير يصنع", highlight: "تغييراً كبيراً." },
  { part1: "ابدأ اليوم...", highlight: "وسيشكرك جسدك غداً." },
  { part1: "العادات الصغيرة...", highlight: "تصنع نتائج كبيرة." },
  { part1: "معاً تصبح العناية", highlight: "بصحتك أسهل." },
  { part1: "صحتك تستحق", highlight: "بداية مختلفة." },
  { part1: "ليس الهدف أن تبدأ...", highlight: "بل أن تستمر." },
  { part1: "لأن الصحة رحلة...", highlight: "وليست محطة." },
  { part1: "Healix...", highlight: "حياة صحية في كل بيت." },
  { part1: "ابدأ بنفسك...", highlight: "وألهم عائلتك." },
  { part1: "كل بيت يستحق", highlight: "حياة صحية." },
  { part1: "الصحة أجمل", highlight: "عندما نعيشها معاً." }
];

const HomePage: React.FC = () => {
  // Database state
  const [articles, setArticles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [headline, setHeadline] = useState<{ part1: string; highlight: string } | null>(null);

  // AI Chat demo state
  const [activeAiTab, setActiveAiTab] = useState<number>(0);
  const [activeJourneyCard, setActiveJourneyCard] = useState<number>(0);
  const [isJourneyPaused, setIsJourneyPaused] = useState<boolean>(false);
  const journeyCardsContainerRef = useRef<HTMLDivElement>(null);

  // Horizontal Scroll Observer for Journey/Steps cards on mobile viewports
  useEffect(() => {
    const container = journeyCardsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (window.innerWidth >= 768) return; // Only run on mobile
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const containerCenter = scrollLeft + containerWidth / 2;

      let activeIndex = 0;
      let minDistance = Infinity;

      const children = container.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = i;
        }
      }
      setActiveJourneyCard(activeIndex);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Autoplay timer: moves to next card every 4 seconds unless paused
  useEffect(() => {
    if (isJourneyPaused) return;
    const interval = setInterval(() => {
      setActiveJourneyCard((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [isJourneyPaused, activeJourneyCard]);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { sender: 'user', text: 'أهلاً Healix AI، هل أستطيع تناول المكسرات في نظامي الحالي؟' },
    { sender: 'ai', text: 'أهلاً بك! نعم، يمكنك تناول 30 غراماً من المكسرات النيئة (اللوز أو الجوز) كوجبة خفيفة. هي مصدر رائع للدهون الصحية التي تدعم امتصاص فيتامين د لديك.' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Testimonials state
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch articles & events from Supabase
  useEffect(() => {
    // Select a random headline on mount
    const randomIndex = Math.floor(Math.random() * HEADLINES.length);
    setHeadline(HEADLINES[randomIndex]);

    const fetchData = async () => {
      try {
        const { data: dbArticles } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        const { data: dbEvents } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(3);

        if (dbArticles) setArticles(dbArticles);
        if (dbEvents) setEvents(dbEvents);
      } catch (err) {
        console.error('Error fetching homepage database items:', err);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchData();
  }, []);

  // Framer Motion defaults
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: "easeOut" as const }
  };

  const handleAiQuestion = (questionIdx: number) => {
    if (isAiTyping) return;

    const questions = [
      { q: 'هل أستطيع تناول وجبة شاورما دجاج اليوم؟', a: 'نعم، يمكنك استبدال وجبة الغداء بـ 150 غرام من صدر الدجاج المشوي مع خبز بر وملعقة ثوم خفيفة وسلطة. تم إدراجها كوجبة بديلة مطابقة للسعرات والبروتين في تطبيقك!' },
      { q: 'احسب سعراتي لليوم ومعدل التزامي', a: 'معدل التزامك اليومي هو 96٪. متبقي لك 380 سعرة حرارية لتصل للحد المستهدف (1,800 سعرة). نقترح تناول كوب زبادي يوناني مع الفراولة.' },
      { q: 'حلل وجبة الفطور التي قمت بتصويرها', a: 'التحليل البصري للوجبة: بيضتان مسلوقتان مع شريحة توست أسمر ونصف حبة أفوكادو. الوجبة تحتوي على 320 سعرة حرارية، 18غ بروتين، وهي مطابقة تماماً للمخطط الصحي اليومي.' },
      { q: 'راجع نتائج فحص الدم الأخير لي', a: 'تظهر النتائج ارتفاع مستويات الحديد بنسبة 15% مقارنة بالشهر الماضي. نقترح خفض مكملات الحديد تدريجياً والتركيز على مصادرها الطبيعية كما حدد طبيبك المعالج.' }
    ];

    const selected = questions[questionIdx];
    setActiveAiTab(questionIdx);

    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text: selected.q }]);
    setIsAiTyping(true);

    // Simulate AI typing and response
    setTimeout(() => {
      setIsAiTyping(false);
      setChatMessages(prev => [...prev, { sender: 'ai', text: selected.a }]);
    }, 1200);
  };

  const testimonials = [
    {
      name: "أبو أحمد",
      role: "مشترك في باقة العائلة",
      text: "تطبيق هيليكس غير حياة عائلتي بالكامل. استطعت مراقبة صحة أطفالي ونظامهم الغذائي من حسابي، وتحسنت مؤشرات التحاليل الطبية لزوجتي بفضل توجيهات الطبيب الدقيقة ومحرك الذكاء الاصطناعي.",
      stat: "انخفاض الوزن العائلي المشترك بمقدار 24 كجم"
    },
    {
      name: "سارة المهيري",
      role: "مشتركة في باقة التغذية العلاجية",
      text: "كنت أعاني من خمول دائم ونقص شديد في فيتامين د. بعد رفع تحاليلي الطبية ومراجعة الطبيب المعالج، تم تفصيل خطة غذائية متكاملة متوافقة مع قراءات الدم، والآن طاقني ونشاطي أفضل بكثير.",
      stat: "ارتفاع مستويات الطاقة وارتفاع فيتامين د للمستويات الطبيعية"
    },
    {
      name: "م. خالد الحربي",
      role: "مشترك وبطل رياضي",
      text: "أكثر ما يميز هيليكس هو المتابعة الطبية المباشرة وتطبيق الذكاء الاصطناعي الذي يجيبني فوراً عن بدائل الوجبات ويسجل سعراتي بدقة دون الحاجة للبحث اليدوي الطويل.",
      stat: "معدل التزام يومي تفوق على 95٪ لـ 6 أشهر متتالية"
    }
  ];

  const faqs = [
    { q: "ما الذي يجعل هيليكس مختلفة عن تطبيقات حساب السعرات الأخرى؟", a: "تطبيقات السعرات العادية تعطيك أرقاماً جافة فقط. هيليكس تدمج تحاليلك الطبية المخبرية وتاريخك المرضي، ويقوم طبيب معالج حقيقي بمراجعتها وتعديل خطتك بشكل مباشر بالتعاون مع ذكاء اصطناعي فائق يتابع تفاصيل وجباتك وبدائلها على مدار الساعة." },
    { q: "كيف يتم تصميم الخطة الغذائية والرياضية للمشترك؟", a: "بمجرد اشتراكك وإكمال ملفك الطبي، يُطلب منك إرفاق أي تحاليل طبية سابقة. يقوم محرك الذكاء الاصطناعي بقراءة المؤشرات الحيوية، ثم يتولى طبيبك المعالج تصفية وتدقيق الخطة لضمان مواءمتها وملاءمتها بنسبة 100٪ لأهدافك وسلامتك." },
    { q: "هل يمكنني إدارة صحة أطفالي وعائلتي من نفس الحساب؟", a: "نعم تماماً، تدعم هيليكس 'الحسابات العائلية'. كصاحب حساب رئيسي، يمكنك إضافة حسابات تابعة لزوجتك وأطفالك ومتابعة التزامهم اليومي، خطط تغذيتهم، وسجلاتهم الطبية بشكل منفصل ومحمي بالكامل." },
    { q: "هل أحتاج لعمل تحاليل طبية جديدة قبل الاشتراك؟", a: "ليس بالضرورة. يمكنك البدء برفع تحاليلك القديمة (التي لا تتجاوز 6 أشهر)، أو بدء تعبئة ملفك الطبي، وسيقوم طبيبك بتحديد ما إذا كنت تحتاج لعمل فحوصات إضافية محددة لبناء الخطة بدقة." },
    { q: "هل توجد باقات اشتراك مرنة للأفراد والعائلات؟", a: "نعم، نوفر باقات مرنة ومتنوعة تلائم احتياجات الأفراد والأسر الكبيرة والصغيرة، مع خيارات دفع شهرية أو ربع سنوية أو سنوية. (سيتم توفير صفحة أسعار تفصيلية قريباً)." },
    { q: "هل هناك دعم للاستفسارات العاجلة بخصوص الوجبات والبدائل؟", a: "نعم، يمكنك التحدث مباشرة مع محرك الذكاء الاصطناعي (Healix AI Agent) في أي وقت لتعديل الوجبة أو الاستفسار عن المكونات، كما يمكنك ترك رسالة لطبيبك المعالج وسيجيبك في غضون دقائق معدودة." },
    { q: "كيف يتم حماية خصوصية بياناتي الطبية المرفوعة؟", a: "نطبق أفضل معايير الأمان والتشفير العالمية (AES-256) على خوادمنا الطبية المحمية. بياناتك ملكك تماماً ولا نقوم ببيعها أو مشاركتها مع أي طرف ثالث تحت أي ظرف." },
    { q: "هل يحتوي التطبيق على تمارين رياضية بجانب التغذية؟", a: "نعم، تشمل كل خطة مخصصة جدولاً رياضياً مناسباً لمستوى لياقتك وأهدافك البدنية، مع فيديوهات توضيحية تشرح كيفية أداء التمارين بشكل صحيح وآمن لتفادي الإصابات." }
  ];

  return (
    <div className="bg-[#fbfdf7] text-forest min-h-screen pt-20 overflow-x-hidden font-thmanyah selection:bg-forest selection:text-white" dir="rtl">

      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-[#f5f8f2] to-[#fbfdf7]">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-10 left-10 w-96 h-96 bg-sage/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-emerald-100/30 rounded-full filter blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-start relative z-10">

          {/* Right Side: Headline */}
          <div className="md:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
              <Sparkles size={12} className="text-orange" />
              <span>مفهوم جديد للصحة الرقمية</span>
            </div>

            <div className="py-2 md:py-4 overflow-visible">
              <AnimatePresence mode="wait">
                {headline ? (
                  <motion.h1
                    key={headline.highlight}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl md:text-7xl font-extrabold text-forest leading-[1.5] tracking-tight py-4 overflow-visible"
                  >
                    {headline.part1}
                    <br />
                    <span className="bg-gradient-to-r from-forest to-emerald-700 bg-clip-text text-transparent font-black block mt-3 pt-2 pb-6 px-2 overflow-visible leading-[1.6]">
                      {headline.highlight}
                    </span>
                  </motion.h1>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* Left Side: Subtitle / Description & Action Buttons */}
          <div className="md:col-span-5 space-y-6 text-right md:pt-16">
            <p className="text-lg md:text-xl text-forest/70 font-medium leading-relaxed">
              هيليكس هي منصة صحية ذكية متكاملة تجمع بين أنظمة التغذية العلاجية، الذكاء الاصطناعي، المتابعة الطبية المباشرة، إدارة صحة العائلة، وتحليلات المختبر الدقيقة لمساعدتك على بلوغ نمط حياة صحي دائم.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/signup" className="px-8 py-4 bg-forest text-white rounded-full font-black text-sm hover:bg-orange shadow-lg shadow-forest/15 hover:scale-105 active:scale-95 transition-all duration-300">
                ابدأ رحلتك الآن
              </Link>
              <a href="#journey" className="px-8 py-4 bg-forest/5 hover:bg-forest/10 border border-forest/10 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all duration-300">
                شاهد كيف نعمل
              </a>
            </div>
          </div>

          {/* Full Width Bottom: Statistics (Trust Data) */}
          <div className="md:col-span-12 mt-6 w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              {/* Stat 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/40 backdrop-blur-sm border border-forest/5 rounded-[2rem] p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-3xl md:text-4xl font-black text-forest">١٥,٠٠٠+</h3>
                <p className="text-[11px] md:text-xs text-forest/60 font-black">مستخدم نشط بالمنصة</p>
              </motion.div>

              {/* Stat 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/40 backdrop-blur-sm border border-forest/5 rounded-[2rem] p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-3xl md:text-4xl font-black text-forest">٢٥٠+</h3>
                <p className="text-[11px] md:text-xs text-forest/60 font-black">طبيب وأخصائي معتمد</p>
              </motion.div>

              {/* Stat 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white/40 backdrop-blur-sm border border-forest/5 rounded-[2rem] p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-3xl md:text-4xl font-black text-forest">٩٦٪</h3>
                <p className="text-[11px] md:text-xs text-forest/60 font-black">معدل رضا المشتركين</p>
              </motion.div>

              {/* Stat 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white/40 backdrop-blur-sm border border-forest/5 rounded-[2rem] p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-3xl md:text-4xl font-black text-forest">٤٠,٠٠٠+</h3>
                <p className="text-[11px] md:text-xs text-forest/60 font-black">استشارة طبية ناجحة</p>
              </motion.div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. Why Healix Section */}
      <section className="relative py-24 pb-36 px-6 md:px-12 bg-gradient-to-b from-[#fbfdf7] via-[#f7faf4] to-[#fbfdf7] overflow-hidden">

        {/* Soft Background Glows only - No background line SVG */}
        <div className="absolute top-12 right-[-10%] w-96 h-96 bg-sage/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 left-[-10%] w-[30rem] h-[30rem] bg-emerald-100/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Centered Headline Container with negative margin to sit "inside" the U-shape valley */}
          <div className="text-center space-y-6 max-w-3xl mx-auto -mb-16 md:-mb-24 relative z-20">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-black text-forest leading-[1.35] py-1.5"
            >
              لماذا تختلف <span className="bg-gradient-to-r from-forest to-emerald-700 bg-clip-text text-transparent font-black">هيليكس؟</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base md:text-lg text-forest/70 font-medium leading-relaxed"
            >
              نحن لا نكتفي بتقديم نظام غذائي جاف؛ بل نجمع بين أحدث التقنيات الطبية والحلول السلوكية والمتابعة الشخصية لتبسيط رحلتك الصحية وجعلها نمط حياة مستدام.
            </motion.p>

            {/* Action buttons under the subtitle exactly matching the image layout */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-center items-center gap-4 pt-2"
            >
              <Link
                to="/signup"
                className="px-8 py-3 bg-[#0e1f17] text-white rounded-full font-black text-xs hover:bg-orange transition-all duration-300 shadow-md shadow-[#0e1f17]/10"
              >
                ابدأ رحلتك الآن
              </Link>
              <a
                href="#journey"
                className="px-8 py-3 bg-forest/5 hover:bg-forest/10 border border-forest/10 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5"
              >
                <span>▶</span> شاهد كيف نعمل
              </a>
            </motion.div>
          </div>

          {/* 5-Column Staggered Grid Layout: flat/aligned at the bottom (items-end) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end relative z-10 pt-20">

            {/* COLUMN 1: Rightmost stack in RTL (Card 1: Mint card + Card 6: Heart card) - Height: 384px */}
            <div className="flex flex-col gap-4 text-right h-[384px] justify-end">
              {/* Top Mint/Emerald folder-tab card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative pt-3 overflow-visible group"
              >
                {/* Folder Tab top right */}
                <div className="absolute top-0 right-0 h-4 w-24 bg-[#a6f2d1] rounded-t-xl z-0" />
                {/* Body */}
                <div className="bg-[#a6f2d1] text-[#004532] rounded-[2rem] rounded-tr-none p-5 relative z-10 shadow-sm hover:shadow-xl transition-all duration-300 h-64 flex flex-col justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-[#004532] block leading-none">٩٦٪</span>
                    <h3 className="text-base font-black mt-2">رضا عائلي متكامل</h3>
                    <p className="text-[10px] text-[#004532]/80 font-bold leading-relaxed mt-1">
                      نظام رعاية صحي متكامل يجمع بين أنظمة التغذية الطبية المستمرة ومتابعة الأخصائي.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-[#004532]/10">
                    <span className="text-[9px] font-black text-[#004532]/70">تصفح الفعاليات</span>
                    <div className="w-7 h-7 rounded-full bg-[#004532] text-white flex items-center justify-center group-hover:bg-orange transition-colors">
                      <ArrowLeft size={14} className="rotate-[135deg]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Heart Card (short) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="bg-[#0c1f17] text-white rounded-[1.5rem] p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-right h-[112px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-orange flex-shrink-0">
                  <Heart size={20} className="fill-orange" />
                </div>
                <div>
                  <h4 className="text-xs font-black">عائلتك في أيدٍ أمينة</h4>
                  <p className="text-[9px] text-white/60 font-bold mt-0.5">رعاية صحية عائلية متكاملة</p>
                </div>
              </motion.div>
            </div>

            {/* COLUMN 2: Photo card (Nutritionist/Doctor working) - Height: 300px */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative pt-3 overflow-visible group text-right h-[300px]"
            >
              {/* Folder Tab top left */}
              <div className="absolute top-0 left-0 h-4 w-24 bg-[#182b22] rounded-t-xl z-0" />
              {/* Body */}
              <div className="bg-[#182b22] text-white rounded-[2rem] rounded-tl-none p-5 relative z-10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-[300px] flex flex-col justify-between">
                <div className="relative z-10">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[9px] font-black inline-block">متابعة مستمرة</span>
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="text-sm font-black leading-snug">طبيبك الخاص يراجع خطتك التغذية باستمرار</h3>
                  <div className="pt-2 flex justify-between items-center border-t border-white/10">
                    <span className="text-[9px] font-black text-white/60">تحدث الآن</span>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-orange transition-colors">
                      <ArrowLeft size={14} className="rotate-[135deg]" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* COLUMN 3: Center short card (AI community card) - Height: 160px */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative pt-3 overflow-visible group text-right h-[160px]"
            >
              {/* Folder Tab top right */}
              <div className="absolute top-0 right-0 h-4 w-24 bg-[#ecf1eb] rounded-t-xl z-0" />
              {/* Body */}
              <div className="bg-[#ecf1eb] text-forest rounded-[2rem] rounded-tr-none p-5 space-y-2 relative z-10 shadow-sm hover:shadow-xl transition-all duration-300 h-[160px] flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black text-forest/40 uppercase tracking-wider block">مجتمع هيليكس</span>
                  <h3 className="text-xs font-black mt-1 leading-snug">انضم إلى أكثر من ١٠٠ مشترك يحسنون حياتهم اليوم</h3>
                </div>
                <div className="pt-1 flex justify-between items-center border-t border-forest/10">
                  <span className="text-[8px] font-black text-forest/60">ابدأ الآن</span>
                  <div className="w-6.5 h-6.5 rounded-full bg-forest/5 flex items-center justify-center text-forest group-hover:bg-forest group-hover:text-white transition-colors">
                    <ArrowLeft size={12} className="rotate-[135deg]" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* COLUMN 4: Photo card (Family outdoor healthy lifestyle) - Height: 300px */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="relative pt-3 overflow-visible group text-right h-[300px]"
            >
              {/* Folder Tab top left */}
              <div className="absolute top-0 left-0 h-4 w-24 bg-orange rounded-t-xl z-0" />
              {/* Body */}
              <div className="bg-orange text-white rounded-[2rem] rounded-tl-none p-5 relative z-10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-[300px] flex flex-col justify-between">
                <div className="relative z-10">
                  <span className="px-2 py-0.5 rounded bg-white/15 text-white text-[9px] font-black inline-block">حساب عائلي</span>
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="text-sm font-black leading-snug">أنظمة غذائية مرنة ومصممة خصيصاً لكل أفراد عائلتك</h3>
                  <div className="pt-2 flex justify-between items-center border-t border-white/10">
                    <span className="text-[9px] font-black text-white/80">إدارة الحسابات</span>
                    <div className="w-7 h-7 rounded-full bg-white text-orange flex items-center justify-center group-hover:bg-[#0c1f17] group-hover:text-white transition-colors animate-pulse-slow">
                      <ArrowLeft size={14} className="rotate-[135deg]" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* COLUMN 5: Leftmost stack in RTL (Card 5: Dark green card + Card 7: Smiley card) - Height: 384px */}
            <div className="flex flex-col gap-4 text-right h-[384px] justify-end">
              {/* Top Dark Green folder-tab card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative pt-3 overflow-visible group"
              >
                {/* Folder Tab top right */}
                <div className="absolute top-0 right-0 h-4 w-24 bg-[#004532] rounded-t-xl z-0" />
                {/* Body */}
                <div className="bg-[#004532] text-white rounded-[2rem] rounded-tr-none p-5 relative z-10 shadow-lg hover:shadow-2xl transition-all duration-300 h-64 flex flex-col justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-orange block leading-none"> ٢٠٠ +</span>
                    <h3 className="text-base font-black mt-2">استشارات طبية</h3>
                    <p className="text-[10px] text-white/80 font-bold leading-relaxed mt-1">
                      مراجعة دقيقة لنتائج تحاليل الدم وتعديل مستمر للخطط الغذائية بشكل فوري آمن.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-white/10">
                    <span className="text-[9px] font-black text-white/60">حمل التطبيق</span>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-orange transition-colors">
                      <ArrowLeft size={14} className="rotate-[135deg]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Smiley Card (short) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="bg-[#181a18] text-white rounded-[1.5rem] p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-right h-[112px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-orange flex-shrink-0">
                  <span className="text-xl font-bold leading-none select-none">☺</span>
                </div>
                <div>
                  <h4 className="text-xs font-black">صحتك، رحلة نبدأها معاً</h4>
                  <p className="text-[9px] text-white/60 font-bold mt-0.5">الدعم متوفر على مدار الساعة</p>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>
      {/* 4. Healix Journey Section - Redesigned as dynamic accordion card layout */}
      <section id="journey" className="relative py-12 pb-16 px-6 md:px-12 bg-white overflow-hidden z-10">

        {/* Soft Background Aura glows */}
        <div className="absolute top-12 left-[-10%] w-96 h-96 bg-sage/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 right-[-10%] w-[30rem] h-[30rem] bg-emerald-100/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Centered Headline Container */}
          <div className="text-center max-w-3xl mx-auto mb-8 relative z-20">
            <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.6] md:leading-[1.7] py-4">
              خطوات بسيطة تصنع <br className="hidden md:inline" />
              <span className="bg-gradient-to-r from-forest to-emerald-700 bg-clip-text text-transparent font-black">فارقاً حقيقياً في صحتك</span>
            </h2>
          </div>

          {/* Steps Horizontal Accordion Slider */}
          <div
            ref={journeyCardsContainerRef}
            className="flex gap-4 md:gap-6 items-stretch w-full overflow-x-auto md:overflow-visible pb-6 md:pb-0 px-4 md:px-0 scrollbar-none snap-x snap-mandatory pt-4"
          >
            {[
              {
                stepNum: "01",
                title: "إنشاء الملف الطبي",
                desc: "تقوم بتعبئة استمارة التاريخ المرضي والأهداف الصحية لتأسيس ملفك الطبي الشخصي على منصتنا.",
                bullet: "استمارة البيانات والتاريخ الطبي والأهداف",
                phoneContent: (
                  <div className="w-full h-full flex flex-col justify-between text-[9px] leading-tight font-tajawal">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-1 border-b border-forest/10">
                        <span className="font-black text-forest text-[9px]">الملف الطبي للعميل</span>
                        <span className="text-[7px] text-gray-400">Profile</span>
                      </div>

                      {/* Step Indicator */}
                      <div className="flex items-center gap-1 justify-center py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                        <span className="w-1.5 h-1.5 rounded-full bg-forest/20" />
                        <span className="w-1.5 h-1.5 rounded-full bg-forest/20" />
                      </div>

                      <div className="space-y-1">
                        <div className="space-y-0.5 text-right">
                          <label className="text-[6.5px] font-black text-forest/60">الحالة الطبية الحالية</label>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-md text-[7px] font-bold text-forest">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> سكري (نوع ٢)
                            </div>
                            <div className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-md text-[7px] font-bold text-forest">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ضغط دم مرتفع
                            </div>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-right">
                          <label className="text-[6.5px] font-black text-forest/60">النشاط البدني المعتاد</label>
                          <div className="w-full p-1 bg-white border border-gray-100 rounded-md font-bold text-forest text-[7px] flex justify-between items-center">
                            <span>خفيف (مكتب عمل)</span>
                            <span className="text-orange">🏃‍♂️</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-right">
                          <label className="text-[6.5px] font-black text-forest/60">جودة النوم والراحة</label>
                          <div className="w-full p-1 bg-white border border-gray-100 rounded-md font-bold text-forest text-[7px] flex justify-between items-center">
                            <span>٦-٧ ساعات يومياً</span>
                            <span className="text-orange">💤</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-right">
                          <label className="text-[6.5px] font-black text-forest/60">الهدف الرئيسي للبرنامج</label>
                          <div className="w-full p-1 bg-white border border-gray-100 rounded-md font-bold text-forest text-[7px] flex justify-between items-center">
                            <span>خفض الدهون وزيادة الطاقة</span>
                            <span className="text-orange">🎯</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="w-full py-1.5 bg-forest text-white rounded-xl font-black text-[8px] hover:bg-forest/90 transition-colors shadow-sm">
                      تأكيد وحفظ الملف
                    </button>
                  </div>
                )
              },
              {
                stepNum: "02",
                title: "قراءة الـ InBody والتحاليل بالذكاء الاصطناعي",
                desc: "ارفع ورقة الـ InBody أو تقارير المختبر، ليقوم الذكاء الاصطناعي بقراءة المؤشرات وتتبع تقدمك فورياً.",
                bullet: "قراءة آلية للدهون والعضلات وفحوصات الدم",
                phoneContent: (
                  <div className="w-full h-full flex flex-col justify-between text-[9px] leading-tight font-tajawal">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center pb-1 border-b border-forest/10">
                        <span className="font-black text-forest text-[9px]">تقرير الـ InBody والتحليل</span>
                        <span className="text-[7px] text-gray-400">InBody Parsing</span>
                      </div>

                      <div className="p-1.5 bg-forest text-white rounded-xl space-y-1 text-center shadow-sm">
                        <span className="text-[7px] font-black block">inbody_report_july.png</span>
                        <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                          <div className="w-full h-full bg-orange rounded-full" />
                        </div>
                        <span className="text-[6.5px] font-black opacity-90">اكتمل تحليل الذكاء الاصطناعي ✓</span>
                      </div>

                      {/* InBody bars */}
                      <div className="space-y-1 pt-0.5 text-right">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[7px] font-bold text-forest">
                            <span>الوزن: ٨٢.٥ كجم</span>
                            <span className="text-orange font-black">مرتفع</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-orange rounded-full" />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[7px] font-bold text-forest">
                            <span>الكتلة العضلية: ٣٤.٢ كجم</span>
                            <span className="text-forest font-black">طبيعي</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="w-1/2 h-full bg-forest rounded-full" />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[7px] font-bold text-forest">
                            <span>نسبة الدهون: ٢٣.١٪</span>
                            <span className="text-orange font-black">مرتفع</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="w-[80%] h-full bg-orange rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-1 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800 text-[6.5px] font-bold">
                      تم حفظ القياسات وتحديث خطتك التغذوية
                    </div>
                  </div>
                )
              },
              {
                stepNum: "03",
                title: "مراجعة الطبيب وتصميم الخطة",
                desc: "يفحص طبيبك المعالج تفضيلاتك الغذائية وقياساتك، ليصمم لك خطة علاجية وتغذية مرنة تماماً.",
                bullet: "مواءمة للأطعمة المفضلة وتعديلات الطبيب",
                phoneContent: (
                  <div className="w-full h-full flex flex-col justify-between text-[9px] leading-tight font-tajawal">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-1 border-b border-forest/10">
                        <span className="font-black text-forest text-[9px]">تفضيلات التغذية المعتمدة</span>
                        <span className="text-[7px] text-gray-400">Diet Preferences</span>
                      </div>

                      {/* Doctor info snippet */}
                      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-50 shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-forest text-white flex items-center justify-center text-[7px] font-black">د</div>
                        <div className="text-right">
                          <h4 className="text-[7px] font-black text-forest">د. أحمد السعيد</h4>
                          <p className="text-[5.5px] text-gray-400">استشاري التغذية العلاجية</p>
                        </div>
                      </div>

                      {/* User Food Preferences checklist */}
                      <div className="space-y-1">
                        <div className="space-y-0.5 text-right">
                          <span className="text-[6.5px] font-black text-forest/60">أطعمة يفضلها العميل (تحتويها الخطة)</span>
                          <div className="flex flex-wrap gap-0.5">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[6.5px] font-bold">✓ بيض مسلوق</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[6.5px] font-bold">✓ سمك سلمون</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[6.5px] font-bold">✓ شوفان</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-right">
                          <span className="text-[6.5px] font-black text-forest/60">أطعمة يتجنبها العميل (مستبعدة)</span>
                          <div className="flex flex-wrap gap-0.5">
                            <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[6.5px] font-bold">✕ سكر مضاف</span>
                            <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[6.5px] font-bold">✕ حليب بقري</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-1 bg-forest/5 rounded-lg text-[6.5px] font-bold text-forest leading-relaxed text-right border border-forest/10">
                      "ملاحظة الطبيب: تم استبدال الحليب البقري بحليب اللوز لسلامة الهضم."
                    </div>
                  </div>
                )
              },
              {
                stepNum: "04",
                title: "المتابعة اليومية وتحقيق الهدف",
                desc: "نتابع معك التزامك اليومي بالمهام والوجبات، ونحدث قياساتك باستمرار للوصول لهدفك النهائي بسلاسة.",
                bullet: "قائمة مهام تفاعلية وتتبع السعرات والنشاط",
                phoneContent: (
                  <div className="w-full h-full flex flex-col justify-between text-[9px] leading-tight font-tajawal">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center pb-1 border-b border-forest/10">
                        <span className="font-black text-forest text-[9px]">لوحة مهام اليوم</span>
                        <span className="text-[7px] text-gray-400">Daily Tasks</span>
                      </div>

                      {/* Header Greeting */}
                      <div className="text-right">
                        <span className="text-[7px] text-gray-400 block">مرحباً كمال 👋</span>
                        <span className="text-[9px] font-black text-forest">أكمل مهامك اليومية</span>
                      </div>

                      {/* Tasks Checkbox list */}
                      <div className="space-y-1 pt-0.5 text-right font-bold text-forest text-[7.5px]">
                        <div className="flex items-center gap-1.5 p-1 bg-emerald-50/50 border border-emerald-100 rounded-md">
                          <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center text-[7px] font-black">✓</span>
                          <span>الفطور: بيض مسلوق وشوفان</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-emerald-50/50 border border-emerald-100 rounded-md">
                          <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center text-[7px] font-black">✓</span>
                          <span>شرب ٢ لتر ماء</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-emerald-50/50 border border-emerald-100 rounded-md">
                          <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center text-[7px] font-black">✓</span>
                          <span>المشي ٦٠٠٠ خطوة</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-md opacity-75">
                          <span className="w-3.5 h-3.5 rounded border border-gray-200 flex items-center justify-center" />
                          <span>تمرين المقاومة (٣٠ دقيقة)</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex justify-between items-center pt-1 border-t border-gray-50 text-[7px] font-black">
                      <span className="text-gray-400">السعرات: ١٤٥٠ / ١٨٥٠</span>
                      <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">٧٥٪ مكتمل</span>
                    </div>
                  </div>
                )
              }
            ].map((card, idx) => {
              const isActive = activeJourneyCard === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => {
                    if (window.innerWidth >= 768) {
                      setActiveJourneyCard(idx);
                      setIsJourneyPaused(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (window.innerWidth >= 768) {
                      setIsJourneyPaused(false);
                    }
                  }}
                  onTouchStart={() => setIsJourneyPaused(true)}
                  onTouchEnd={() => setIsJourneyPaused(false)}
                  onClick={() => {
                    setActiveJourneyCard(idx);
                    setIsJourneyPaused(true);

                    // Resume auto scrolling after 8 seconds of no interaction
                    const timeoutId = setTimeout(() => {
                      setIsJourneyPaused(false);
                    }, 8000);

                    if (window.innerWidth < 768) {
                      const container = journeyCardsContainerRef.current;
                      const cardEl = container?.children[idx] as HTMLElement;
                      if (container && cardEl) {
                        container.scrollTo({
                          left: cardEl.offsetLeft - (container.clientWidth - cardEl.clientWidth) / 2,
                          behavior: 'smooth'
                        });
                      }
                    }
                  }}
                  className={`snap-center flex-shrink-0 relative rounded-[2.5rem] p-5 md:p-6 flex transition-all duration-700 cubic-bezier(0.25, 1, 0.5, 1) will-change-[flex-grow,width] cursor-pointer overflow-hidden border border-forest/5 select-none h-[340px] md:h-[390px] ${isActive
                    ? 'w-[85vw] md:w-auto md:flex-[4] bg-[#f4f6f2] text-forest shadow-xl flex-row gap-5 md:gap-6'
                    : 'w-[150px] md:w-auto md:flex-[1] bg-sage/10 text-forest/70 hover:bg-sage/20 flex-col justify-between'
                    }`}
                >
                  {/* Left Column in RTL (Text column) */}
                  <div className={`flex flex-col justify-between text-right h-full ${isActive ? 'flex-1 min-w-[50%]' : 'w-full'}`}>
                    <div className="space-y-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest block transition-colors ${isActive ? 'text-forest/40' : 'text-forest/30'
                        }`}>
                        الخطوة {card.stepNum}
                      </span>
                      <h3 className={`font-black tracking-tight leading-snug transition-all duration-500 ${isActive ? 'text-xl md:text-2xl text-forest' : 'text-base md:text-lg text-forest'
                        }`}>
                        {card.title}
                      </h3>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          className="space-y-3"
                        >
                          <p className="text-[11px] md:text-xs text-forest/75 font-bold leading-relaxed">
                            {card.desc}
                          </p>
                          <span className="inline-block px-2.5 py-1 rounded bg-forest/5 border border-forest/10 text-[9px] font-black text-forest/80">
                            ★ {card.bullet}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Card Footer Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-forest/10 mt-4">
                      <span className={`text-[10px] md:text-xs font-black transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                        تصفح الخطوة بالتفصيل
                      </span>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-[#a6f2d1] text-forest rotate-0 scale-110 shadow-sm' : 'bg-white text-[#004532]/70 hover:scale-105 shadow-sm'
                        }`}>
                        <ArrowLeft size={16} className={isActive ? '' : 'rotate-[135deg]'} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column in RTL (Phone Mockup column - only visible in active state) */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                      className="w-[45%] md:w-[40%] h-full flex items-center justify-center flex-shrink-0 relative"
                    >

                      {/* Mini Smartphone container inside the active card */}
                      <div className="w-[150px] h-[270px] md:w-[170px] md:h-[300px] bg-[#0c1f17] rounded-[2rem] md:rounded-[2.5rem] p-2 shadow-lg border-[4px] border-[#0c1f17] relative flex flex-col justify-between select-none">

                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3.5 w-20 bg-[#0c1f17] rounded-b-xl z-50 flex items-center justify-center">
                          <div className="w-8 h-0.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Inner Screen */}
                        <div className="w-full h-full bg-[#f7faf4] rounded-[1.3rem] md:rounded-[1.5rem] overflow-hidden relative p-2.5 pt-5 text-right flex flex-col justify-between z-10">
                          {card.phoneContent}
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* Visual loading timer progress line */}
                  {isActive && (
                    <div className="absolute bottom-0 right-0 left-0 h-1 bg-forest/5 overflow-hidden">
                      <motion.div
                        key={idx + (isJourneyPaused ? "-paused" : "-playing")}
                        initial={{ width: "0%" }}
                        animate={isJourneyPaused ? { width: "0%" } : { width: "100%" }}
                        transition={{ duration: isJourneyPaused ? 0 : 4, ease: "linear" }}
                        className="h-full bg-orange"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>
      {/* 5. AI Assistant Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">

          <div className="md:col-span-5 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
              <Brain size={14} className="text-orange" />
              <span>مساعدك الصحي الشخصي 24/7</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.6] md:leading-[1.7] py-3 md:py-4">
              اسأل مساعد هيليكس
              <br />
              <span className="text-orange font-black">الذكي في أي وقت</span>
            </h2>
            <p className="text-base text-forest/70 font-medium leading-relaxed">
              محرك ذكاء اصطناعي مدرب طبياً لمساعدتك في تعديل وجباتك، اقتراح البدائل، وحساب السعرات الفوري بناءً على أهداف خطتك الصحية.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button onClick={() => handleAiQuestion(0)} className={`p-3.5 text-right text-xs font-black rounded-2xl border transition-all ${activeAiTab === 0 ? 'bg-forest text-white border-forest' : 'bg-white text-forest hover:bg-forest/5 border-gray-100'}`}>
                هل أستطيع تناول وجبة شاورما دجاج اليوم؟
              </button>
              <button onClick={() => handleAiQuestion(1)} className={`p-3.5 text-right text-xs font-black rounded-2xl border transition-all ${activeAiTab === 1 ? 'bg-forest text-white border-forest' : 'bg-white text-forest hover:bg-forest/5 border-gray-100'}`}>
                احسب سعراتي لليوم ومعدل التزامي
              </button>
              <button onClick={() => handleAiQuestion(2)} className={`p-3.5 text-right text-xs font-black rounded-2xl border transition-all ${activeAiTab === 2 ? 'bg-forest text-white border-forest' : 'bg-white text-forest hover:bg-forest/5 border-gray-100'}`}>
                حلل وجبة الفطور التي قمت بتصويرها
              </button>
              <button onClick={() => handleAiQuestion(3)} className={`p-3.5 text-right text-xs font-black rounded-2xl border transition-all ${activeAiTab === 3 ? 'bg-forest text-white border-forest' : 'bg-white text-forest hover:bg-forest/5 border-gray-100'}`}>
                راجع نتائج فحص الدم الأخير لي
              </button>
            </div>
          </div>

          {/* AI Interactive Chat Demo Screen */}
          <div className="md:col-span-7 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[460px]">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-forest text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Brain size={18} className="text-orange" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-black">Healix AI Agent</h4>
                  <p className="text-[9px] text-white/60">مستشار التغذية والتحليل الآلي</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[9px] font-black text-emerald-300">نشط الآن</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col justify-end">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[75%] p-4 rounded-2xl text-xs font-bold leading-relaxed text-right ${isUser
                      ? 'bg-forest text-white rounded-br-none shadow-sm'
                      : 'bg-[#f0f4ec] text-forest border border-forest/10 rounded-bl-none'
                      }`}
                    style={{ alignSelf: isUser ? 'flex-start' : 'flex-end' }}
                  >
                    {msg.text}
                  </motion.div>
                );
              })}

              {isAiTyping && (
                <div
                  className="bg-[#f0f4ec] text-forest border border-forest/10 p-3 rounded-2xl rounded-bl-none text-xs font-bold w-24 flex gap-1 justify-center items-center"
                  style={{ alignSelf: 'flex-end' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-forest animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-forest animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-forest animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 6. Personalized Nutrition Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">

          {/* Nutrition Right Side Mock Panel */}
          <div className="md:col-span-6 bg-[#fbfdf7] rounded-[2.5rem] p-6 border border-gray-100 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h4 className="text-base font-black">الخطة الغذائية لليوم</h4>
                <p className="text-[10px] text-forest/60">١٨٠٠ سعرة حرارية مستهدفة</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange/10 text-orange text-[10px] font-black">نشطة</span>
            </div>

            <div className="space-y-3">
              {/* Breakfast card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="text-right">
                  <span className="text-[9px] font-black text-gray-400">الوجبة الأولى (الفطور)</span>
                  <h5 className="text-xs font-black mt-0.5">٣ بيضات مسلوقة + نصف خبز بر + أفوكادو</h5>
                  <p className="text-[9px] text-forest/60 mt-1">بروتين: ٢٤غ | كربوهيدرات: ٢٠غ | دهون: ١٤غ</p>
                </div>
                <span className="text-xs font-black text-forest bg-forest/5 px-2.5 py-1 rounded-xl">٣٥٠ سعرة</span>
              </div>
              {/* Lunch card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="text-right">
                  <span className="text-[9px] font-black text-gray-400">الوجبة الثانية (الغداء)</span>
                  <h5 className="text-xs font-black mt-0.5">٢٠٠غ صدر دجاج مشوي + أرز بسمتي + خضار سوتيه</h5>
                  <p className="text-[9px] text-forest/60 mt-1">بروتين: ٤٨غ | كربوهيدرات: ٤٥غ | دهون: ٨غ</p>
                </div>
                <span className="text-xs font-black text-forest bg-forest/5 px-2.5 py-1 rounded-xl">٥٨٠ سعرة</span>
              </div>
              {/* Dinner card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="text-right">
                  <span className="text-[9px] font-black text-gray-400">الوجبة الثالثة (العشاء)</span>
                  <h5 className="text-xs font-black mt-0.5">علبة زبادي يوناني + فراولة + بذور الشيا</h5>
                  <p className="text-[9px] text-forest/60 mt-1">بروتين: ٢٠غ | كربوهيدرات: ١٢غ | دهون: ٥غ</p>
                </div>
                <span className="text-xs font-black text-forest bg-forest/5 px-2.5 py-1 rounded-xl">٢٢٠ سعرة</span>
              </div>
            </div>
          </div>

          {/* Nutrition Left Side Text */}
          <div className="md:col-span-6 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
              <Sparkles size={14} className="text-orange" />
              <span>خطط مرنة وبدائل ذكية</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.35] py-1.5">خطط تغذية واقعية مصممة لأجلك</h2>
            <p className="text-base text-forest/70 font-medium leading-relaxed">
              وداعاً لأنظمة الحرمان والملل. مع هيليكس، يتم تصميم خطتك الغذائية بحيث تناسب الأطعمة التي تفضلها وعادات عائلتك اليومية، مع إمكانية تعديل وتبديل أي وجبة في ثوانٍ دون الإخلال بهدفك الصحي.
            </p>
            <div className="pt-2">
              <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-black text-orange hover:text-forest transition-colors">
                اشترك الآن واحصل على خطتك الشخصية
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 7. Medical Analysis Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">

          {/* Text content */}
          <div className="md:col-span-6 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
              <Activity size={14} className="text-orange" />
              <span>تحليل مكونات الجسم الذكي</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.55] py-1.5">تكامل كامل مع قياسات الـ InBody ومكونات الجسم</h2>
            <p className="text-base text-forest/70 font-medium leading-relaxed">
              لا نخمن طبيعة استجابة جسمك. يقرأ نظامنا الذكي ورقة الـ InBody، ويتتبع بدقة تطور كتلتك العضلية ونسب الدهون وتوزيع المياه، ومطابقتها فوراً مع برنامجك الغذائي والتدريبي لتحقيق تقدم حقيقي ومستمر.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs font-black text-forest/80 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange" /> تتبع الوزن ونسبة الدهون بدقة
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange" /> مراقبة الكتلة العضلية وحجم السوائل
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange" /> تحليل الدهون الحشوية وتوزيع العضلات
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange" /> حساب معدل الحرق الداخلي (BMR) تلقائياً
              </div>
            </div>
          </div>

          {/* Graphical Mock Panel */}
          <div className="md:col-span-6 bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <h4 className="text-base font-black">مؤشر الكتلة الدهنية والعضلية (InBody)</h4>
              <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-xl">خسارة دهون -٦.٢ كجم</span>
            </div>

            {/* InBody progress dashboard cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-forest/5 p-3 rounded-2xl border border-forest/10 text-center">
                <p className="text-[10px] text-gray-500 font-bold">الوزن الحالي</p>
                <p className="text-lg font-black text-forest mt-1">٧٨.٥ <span className="text-[9px] font-bold">كجم</span></p>
                <span className="text-[9px] font-black text-gray-400">كان ٨٤.٧ كجم</span>
              </div>
              <div className="bg-orange/5 p-3 rounded-2xl border border-orange/10 text-center">
                <p className="text-[10px] text-gray-500 font-bold">الكتلة العضلية</p>
                <p className="text-lg font-black text-orange mt-1">٣٦.٨ <span className="text-[9px] font-bold">كجم</span></p>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">+١.٨ كجم</span>
              </div>
              <div className="bg-[#fbfdf7] p-3 rounded-2xl border border-gray-100 text-center">
                <p className="text-[10px] text-gray-500 font-bold">نسبة الدهون</p>
                <p className="text-lg font-black text-gray-700 mt-1">١٨.٢٪</p>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">-٦.٣٪</span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="h-40 w-full relative pt-2">
              <svg className="w-full h-full" viewBox="0 0 400 120">
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="#f3f4f6" strokeWidth="1" />

                {/* Muscle path (green line going up) */}
                <path
                  d="M10 95 Q 100 85, 200 65 T 390 40"
                  fill="none"
                  stroke="#004532"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Fat path (orange line going down) */}
                <path
                  d="M10 35 Q 100 50, 200 75 T 390 95"
                  fill="none"
                  stroke="#e65f2b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                <circle cx="390" cy="40" r="5" fill="#004532" />
                <circle cx="390" cy="95" r="5" fill="#e65f2b" />
              </svg>

              <div className="flex justify-between text-[9px] font-black text-gray-400 mt-2 px-2">
                <span>قبل ٣ أشهر (١٢ نانو)</span>
                <span>قبل شهر (٢٢ نانو)</span>
                <span>الحالي (٣٥ نانو - طبيعي)</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Doctor Follow-up Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          
          {/* Doctor Chat Mock */}
          <div className="md:col-span-6 bg-[#fbfdf7] rounded-[2.5rem] p-6 border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center text-xs font-black">د</div>
              <div className="text-right">
                <h4 className="text-sm font-black">د. أحمد السعيد</h4>
                <p className="text-[9px] text-forest/60">طبيبك ومستشار التغذية المعين</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white p-3 rounded-2xl border border-gray-50 max-w-[80%] text-right ml-auto">
                <p className="text-[10px] text-gray-400">العميل</p>
                <p className="text-xs font-bold mt-1 text-forest">أشعر بخمول خفيف بعد تناول وجبة الغداء اليوم، هل هذا طبيعي؟</p>
              </div>
              <div className="bg-forest text-white p-3 rounded-2xl max-w-[80%] text-right mr-auto">
                <p className="text-[10px] text-white/50">د. أحمد السعيد</p>
                <p className="text-xs font-bold mt-1">أهلاً بك. قمت بمراجعة نسبة الكربوهيدرات المجدولة، وسنقوم بتقليلها قليلاً مع زيادة كمية البروتين لتفادي خمول الأنسولين. قمت بتحديث خطتك الآن.</p>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-700 text-[10px] font-black">
                <CheckCircle size={12} /> تم تحديث الخطة الغذائية اليومية بنجاح
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="md:col-span-6 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
              <MessageSquare size={14} className="text-orange" />
              <span>إشراف طبي متكامل</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-forest leading-tight">تواصل مباشر ومستمر مع طبيبك المعين</h2>
            <p className="text-base text-forest/70 font-medium leading-relaxed">
              لست بمفردك في هذه الرحلة. يعين لك النظام طبيباً بشرياً وأخصائي تغذية لمراجعة تطورك، الإجابة عن استفساراتك اليومية، وتعديل خطتك الصحية والغذائية والرياضية كلما دعت الحاجة.
            </p>
          </div>

        </div>
      </section>

      {/* 9. Family Health Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          
          {/* Text content */}
          <div className="md:col-span-6 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest/5 border border-forest/10 rounded-full text-xs font-black text-forest">
              <Users size={14} className="text-orange" />
              <span>رعاية صحة الأسرة</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-forest leading-tight">حساب واحد يرعى شؤون عائلتك بالكامل</h2>
            <p className="text-base text-forest/70 font-medium leading-relaxed">
              صحة عائلتك تبدأ من خطوة واحدة. تتيح لك هيليكس ربط حسابات زوجتك وأطفالك تحت حسابك الرئيسي لتوجيه وجباتهم الصحية، تتبع مؤشرات نمو الأطفال، وحفظ سجلاتهم الطبية في لوحة تحكم عائلية محمية وموحدة.
            </p>
            <div className="pt-2">
              <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-black text-orange hover:text-forest transition-colors">
                تعرف على باقات الحساب العائلي
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>

          {/* Relationship Mock Visualization */}
          <div className="md:col-span-6 flex justify-center items-center h-[360px] relative">
            <div className="absolute w-72 h-72 rounded-full border border-forest/10 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-forest text-white shadow-2xl flex flex-col items-center justify-center border-4 border-[#fbfdf7] z-10 hover:scale-105 transition-transform duration-300">
                <span className="text-xs font-black">خالد (الأب)</span>
                <span className="text-[9px] text-white/60">الحساب الرئيسي</span>
              </div>
              
              <div className="absolute top-4 w-16 h-16 rounded-full bg-orange text-white flex flex-col items-center justify-center border-2 border-white shadow-lg hover:scale-105 transition-transform duration-300">
                <span className="text-[10px] font-black">الأم</span>
                <span className="text-[8px] text-white/70">سارة</span>
              </div>

              <div className="absolute bottom-4 left-6 w-16 h-16 rounded-full bg-white text-forest border border-forest/10 flex flex-col items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                <span className="text-[10px] font-black">الابن</span>
                <span className="text-[8px] text-forest/60">فيصل (١١ سنة)</span>
              </div>

              <div className="absolute bottom-4 right-6 w-16 h-16 rounded-full bg-white text-forest border border-forest/10 flex flex-col items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                <span className="text-[10px] font-black">الابنة</span>
                <span className="text-[8px] text-forest/60">نورة (٧ سنوات)</span>
              </div>
            </div>
          </div>

        </div>
      </section>
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-forest to-[#003828] text-white rounded-[3.5rem] p-8 md:p-16 text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-emerald-700/30 rounded-full filter blur-3xl z-0" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black leading-[1.35] py-2">ابدأ رحلتك الصحية اليوم</h2>
            <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed">
              انضم إلى آلاف المشتركين والأسرة العربية التي غيرت أسلوب حياتها للأفضل مع التغذية العلاجية والمتابعة الطبية الذكية.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 relative z-10 pt-4">
            <Link to="/signup" className="px-8 py-4 bg-orange text-white rounded-full font-black text-sm hover:bg-white hover:text-forest hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-orange/15">
              إنشاء حساب
            </Link>
            <button
              onClick={() => {
                const chatFab = document.querySelector('button.group') as HTMLButtonElement;
                if (chatFab) chatFab.click();
              }}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all duration-300"
            >
              تواصل معنا
            </button>
          </div>
        </div>
      </section>

      {/* 11. Blog Preview Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="text-right space-y-4">
              <span className="text-orange font-bold text-sm block">المدونة الطبية للتغذية</span>
              <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.35] py-1.5">أحدث المقالات والنصائح الصحية</h2>
            </div>
            <Link to="/blog" className="px-6 py-3 border border-forest/20 hover:bg-forest/5 rounded-full font-black text-xs transition-colors whitespace-nowrap">
              عرض جميع المقالات
            </Link>
          </div>

          {loadingDb || articles.length === 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="h-72 bg-gray-50 animate-pulse rounded-3xl" />
              <div className="h-72 bg-gray-50 animate-pulse rounded-3xl" />
              <div className="h-72 bg-gray-50 animate-pulse rounded-3xl" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {articles.slice(0, 3).map((art) => (
                <div 
                  key={art.id}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[440px] cursor-pointer group text-right"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={art.image_url || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"} 
                      alt={art.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    {art.category && (
                      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-forest/90 backdrop-blur-sm text-white text-[9px] font-black shadow-md">
                        {art.category}
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-base font-black text-forest group-hover:text-orange transition-colors leading-snug line-clamp-2">
                        <Link to={`/blog/${art.id}`}>{art.title}</Link>
                      </h4>
                      <p className="text-xs text-forest/65 line-clamp-3 mt-1.5">
                        {art.excerpt || (art.content || '').slice(0, 120) + '...'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold">
                        {new Date(art.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                      </span>
                      <Link to={`/blog/${art.id}`} className="text-orange text-xs font-black flex items-center gap-1 hover:gap-2 transition-all">
                        اقرأ المقال <ArrowLeft size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 12. Events & Workshops Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="text-right space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.35] py-1.5">ندوات وورش عمل قادمة</h2>
            </div>
            <a href="/#events" className="px-6 py-3 border border-forest/20 hover:bg-forest/5 rounded-full font-black text-xs transition-colors whitespace-nowrap">
              عرض جميع الفعاليات
            </a>
          </div>

          {loadingDb || events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد فعاليات قادمة حالياً</h3>
              <p className="text-xs text-gray-400">نعمل على تحضير لقاءات جديدة.. تابعونا قريباً! 🚀</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[400px] cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={event.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-forest text-white text-[9px] font-black shadow-md">
                      {event.is_online ? 'أونلاين' : 'حضوري'}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between text-right space-y-4">
                    <div>
                      <h3 className="text-base font-black text-forest leading-snug line-clamp-2">{event.title}</h3>
                      <p className="text-xs text-forest/60 mt-2 line-clamp-3">{event.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-[10px] text-forest/70 font-bold">
                        <Calendar size={14} className="text-orange" />
                        <span>{new Date(event.event_date).toLocaleDateString('ar-EG', { dateStyle: 'long' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-forest/70 font-bold">
                        <MapPin size={14} className="text-orange" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black pt-2">
                        <span className="text-forest">المقاعد المتبقية: {event.available_seats}</span>
                        <span className="text-orange">{event.price === 0 ? 'مجانًا' : `${event.price} ريال`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </section>

      {/* 13. Testimonials Section */}
      <section className="py-24 px-6 md:px-12 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <span className="text-orange font-bold text-sm block">قصص نجاح هيليكس</span>
          <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.35] py-1.5">ماذا يقول عملاؤنا؟</h2>

          <div className="bg-[#fbfdf7] border border-gray-100 rounded-[3rem] p-8 md:p-12 shadow-sm text-right relative">
            <span className="absolute top-6 left-8 text-8xl text-forest/5 font-black font-serif select-none">“</span>

            <p className="text-lg md:text-xl text-forest/90 leading-relaxed font-bold mb-6">
              "{testimonials[activeTestimonial].text}"
            </p>

            <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
              <div>
                <h4 className="text-base font-black text-forest">{testimonials[activeTestimonial].name}</h4>
                <p className="text-xs text-forest/50 font-bold mt-1">{testimonials[activeTestimonial].role}</p>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl">
                {testimonials[activeTestimonial].stat}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setActiveTestimonial(prev => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              className="w-10 h-10 rounded-full border border-forest/10 hover:bg-forest hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setActiveTestimonial(prev => (prev === testimonials.length - 1 ? 0 : prev + 1))}
              className="w-10 h-10 rounded-full border border-forest/10 hover:bg-forest hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 14. FAQ Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <HelpCircle className="text-orange mx-auto" size={32} />
            <h2 className="text-3xl md:text-5xl font-black text-forest leading-[1.35] py-1.5">الأسئلة الشائعة</h2>
            <p className="text-base text-forest/70 font-medium">
              جمعنا لك إجابات مفصلة لأكثر الأسئلة التي قد تدور في ذهنك بخصوص خدماتنا.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-right font-black text-base md:text-lg flex justify-between items-center text-forest hover:text-orange transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <div className={`p-1.5 rounded-full transition-colors ${openFaq === idx ? 'bg-orange text-white' : 'bg-gray-50 text-forest'}`}>
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
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
