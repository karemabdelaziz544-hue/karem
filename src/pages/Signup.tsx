import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'male', // 👈 القيمة الافتراضية
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  // دالة عامة لتحديث المدخلات (text inputs)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            gender: formData.gender // 👈 إرسال النوع للتريجر
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // تحديث الهاتف لضمان حفظه (خطوة تأكيدية)
        await supabase
          .from('profiles')
          .update({ phone: formData.phone })
          .eq('id', data.user.id);

        toast.success("تم إنشاء الحساب بنجاح! 🎉");
        navigate('/dashboard'); 
      }
    } catch (error: any) {
      console.error(error);
      toast.error("فشل إنشاء الحساب: " + (error.message || "خطأ غير معروف"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 relative overflow-hidden">
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

          <div className="grid grid-cols-2 gap-4">
            <Input 
                label="رقم الهاتف" 
                name="phone"
                type="tel" 
                placeholder="01xxxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                required
            />
            
            {/* 👇 قائمة اختيار النوع الجديدة */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">النوع</label>
                <div className="relative">
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all bg-gray-50 appearance-none cursor-pointer"
                    >
                        <option value="male">ذكر 👨</option>
                        <option value="female">أنثى 👩</option>
                    </select>
                    {/* سهم صغير للتجميل */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
            </div>
          </div>
          
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