import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate مستوردة هنا
import { motion } from 'framer-motion';
// import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react'; // لو محتاجهم فعلهم
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase'; // تأكد أن المسار صحيح لمجلد lib

const Signup: React.FC = () => {
  // 1. تعريف الهوك في بداية المكون (وليس داخل الدالة)
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. دالة التسجيل (واحدة فقط ونظيفة)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("كلمات المرور غير متطابقة");
      return;
    }
    setLoading(true);

    // 1. تسجيل المستخدم (Auth)
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      alert("فشل إنشاء الحساب: " + error.message);
      setLoading(false);
      return;
    }

    // 2. بمجرد نجاح التسجيل، نزرع البيانات يدوياً في الجدول
    if (data.user) {
      console.log("تم إنشاء المستخدم، جاري حفظ البيانات...", data.user.id);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([ // استخدمنا insert بدلاً من upsert للتأكد
          { 
            id: data.user.id,
            full_name: formData.name,
            phone: formData.phone,
            subscription_status: 'new',
            role: 'client'
          }
        ]);

      if (profileError) {
        console.error("كارثة! فشل حفظ البروفايل:", profileError);
        alert("تم التسجيل لكن فشل حفظ البيانات: " + profileError.message);
      } else {
        console.log("تم حفظ البروفايل بنجاح!");
        alert("تم التسجيل بنجاح! راجع بريدك للتفعيل.");
        navigate('/login');
      }
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية جمالية */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-forest/5 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-sage/30 w-full max-w-lg relative z-10 text-right"
      >
        <div className="flex justify-center mb-6">
          <Link to="/">
             <Logo className="h-14 w-14 shadow-lg rounded-2xl" />
          </Link>
        </div>

        <h2 className="text-3xl font-extrabold text-forest mb-2 text-center">انضم لعائلة هيليكس</h2>
        <p className="text-gray-500 text-center mb-8 font-medium">ابدأ رحلة صحية جديدة ومخصصة لك</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input 
            label="الاسم بالكامل" 
            name="name"
            type="text" 
            placeholder="مثال: أحمد محمد"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input 
            label="البريد الإلكتروني" 
            name="email"
            type="email" 
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input 
            label="رقم الهاتف (واتساب)" 
            name="phone"
            type="tel" 
            placeholder="01xxxxxxxxx"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="كلمة المرور" 
              name="password"
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input 
              label="تأكيد كلمة المرور" 
              name="confirmPassword"
              type="password" 
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pt-2">
            <Button className="w-full justify-center py-4 text-lg" disabled={loading}>
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-forest font-medium text-sm">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-orange font-bold hover:underline">
            سجل دخولك
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;