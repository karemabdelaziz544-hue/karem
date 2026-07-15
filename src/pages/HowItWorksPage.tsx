import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, Apple, Play
} from 'lucide-react';

const HEADLINES = [
  "رحلتك الصحية تبدأ من هنا",
  "حياة صحية في كل بيت",
  "الطبيب معك في كل خطوة",
  "تطبيق واحد... رحلة صحية كاملة",
  "Healix... شريكك نحو حياة أفضل"
];

const STEPS = [
  {
    num: 1,
    title: "حمل تطبيق Healix",
    description: "قم بتحميل التطبيق وابدأ رحلتك الصحية في دقائق معدودة.",
    bullets: [
      "متوفر لأجهزة iOS وأندرويد مجاناً.",
      "تثبيت سريع ومرن بلمسة واحدة.",
      "واجهة مستخدم حديثة وبسيطة تدعم اللغة العربية."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <rect x="90" y="30" width="120" height="190" rx="20" fill="none" stroke="currentColor" strokeWidth="6" />
        <line x1="130" y1="42" x2="170" y2="42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="150" cy="205" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="102" y="55" width="96" height="135" rx="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <motion.path 
          d="M150 75 V140 M135 125 L150 140 L165 125" 
          fill="none" 
          stroke="#FF7A00" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
        <circle cx="150" cy="155" r="12" fill="#FF7A00" opacity="0.15" />
      </svg>
    )
  },
  {
    num: 2,
    title: "أنشئ حسابك",
    description: "أنشئ حسابك بسهولة وأمان باستخدام بياناتك الأساسية.",
    bullets: [
      "تسجيل سريع برقم الهاتف أو البريد الإلكتروني.",
      "أمان وحماية كاملة لبياناتك الشخصية وصحتك.",
      "تخصيص الحساب بناءً على نمط حياتك الحالي."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <rect x="50" y="60" width="110" height="140" rx="16" fill="white" stroke="currentColor" strokeWidth="2" />
        <circle cx="105" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="75" y="135" width="60" height="8" rx="4" fill="currentColor" opacity="0.2" />
        <rect x="70" y="155" width="70" height="12" rx="6" fill="#FF7A00" />
        
        <motion.g
          animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <rect x="130" y="40" width="120" height="150" rx="16" fill="white" stroke="#FF7A00" strokeWidth="3" className="shadow-lg" />
          <path d="M160 80 H220 M160 100 H200 M160 120 H220" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="215" cy="150" r="14" fill="#FF7A00" />
          <path d="M211 150 L214 153 L220 147" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </svg>
    )
  },
  {
    num: 3,
    title: "اشترك في الباقة المناسبة",
    description: "اختر باقتك المفضلة وابدأ في الاستفادة من جميع خدمات وميزات Healix.",
    bullets: [
      "باقة مرنة وسعر عادل يناسب جودة الخدمة.",
      "500 جنيه للحساب الرئيسي شهرياً.",
      "250 جنيه فقط لكل حساب فرد عائلي إضافي."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <rect x="40" y="50" width="100" height="140" rx="16" fill="white" stroke="currentColor" strokeWidth="2" />
        <rect x="55" y="70" width="70" height="8" rx="4" fill="currentColor" opacity="0.3" />
        <text x="90" y="115" className="text-xl font-black fill-forest text-center" textAnchor="middle">500</text>
        <text x="90" y="130" className="text-[8px] font-bold fill-forest/60 text-center" textAnchor="middle">جنيه / الرئيسي</text>
        <rect x="55" y="150" width="70" height="10" rx="5" fill="currentColor" opacity="0.1" />

        <motion.g
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <rect x="150" y="35" width="110" height="160" rx="20" fill="white" stroke="#FF7A00" strokeWidth="3" />
          <rect x="170" y="55" width="70" height="10" rx="5" fill="#FF7A00" opacity="0.2" />
          <text x="205" y="105" className="text-3xl font-black fill-forest text-center" textAnchor="middle">250</text>
          <text x="205" y="125" className="text-[9px] font-bold fill-forest/70 text-center" textAnchor="middle">جنيه / التابع</text>
          <circle cx="205" cy="160" r="12" fill="#FF7A00" />
          <path d="M199 160 L203 164 L211 156" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </svg>
    )
  },
  {
    num: 4,
    title: "أضف أفراد عائلتك",
    description: "يمكنك إضافة أفراد أسرتك ليحصل كل شخص على ملف وحساب مستقل وخطة غذائية خاصة به.",
    bullets: [
      "لوحة تحكم عائلية موحدة لمتابعة صحة الجميع.",
      "خطط غذائية منفصلة تناسب عمر واحتياجات كل فرد.",
      "خصوصية كاملة لكل حساب فرعي داخل التطبيق."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <path d="M150 80 Q100 130 90 170 M150 80 Q200 130 210 170 M150 80 V170" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        
        <circle cx="150" cy="70" r="30" fill="white" stroke="#FF7A00" strokeWidth="3" />
        <path d="M138 82 Q150 72 162 82" fill="none" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="150" cy="62" r="8" fill="#FF7A00" />

        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <circle cx="80" cy="180" r="24" fill="white" stroke="currentColor" strokeWidth="2" />
          <path d="M70 190 Q80 182 90 190" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="80" cy="174" r="6" fill="currentColor" />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <circle cx="220" cy="180" r="24" fill="white" stroke="currentColor" strokeWidth="2" />
          <path d="M212 188 Q220 182 228 188" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="220" cy="174" r="5" fill="currentColor" />
        </motion.g>
      </svg>
    )
  },
  {
    num: 5,
    title: "أكمل ملفك الطبي",
    description: "ارفع تحاليلك الطبية وتقرير الـ InBody لتمنح فريقنا الطبي صورة متكاملة عن حالتك.",
    bullets: [
      "رفع مباشر لنتائج تحاليل المختبر وصور التقارير.",
      "إدخال قياسات الـ InBody بدقة (نسبة الدهون، العضلات، الماء).",
      "الإجابة على استبيان طبي وتحديد أهدافك العلاجية."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <g opacity="0.15" stroke="currentColor" strokeWidth="1">
          <line x1="40" y1="0" x2="40" y2="250" />
          <line x1="80" y1="0" x2="80" y2="250" />
          <line x1="120" y1="0" x2="120" y2="250" />
          <line x1="160" y1="0" x2="160" y2="250" />
          <line x1="200" y1="0" x2="200" y2="250" />
          <line x1="240" y1="0" x2="240" y2="250" />
        </g>
        
        <rect x="75" y="45" width="150" height="170" rx="16" fill="white" stroke="currentColor" strokeWidth="2" />
        <rect x="125" y="30" width="50" height="20" rx="6" fill="#f4f7f1" stroke="currentColor" strokeWidth="2" />
        <circle cx="150" cy="40" r="4" fill="currentColor" />

        <g transform="translate(100, 80)">
          <rect x="0" y="0" width="16" height="16" rx="4" fill="none" stroke="#FF7A00" strokeWidth="2" />
          <path d="M4 8 L7 11 L12 5" fill="none" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="26" y="4" width="70" height="8" rx="4" fill="currentColor" opacity="0.2" />

          <g transform="translate(0, 32)">
            <rect x="0" y="0" width="16" height="16" rx="4" fill="none" stroke="#FF7A00" strokeWidth="2" />
            <path d="M4 8 L7 11 L12 5" fill="none" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="26" y="4" width="60" height="8" rx="4" fill="currentColor" opacity="0.2" />
          </g>

          <g transform="translate(0, 64)">
            <rect x="0" y="0" width="16" height="16" rx="4" fill="none" stroke="#FF7A00" strokeWidth="2" />
            <path d="M4 8 L7 11 L12 5" fill="none" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="26" y="4" width="80" height="8" rx="4" fill="currentColor" opacity="0.2" />
          </g>
        </g>
      </svg>
    )
  },
  {
    num: 6,
    title: "يقوم الطبيب بمراجعة بياناتك",
    description: "يقوم أخصائيو التغذية والأطباء المعتمدون بدراسة حالتك لضمان بناء نظام صحي مخصص وآمن.",
    bullets: [
      "مراجعة بشرية ١٠٠٪ مدعومة بالذكاء الاصطناعي التشخيصي.",
      "أخذ الأمراض المزمنة والحالات الخاصة بعين الاعتبار.",
      "تحديث البيانات بصفة دورية لضمان فعالية الخطة."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <g opacity="0.1" stroke="currentColor" strokeWidth="1">
          <circle cx="150" cy="125" r="90" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="150" cy="125" r="50" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        </g>
        
        <path d="M80 60 C80 150, 220 150, 220 60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M150 127 V170" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="150" cy="180" r="14" fill="white" stroke="#FF7A00" strokeWidth="3" />
        
        <motion.g
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <rect x="90" y="55" width="120" height="60" rx="16" fill="white" stroke="#FF7A00" strokeWidth="2.5" className="shadow-lg" />
          <path 
            d="M100 85 H120 L125 70 L132 100 L138 80 L142 90 L146 85 H200" 
            fill="none" 
            stroke="#004D3D" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="120" cy="85" r="3" fill="#004D3D" />
          <circle cx="200" cy="85" r="3" fill="#004D3D" />
        </motion.g>
      </svg>
    )
  },
  {
    num: 7,
    title: "استلم خطتك الغذائية",
    description: "ستجد برنامجك الغذائي المطور بوجباته ومهامه اليومية بانتظارك داخل التطبيق مباشرة.",
    bullets: [
      "جدول وجبات يومي متكامل محسوب السعرات والمكونات.",
      "قائمة بدائل ذكية للمكونات لتناول ما تحب.",
      "مهام يومية صحية لتعزيز الالتزام والنشاط البدني."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <rect x="60" y="40" width="180" height="170" rx="24" fill="white" stroke="currentColor" strokeWidth="2" />
        <rect x="80" y="60" width="140" height="12" rx="6" fill="currentColor" opacity="0.1" />
        
        <path d="M110 115 C110 145, 190 145, 190 115 Z" fill="none" stroke="#FF7A00" strokeWidth="3" />
        <circle cx="150" cy="100" r="8" fill="#FF7A00" opacity="0.2" />
        <circle cx="135" cy="105" r="5" fill="currentColor" opacity="0.3" />
        <circle cx="165" cy="103" r="6" fill="currentColor" opacity="0.15" />
        
        <g transform="translate(80, 160)">
          <text x="0" y="10" className="text-[10px] font-black fill-forest">السعرات المستهدفة</text>
          <text x="140" y="10" className="text-[10px] font-black fill-orange" textAnchor="end">١٨٠٠ سعرة</text>
          <rect x="0" y="18" width="140" height="8" rx="4" fill="currentColor" opacity="0.08" />
          <motion.rect 
            x="0" 
            y="18" 
            width="100" 
            height="8" 
            rx="4" 
            fill="#FF7A00"
            initial={{ width: 0 }}
            whileInView={{ width: 105 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </g>
      </svg>
    )
  },
  {
    num: 8,
    title: "تواصل مع طبيبك",
    description: "متابعة يومية ودعم مستمر من خلال المحادثة المباشرة مع طبيبك المخصص.",
    bullets: [
      "إرسال رسائل نصية وصوتية داخل التطبيق بأي وقت.",
      "إرفاق صور الوجبات أو قياسات الوزن للمراجعة الفورية.",
      "تعديل النظام الغذائي بمرونة حسب ردود فعلك وظروفك."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <path d="M40 70 C40 50, 160 50, 160 70 C160 90, 140 90, 120 90 L100 110 L100 90 C60 90, 40 90, 40 70 Z" fill="#f4f7f1" />
        <line x1="60" y1="65" x2="130" y2="65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="60" y1="78" x2="100" y2="78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="150" cy="70" r="10" fill="currentColor" opacity="0.2" />

        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <path d="M260 140 C260 120, 140 120, 140 140 C140 160, 160 160, 180 160 L200 180 L200 160 C240 160, 260 160, 260 140 Z" fill="white" stroke="#FF7A00" strokeWidth="2" />
          <line x1="160" y1="135" x2="230" y2="135" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="148" x2="210" y2="148" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" />
          
          <path d="M160 170 H220" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="152" cy="170" r="4" fill="#FF7A00" />
        </motion.g>
      </svg>
    )
  },
  {
    num: 9,
    title: "تابع تقدمك",
    description: "راقب تحسن مؤشراتك الحيوية والجسدية من خلال تقارير وإحصائيات متقدمة.",
    bullets: [
      "منحنيات بيانية توضح تغير الوزن ونسب الدهون والعضلات.",
      "تتبع معدل الالتزام اليومي والأسبوعي بالوجبات والمهام.",
      "أوسمة وإنجازات تحفيزية عند الاستمرار بالتقدم."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <rect x="50" y="40" width="200" height="170" rx="20" fill="white" stroke="currentColor" strokeWidth="2" />
        <rect x="70" y="60" width="60" height="8" rx="4" fill="currentColor" opacity="0.1" />

        <circle cx="105" cy="125" r="28" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
        <motion.circle 
          cx="105" 
          cy="125" 
          r="28" 
          fill="none" 
          stroke="#FF7A00" 
          strokeWidth="4" 
          strokeDasharray="176" 
          initial={{ strokeDashoffset: 176 }}
          whileInView={{ strokeDashoffset: 44 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
        <text x="105" y="130" className="text-[10px] font-black fill-forest text-center" textAnchor="middle">٨٠٪</text>
        <text x="105" y="170" className="text-[8px] font-black fill-forest/65 text-center" textAnchor="middle">الالتزام</text>

        <g transform="translate(160, 85)">
          <line x1="0" y1="0" x2="0" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="70" x2="75" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          
          <motion.path 
            d="M 5 60 L 25 45 L 45 25 L 65 10" 
            fill="none" 
            stroke="#004D3D" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <circle cx="65" cy="10" r="4" fill="#004D3D" />
          <text x="35" y="82" className="text-[7px] font-bold fill-forest/60 text-center" textAnchor="middle">التقدم الحركي</text>
        </g>
      </svg>
    )
  },
  {
    num: 10,
    title: "استمتع بجميع خدمات Healix",
    description: "كل أدوات ومقومات الحياة الصحية متكاملة في شاشة واحدة.",
    bullets: [
      "قراءة مقالات علمية وموثوقة من مدونة هيليكس الطبية.",
      "التسجيل بالندوات الحية وورش العمل التفاعلية.",
      "استشارات فورية عبر مساعد هيليكس الذكي للتغذية."
    ],
    svg: (
      <svg viewBox="0 0 300 250" className="w-full h-full text-forest">
        <rect x="110" y="30" width="80" height="150" rx="16" fill="white" stroke="currentColor" strokeWidth="3" />
        <circle cx="150" cy="160" r="6" fill="currentColor" opacity="0.3" />
        
        <motion.g
          animate={{ x: [-5, 5, -5], y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="shadow-md"
        >
          <rect x="30" y="55" width="75" height="45" rx="10" fill="white" stroke="#FF7A00" strokeWidth="1.5" />
          <circle cx="45" cy="70" r="6" fill="#FF7A00" opacity="0.2" />
          <line x1="56" y1="70" x2="90" y2="70" stroke="currentColor" strokeWidth="1.5" />
          <line x1="45" y1="82" x2="80" y2="82" stroke="currentColor" strokeWidth="1.5" />
        </motion.g>

        <motion.g
          animate={{ x: [5, -5, 5], y: [5, -5, 5] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          className="shadow-md"
        >
          <rect x="195" y="80" width="75" height="50" rx="10" fill="white" stroke="currentColor" strokeWidth="1.5" />
          <rect x="205" y="90" width="55" height="4" rx="2" fill="currentColor" opacity="0.2" />
          <rect x="205" y="100" width="45" height="4" rx="2" fill="currentColor" opacity="0.2" />
          <rect x="205" y="112" width="35" height="8" rx="4" fill="#004D3D" />
        </motion.g>
      </svg>
    )
  }
];

const HowItWorksPage: React.FC = () => {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(1);

  // References for scrolling
  const downloadRef = useRef<HTMLDivElement>(null);

  // Rotating headlines
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIdx(prev => (prev + 1) % HEADLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Track active step on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepId = entry.target.getAttribute('id');
          if (stepId?.startsWith('step-')) {
            const stepNum = parseInt(stepId.split('-')[1]);
            setActiveStep(stepNum);
          }
        }
      });
    }, {
      rootMargin: '-30% 0px -40% 0px'
    });

    for (let i = 1; i <= 10; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  // Scroll logic
  const scrollToDownload = () => {
    downloadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll position variables for SVG timeline spring animation
  const { scrollYProgress } = useScroll();
  const scrollSpring = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  return (
    <div className="bg-[#fbfdf7] text-forest min-h-screen pt-20 overflow-x-hidden font-thmanyah selection:bg-forest selection:text-white" dir="rtl">
      
      {/* Fixed Progress Indicator (Desktop only) */}
      <div className="hidden lg:flex fixed left-10 top-1/2 -translate-y-1/2 z-[100] flex-col items-center gap-3 bg-white/60 backdrop-blur-md px-3 py-6 rounded-full border border-gray-100 shadow-sm">
        {[...Array(10)].map((_, i) => {
          const stepNum = i + 1;
          const isActive = activeStep === stepNum;
          return (
            <button
              key={stepNum}
              onClick={() => document.getElementById(`step-${stepNum}`)?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 group focus:outline-none"
            >
              <span className={`text-[10px] font-black transition-all duration-300 opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100 text-orange' : 'text-forest/40'}`}>
                الخطوة {stepNum}
              </span>
              <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${isActive ? 'bg-orange border-orange scale-125' : 'bg-white border-forest/20 group-hover:border-forest/50'}`} />
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-16 px-6 md:px-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f8f2] via-[#fbfdf7] to-[#fbfdf7] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          
          {/* Rotating Headline Container */}
          <div className="h-20 md:h-28 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={headlineIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-4xl md:text-6xl font-black text-forest tracking-tight leading-[1.15]"
              >
                {HEADLINES[headlineIdx]}
              </motion.h1>
            </AnimatePresence>
          </div>

          <p className="text-base md:text-xl text-forest/75 max-w-2xl leading-relaxed">
            بضع خطوات بسيطة تفصلك عن أسلوب حياة صحي لك ولعائلتك. رحلتنا متكاملة، تفاعلية ومصممة خصيصاً لتناسب احتياجاتكم اليومية.
          </p>

          <div className="pt-4">
            <button 
              onClick={scrollToDownload}
              className="px-10 py-4 bg-orange text-white rounded-full font-black text-sm hover:bg-forest transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-orange/15"
            >
              تحميل التطبيق الآن
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 3: Timeline Intro */}
      <section className="py-24 px-6 md:px-12 bg-[#fbfdf7] text-center space-y-4">
        <div className="max-w-3xl mx-auto">
          <span className="text-orange font-bold text-sm block">من البداية حتى الهدف</span>
          <h2 className="text-3xl md:text-5xl font-black text-forest">رحلة صحية خطوة بخطوة</h2>
          <p className="text-xs md:text-sm text-forest/70 font-bold max-w-md mx-auto pt-2">
            لا داعي للحيرة أو القلق، فكل خطوة في برنامجك العلاجي تتم وتدار تلقائياً وبكل سلاسة من داخل تطبيق هيليكس.
          </p>
        </div>
      </section>

      {/* SECTION 4: The Story Journey Timeline */}
      <section className="relative py-12 px-6 md:px-12 bg-[#fbfdf7]">
        <div className="max-w-6xl mx-auto relative">
          
          {/* Scroll-Animated Line */}
          <div className="absolute right-1/2 translate-x-1/2 top-10 bottom-10 w-[3px] bg-forest/5 hidden lg:block">
            <motion.div
              style={{ scaleY: scrollSpring, transformOrigin: 'top' }}
              className="w-full h-full bg-gradient-to-b from-orange to-forest"
            />
          </div>

          {/* Steps Loop */}
          <div className="space-y-32">
            {STEPS.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div 
                  key={step.num}
                  id={`step-${step.num}`}
                  className="relative grid lg:grid-cols-12 gap-12 items-center"
                >
                  {/* Left Column (Content or Image based on layout alternation) */}
                  <div className={`lg:col-span-6 space-y-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="flex items-center gap-4">
                      {/* Badge / Step Number */}
                      <span className="w-12 h-12 rounded-2xl bg-orange/5 text-orange flex items-center justify-center font-black text-lg border border-orange/10">
                        {step.num}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black text-forest">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-sm md:text-base text-forest/80 leading-relaxed font-medium text-right">
                      {step.description}
                    </p>

                    {/* Bullets List */}
                    <ul className="space-y-2.5 text-xs text-forest/70 font-bold pr-2 border-r-2 border-orange/20 text-right">
                      {step.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2 justify-start">
                          <CheckCircle2 size={14} className="text-orange flex-shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="pt-4">
                      <button 
                        onClick={scrollToDownload}
                        className="px-6 py-3 bg-forest text-white rounded-full font-black text-xs hover:bg-orange transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                      >
                        تحميل التطبيق الآن
                      </button>
                    </div>
                  </div>

                  {/* Right Column (Image/SVG block) */}
                  <div className={`lg:col-span-6 flex justify-center items-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                      className="w-full max-w-sm h-64 bg-white/60 backdrop-blur-sm rounded-[3rem] p-6 border border-gray-150/40 shadow-sm flex items-center justify-center relative overflow-hidden"
                    >
                      {/* Background Soft Glow */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-sage/10 to-orange/5 pointer-events-none" />
                      {step.svg}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 6: Final CTA Section */}
      <section ref={downloadRef} id="download" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-forest to-[#003828] text-white rounded-[3.5rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl flex flex-col items-center justify-center space-y-6">
          <div className="absolute top-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-emerald-700/30 rounded-full filter blur-3xl z-0" />
          
          <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">ابدأ رحلتك الصحية اليوم</h2>
            <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed max-w-2xl">
              كل ما تحتاجه لبناء حياة صحية لك ولعائلتك أصبح في تطبيق واحد. لا تتردد، غير نمط حياتك الآن بلمسة زر.
            </p>
            
            {/* App Store / Google Play Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 justify-center">
              <a 
                href="#download-app-store"
                className="flex items-center gap-3 px-6 py-3 bg-white text-forest hover:bg-orange hover:text-white rounded-2xl transition-all duration-300 font-black shadow-lg"
              >
                <Apple size={20} />
                <div className="text-right">
                  <span className="text-[9px] block opacity-70">حمل من</span>
                  <span className="text-xs block font-bold leading-none mt-0.5">App Store</span>
                </div>
              </a>

              <a 
                href="#download-google-play"
                className="flex items-center gap-3 px-6 py-3 bg-white text-forest hover:bg-orange hover:text-white rounded-2xl transition-all duration-300 font-black shadow-lg"
              >
                <Play size={20} />
                <div className="text-right">
                  <span className="text-[9px] block opacity-70">حمل من</span>
                  <span className="text-xs block font-bold leading-none mt-0.5">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HowItWorksPage;
