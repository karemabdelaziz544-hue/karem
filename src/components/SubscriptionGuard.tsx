import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import Button from './Button'; 
import { useFamily } from '../contexts/FamilyContext'; // 👈 استيراد سياق العائلة

const SubscriptionGuard: React.FC = () => {
  const navigate = useNavigate();
  const { currentProfile } = useFamily(); // 👈 جلب بيانات البروفايل للتحقق من القفل

  // 1. حالة الحساب المقفول (بسبب تقليل الباقة أو إجراء إداري)
  if (currentProfile?.is_locked) {
     return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8 animate-in zoom-in-95">
           <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse border-4 border-white shadow-xl">
              <Lock size={40} />
           </div>
           <h2 className="text-3xl font-black text-gray-800 mb-3">هذا الحساب مقفل مؤقتاً 🔒</h2>
           <p className="text-gray-500 max-w-md mb-8 leading-relaxed text-lg">
             تم تقليص باقة الاشتراك العائلي ولم يتم اختيار هذا الحساب ضمن الباقة الجديدة. يرجى التواصل مع مدير الحساب (الأب/الأم) لإعادة تفعيله.
           </p>
        </div>
     );
  }

  // 2. حالة الاشتراك المنتهي (الكود الأصلي)
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8 animate-in zoom-in-95">
      <div className="w-24 h-24 bg-orange/10 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl">
        <Lock size={40} className="text-orange" />
      </div>
      <h2 className="text-3xl font-black text-forest mb-3">هذه الميزة للمشتركين فقط 🔒</h2>
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed text-lg">
        للاستفادة من الدعم الطبي المباشر، تحليلات InBody، ومتابعة العادات، يرجى تفعيل اشتراكك أولاً لبدء رحلتك الصحية.
      </p>
      <Button 
        onClick={() => navigate('/dashboard/subscriptions')}
        className="px-10 py-4 text-lg shadow-xl shadow-orange/20 hover:scale-105 transition-transform"
      >
        <Crown size={22} className="ml-2"/>
        اشترك الآن
      </Button>
    </div>
  );
};

export default SubscriptionGuard;