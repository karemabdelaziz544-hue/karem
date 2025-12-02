import React from 'react';
import { Instagram, Twitter, Linkedin, MessageCircle } from 'lucide-react'; // أزلنا Dna
import Button from './Button';
import Logo from './Logo'; // استيراد اللوجو

const Footer: React.FC = () => {
  return (
    <footer className="bg-forest text-cream py-16 px-6 md:px-12 border-t border-white/10 text-right">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          {/* هنا التعديل: استخدام اللوجو الجديد */}
          <div className="flex items-center gap-3 mb-6 group cursor-pointer">
            <Logo className="h-16 w-16 shadow-xl rounded-2xl" />
            <span className="text-3xl font-bold text-white tracking-tight transition-colors duration-300 group-hover:text-orange">
              هيليكس
            </span>
          </div>
          
          <p className="text-sage/60 text-sm leading-relaxed font-medium">
            هيليكس.. حياة صحية في كل بيت. أول شركة متخصصة في تقديم حلول التغذية لكل أفراد الأسرة (أطفال، سيدات، رجال) تحت إشراف طبي متخصص ١٠٠٪.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-bold mb-4 text-white text-lg">المنصة</h4>
          <ul className="space-y-2 text-sage/60 text-sm font-medium">
            <li><a href="/#medical-team" className="hover:text-orange transition-colors">تخصصاتنا</a></li>
            <li><a href="/#how-it-works" className="hover:text-orange transition-colors">رحلة المشترك</a></li>
            <li><a href="/#pricing" className="hover:text-orange transition-colors">باقات العائلة</a></li>
            <li><a href="/#events" className="hover:text-orange transition-colors">مجتمع هيليكس</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-white text-lg">الشركة</h4>
          <ul className="space-y-2 text-sage/60 text-sm font-medium">
            <li><a href="#" className="hover:text-orange transition-colors">من نحن</a></li>
            <li><a href="#" className="hover:text-orange transition-colors">انضم للفريق الطبي</a></li>
            <li><a href="#" className="hover:text-orange transition-colors">سياسة الخصوصية</a></li>
            <li><a href="#" className="hover:text-orange transition-colors">الشروط والأحكام</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold mb-4 text-white text-lg">تواصل معنا</h4>
          <p className="text-sage/60 text-sm mb-4 font-medium">هل عندك استفسار عن حالة طفلك أو صحتك؟</p>
          <div className="flex flex-col gap-3">
             <Button variant="primary" className="py-2 text-sm justify-center" onClick={() => window.open('https://wa.me/123456789', '_blank')}>
                <MessageCircle size={18} />
                محادثة واتساب
             </Button>
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