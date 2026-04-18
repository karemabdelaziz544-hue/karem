import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("خطأ في بيانات الدخول: " + error.message);
      setLoading(false);
      return;
    }

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // التوجيه الذكي بناءً على الرتبة
      switch (profile?.role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'doctor':
          navigate('/doctor-dashboard', { replace: true });
          break;
        case 'client':
          navigate('/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
      toast.success('تم تسجيل الدخول بنجاح');
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

        <h2 className="text-3xl font-extrabold text-forest mb-2 text-center font-tajawal">مرحباً بعودتك</h2>
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