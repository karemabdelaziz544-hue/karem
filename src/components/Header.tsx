import React, { useState, useEffect } from 'react';
import { Menu, X, Layout, UserCircle } from 'lucide-react'; // أضفنا أيقونات جديدة
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // 👈 استيراد الـ Auth
import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, profile } = useAuth(); // 👈 جلب بيانات المستخدم والبروفايل
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'عن هيليكس', path: '/about' },
    { name: 'الأسعار', path: '/pricing' },
    { name: 'كيف نعمل؟', path: '/how-it-works' },
    { name: 'الفعاليات', path: '/events' },
    { name: 'المدونة', path: '/blog' }
  ];

  const location = useLocation();
  const isBlogPostPage = location.pathname.startsWith('/blog/') && location.pathname !== '/blog';

  return (
    <>
      <nav className={`fixed w-full z-[120] transition-all duration-300 ${
        scrolled || isOpen || isBlogPostPage ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
      }`} dir="rtl">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* Right: Logo icon only */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <Logo className="h-10 w-10" />
            </Link>
          </div>

          {/* Center: Navigation menu */}
          <div className="hidden md:flex flex-grow justify-center items-center gap-6 lg:gap-8 px-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`font-bold transition-colors whitespace-nowrap text-sm lg:text-base ${
                  location.pathname === link.path 
                    ? 'text-orange font-black' 
                    : 'text-forest hover:text-orange'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Left: Action Button & Mobile Toggle */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <a 
              href="/#download" 
              className="bg-forest text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange transition-all text-xs whitespace-nowrap shadow-md shadow-forest/10 hover:scale-105 active:scale-95 duration-300"
            >
              حمل التطبيق الآن
            </a>

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-forest bg-sage/20 rounded-xl relative z-[130]">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

        </div>
      </nav>

      {/* قائمة الموبايل */}
      <div className={`fixed inset-0 bg-forest text-white z-[125] flex flex-col items-center justify-center gap-6 transition-transform duration-500 md:hidden ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            to={link.path} 
            onClick={() => setIsOpen(false)} 
            className={`text-3xl font-black transition-colors ${
              location.pathname === link.path ? 'text-orange' : 'hover:text-orange'
            }`}
          >
            {link.name}
          </Link>
        ))}
        
        <a 
          href="/#download" 
          onClick={() => setIsOpen(false)} 
          className="bg-orange text-white px-10 py-4 rounded-full text-xl font-black mt-4 shadow-lg hover:scale-105 transition-transform"
        >
          حمل التطبيق الآن
        </a>
      </div>
    </>
  );
};

export default Navbar;