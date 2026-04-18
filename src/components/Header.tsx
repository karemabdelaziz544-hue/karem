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
    { name: 'عن هيليكس', path: '/#about-us' },
    { name: 'الفعاليات', path: '/#events' },
    { name: 'المدونة', path: '/blog' },
    { name: 'الأسئلة الشائعة', path: '/#faq' },
  ];

  return (
    <>
      <nav className={`fixed w-full z-[120] transition-all duration-300 ${
        scrolled || isOpen ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`} dir="rtl">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="font-black text-2xl tracking-tighter text-forest">HEALIX</span>
          </Link>

          {/* الروابط لنسخة الديسكتوب */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.path} className="font-bold text-forest hover:text-orange transition-colors">
                {link.name}
              </a>
            ))}

            {/* 👇 الجزء السحري لزرار الدخول */}
            {!user ? (
              <Link to="/login" className="bg-forest text-white px-6 py-2 rounded-full font-bold hover:bg-orange transition-all">
                تسجيل دخول
              </Link>
            ) : (
              <Link 
                to={profile?.role === 'admin' ? '/admin' : profile?.role === 'doctor' ? '/doctor-dashboard' : '/dashboard'} 
                className="flex items-center gap-2 bg-orange text-white px-5 py-2 rounded-full font-bold hover:bg-forest transition-all"
              >
                {profile?.role === 'admin' ? <Layout size={18} /> : <UserCircle size={18} />}
              {profile?.role === 'admin' ? 'لوحة التحكم' : profile?.role === 'doctor' ? 'لوحة الدكتور' : 'حسابي الشخصي'}
                
              </Link>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-forest bg-sage/20 rounded-xl relative z-[130]">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* قائمة الموبايل */}
      <div className={`fixed inset-0 bg-forest text-white z-[125] flex flex-col items-center justify-center gap-6 transition-transform duration-500 md:hidden ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        {navLinks.map((link) => (
          <a key={link.name} href={link.path} onClick={() => setIsOpen(false)} className="text-3xl font-black hover:text-orange">
            {link.name}
          </a>
        ))}
        
        {/* 👇 زرار الدخول في الموبايل */}
        {!user ? (
          <Link to="/login" onClick={() => setIsOpen(false)} className="bg-orange text-white px-10 py-4 rounded-full text-xl font-black mt-4">
            تسجيل دخول
          </Link>
        ) : (
          <Link 
            to={profile?.role === 'admin' ? '/admin' : '/dashboard'} 
            onClick={() => setIsOpen(false)}
            className="bg-white text-forest px-10 py-4 rounded-full text-xl font-black mt-4 flex items-center gap-3"
          >
            {profile?.role === 'admin' ? 'لوحة التحكم ⚙️' : 'ملفي الشخصي 👤'}
          </Link>
          
        )}
      </div>
    </>
  );
};

export default Navbar;