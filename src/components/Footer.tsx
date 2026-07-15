import React from 'react';
import { Instagram, Twitter, Linkedin, Apple, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-forest text-cream py-16 px-6 md:px-12 border-t border-white/10 text-right">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-1">
          <div className="flex items-center gap-3 mb-6 group cursor-pointer">
            <Logo className="h-16 w-16 shadow-xl rounded-2xl" />
            <span className="text-3xl font-bold text-white tracking-tight transition-colors duration-300 group-hover:text-orange">
              هيليكس
            </span>
          </div>
          
          <p className="text-sage/60 text-sm leading-relaxed font-medium">
            هيليكس.. حياة صحية في كل بيت. أول منصة عربية متكاملة لتقديم حلول التغذية العلاجية والمتابعة الطبية الذكية لكل أفراد الأسرة تحت إشراف طبي متخصص ١٠٠٪.
          </p>
        </div>

        {/* Links: Platform */}
        <div>
          <h4 className="font-bold mb-4 text-white text-lg">المنصة</h4>
          <ul className="space-y-2 text-sage/60 text-sm font-medium">
            <li><Link to="/" className="hover:text-orange transition-colors">الرئيسية</Link></li>
            <li><Link to="/about" className="hover:text-orange transition-colors">عن هيليكس</Link></li>
            <li><Link to="/pricing" className="hover:text-orange transition-colors">الأسعار والباقات</Link></li>
            <li><Link to="/how-it-works" className="hover:text-orange transition-colors">كيف نعمل؟</Link></li>
            <li><Link to="/events" className="hover:text-orange transition-colors">الفعاليات والورش</Link></li>
            <li><Link to="/blog" className="hover:text-orange transition-colors">المدونة الطبية</Link></li>
          </ul>
        </div>

        {/* Links: Company */}
        <div>
          <h4 className="font-bold mb-4 text-white text-lg">الشركة</h4>
          <ul className="space-y-2 text-sage/60 text-sm font-medium">
            <li><a href="#" className="hover:text-orange transition-colors">انضم للفريق الطبي</a></li>
            <li><a href="#" className="hover:text-orange transition-colors">سياسة الخصوصية</a></li>
            <li><a href="#" className="hover:text-orange transition-colors">الشروط والأحكام</a></li>
          </ul>
        </div>

        {/* App Download Center */}
        <div>
          <h4 className="font-bold mb-4 text-white text-lg">حمل التطبيق الآن</h4>
          <p className="text-sage/60 text-sm mb-4 font-medium">ابدأ رحلتك الصحية وتابع التزامك اليومي عبر تطبيق الهواتف الذكية.</p>
          <div className="flex flex-col gap-2.5">
            <a
              href="#download"
              className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 text-right group"
            >
              <div className="text-white group-hover:text-orange transition-colors">
                <Apple size={20} />
              </div>
              <div>
                <span className="text-[9px] text-sage/40 block leading-none">حمل من</span>
                <span className="text-xs font-bold text-white block mt-0.5">App Store</span>
              </div>
            </a>
            <a
              href="#download"
              className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 text-right group"
            >
              <div className="text-white group-hover:text-orange transition-colors">
                <Play size={20} />
              </div>
              <div>
                <span className="text-[9px] text-sage/40 block leading-none">حمل من</span>
                <span className="text-xs font-bold text-white block mt-0.5">Google Play</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-white/20 text-xs font-medium">© ٢٠٢٥ هيليكس للصحة. جميع الحقوق محفوظة.</p>
        <div className="flex gap-4 text-white/40">
          <Instagram size={20} className="hover:text-white cursor-pointer transition-colors" />
          <Twitter size={20} className="hover:text-white cursor-pointer transition-colors" />
          <Linkedin size={20} className="hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;