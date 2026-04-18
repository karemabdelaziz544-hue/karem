import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { X, Upload, Check, Loader2, Calculator } from 'lucide-react';
import Button from '../Button';
import toast from 'react-hot-toast';

// تعريف الأسعار (نفس الموجودة في المودال الآخر لتوحيد البيانات)
const PRICING = {
  standard: { base: 500, extra: 100 },
  pro: { base: 800, extra: 200 } // لو حابب تضيف منطق لمعرفة هو برو ولا عادي
};

const QuickRenewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentProfile, familyMembers } = useFamily();
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // حساب التكلفة أوتوماتيكياً بناءً على عدد الأفراد الحاليين
  useEffect(() => {
    if (currentProfile) {
      // حساب عدد التابعين (نطرح 1 عشان المدير مش تابع)
      const subMembersCount = familyMembers.filter(m => m.manager_id === currentProfile.id).length;
      
      // هنا هنفترض إنه بيجدد على باقة Standard افتراضياً
      // لو عندك حقل في الداتا بيز بيشيل نوع الباقة الحالية، ممكن نستخدمه هنا
      const basePrice = PRICING.standard.base; 
      const extraPrice = subMembersCount * PRICING.standard.extra;
      
      setCalculatedAmount(basePrice + extraPrice);
    }
  }, [currentProfile, familyMembers]);

  const handleSubmit = async () => {
    if (!receipt || !currentProfile) return;
    setLoading(true);
    try {
      const fileExt = receipt.name.split('.').pop();
      const fileName = `renew_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receipt);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

      const { error } = await supabase.from('payment_requests').insert([{
        user_id: currentProfile.id,
        amount: calculatedAmount, // 👈 إرسال المبلغ المحسوب وليس 0
        plan_type: 'renewal',
        status: 'pending',
        receipt_url: urlData.publicUrl,
        renewal_metadata: { type: 'quick_renew', member_count: familyMembers.length }
      }]);

      if (error) {
          // لو الخطأ بسبب تكرار الطلب (Constraint Violation)
          if (error.code === '23505') {
              throw new Error("لديك طلب تجديد معلق بالفعل.");
          }
          throw error;
      }

      toast.success("تم إرسال طلب التجديد!");
      onClose();
      // عمل ريفريش للصفحة عشان الحالة تتحدث
      window.location.reload(); 
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        
        <h2 className="text-xl font-black text-gray-800 mb-2 text-center">تجديد الاشتراك الحالي 🔄</h2>
        
        {/* عرض السعر المحسوب */}
        <div className="bg-gray-50 p-4 rounded-2xl mb-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">إجمالي المبلغ المطلوب</p>
            <div className="flex items-center justify-center gap-2 text-3xl font-black text-forest">
                <Calculator size={24}/> {calculatedAmount} <span className="text-sm font-bold text-gray-400">EGP</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">يشمل حسابك + {familyMembers.filter(m => m.manager_id === currentProfile?.id).length} أفراد فرعيين</p>
        </div>

        <p className="text-gray-500 text-center text-sm mb-4">يرجى إرفاق صورة الإيصال بعد التحويل.</p>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative cursor-pointer mb-6">
            <input type="file" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            {receipt ? (
                <div className="text-forest font-bold flex items-center justify-center gap-2"><Check size={20}/> {receipt.name}</div>
            ) : (
                <div className="text-gray-400 flex flex-col items-center">
                    <Upload size={32} className="mb-2"/>
                    <p>إرفاق الإيصال</p>
                </div>
            )}
        </div>

        <Button onClick={handleSubmit} disabled={!receipt || loading} className="w-full justify-center py-3">
            {loading ? <Loader2 className="animate-spin"/> : 'تأكيد التجديد'}
        </Button>
      </div>
    </div>
  );
};

export default QuickRenewModal;