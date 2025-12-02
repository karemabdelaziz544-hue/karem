import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle, User, LogOut } from 'lucide-react'; // ضفنا أيقونات جديدة
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext'; // استيراد السياق الجديد

const Header: React.FC = () => {
  const { user, signOut } = useAuth(); // قراءة حالة المستخدم
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ... (كود الـ Scroll زي ما هو) ...
  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'المدونة الطبية', href: '/blog' },
    { name: 'فريقنا الطبي', href: '/#medical-team' },
    { name: 'باقات الاشتراك', href: '/#pricing' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-12 py-4 ${
        isScrolled ? 'bg-cream/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <Logo className="h-14 w-14 shadow-lg rounded-2xl" />
          <span className="text-2xl font-bold text-forest tracking-tight transition-colors duration-300 group-hover:text-orange">
            هيليكس
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-forest/80 hover:text-orange font-medium transition-colors text-lg">
              {link.name}
            </a>
          ))}
        </nav>

        {/* الأزرار الذكية (تتغير حسب الدخول) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            // لو مسجل دخول: اعرض زر الداشبورد وتسجيل الخروج
            <>
              <Link to="/dashboard">
                <Button variant="outline" className="!py-2">
                  <User size={18} />
                  لوحة التحكم
                </Button>
              </Link>
              <button onClick={handleLogout} className="text-forest hover:text-red-500 transition-colors p-2" title="تسجيل خروج">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            // لو مش مسجل: اعرض زر الدخول وتواصل معنا
            <>
              <Link to="/login">
                <button className="font-bold text-forest hover:text-orange transition-colors px-4 py-2">
                  دخول
                </button>
              </Link>
              <Button variant="primary" onClick={() => window.open('https://wa.me/123456789', '_blank')}>
                <MessageCircle size={18} />
                <span>تواصل معنا</span>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-forest" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      
      {/* ... (Mobile Nav زي ما هو، ممكن تعدله بنفس المنطق لو حبيت) ... */}
    </motion.header>
  );
};

export default Header;