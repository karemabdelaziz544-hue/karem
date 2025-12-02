import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. تسجيل الدخول في Supabase Auth
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("خطأ في بيانات الدخول: " + error.message);
      setLoading(false);
      return;
    }

    if (user) {
      // 2. فحص دور المستخدم من جدول Profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // 3. التوجيه الذكي
      if (profile?.role === 'admin') {
        navigate('/admin', { replace: true }); // لو أدمن -> روح لوحة الإدارة
      } else {
        navigate('/dashboard', { replace: true }); // لو عميل -> روح الداشبورد
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-forest/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-sage/30 w-full max-w-md relative z-10 text-right"
      >
        <div className="flex justify-center mb-8">
          <Link to="/">
             <Logo className="h-16 w-16 shadow-lg rounded-2xl" />
          </Link>
        </div>

        <h2 className="text-3xl font-extrabold text-forest mb-2 text-center">مرحباً بعودتك</h2>
        <p className="text-gray-500 text-center mb-8 font-medium">سجل دخولك للمتابعة</p>

        <form onSubmit={handleLogin}>
          <Input 
            label="البريد الإلكتروني" 
            type="email" 
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Input 
            label="كلمة المرور" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-between items-center mb-6 text-sm font-bold">
            <a href="#" className="text-orange hover:underline">نسيت كلمة المرور؟</a>
            <label className="flex items-center gap-2 cursor-pointer text-forest">
              <input type="checkbox" className="rounded accent-orange" />
              <span>تذكرني</span>
            </label>
          </div>

          <Button className="w-full justify-center py-4 text-lg" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="mt-8 text-center text-forest font-medium">
          ليس لديك حساب؟{' '}
          <Link to="/signup" className="text-orange font-bold hover:underline">
            أنشئ حساب جديد
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;