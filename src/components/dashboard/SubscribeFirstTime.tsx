import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useFamily } from '../../contexts/FamilyContext';
import { Check, Upload, Sparkles } from 'lucide-react';
import Button from '../Button';
import toast from 'react-hot-toast';

const PRICING = { base: 500, extra: 150 };

const SubscribeFirstTime: React.FC = () => {
  const { currentProfile } = useFamily();
  const [subCount, setSubCount] = useState(0);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = PRICING.base + (subCount * PRICING.extra);

  const handleSubscribe = async () => {
    if (!receipt || !currentProfile) return;
    setLoading(true);
    try {
      const fileName = `new_sub_${Date.now()}.jpg`;
      await supabase.storage.from('receipts').upload(fileName, receipt);
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

      await supabase.from('payment_requests').insert([{
        user_id: currentProfile.id,
        amount: totalPrice,
        plan_type: 'helix_family_plan',
        status: 'pending',
        receipt_url: urlData.publicUrl,
        renewal_metadata: { sub_count: subCount }
      }]);

      toast.success("تم إرسال طلب اشتراكك بنجاح!");
      window.location.reload();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-[2.5rem] shadow-xl border border-gray-100" dir="rtl">
      <div className="text-center space-y-4 mb-8">
        <div className="w-20 h-20 bg-forest/10 text-forest rounded-3xl flex items-center justify-center mx-auto"><Sparkles size={40}/></div>
        <h2 className="text-3xl font-black text-slate-800">ابدأ رحلتك مع هيليكس</h2>
        <p className="text-gray-500 font-medium text-sm">باقة واحدة متكاملة لك ولعائلتك</p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-3xl text-center">
            <h3 className="font-bold text-slate-700 mb-4">كم فرداً سيشترك معك؟</h3>
            <div className="flex items-center justify-center gap-6">
                <button onClick={() => setSubCount(Math.max(0, subCount - 1))} className="w-12 h-12 bg-white rounded-2xl shadow-sm text-2xl font-bold">-</button>
                <span className="text-5xl font-black text-forest w-16">{subCount}</span>
                <button onClick={() => setSubCount(subCount + 1)} className="w-12 h-12 bg-forest text-white rounded-2xl shadow-sm text-2xl font-bold">+</button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-gray-400">إجمالي مبلغ الاشتراك</p>
                <p className="text-4xl font-black text-slate-800">{totalPrice} EGP</p>
            </div>
        </div>

        <div className="space-y-3">
            {["نظام غذائي يومي", "تتبع مياه", "شات مباشر", "حساب لكل فرد"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Check size={16} className="text-green-500" strokeWidth={3}/> {f}
                </div>
            ))}
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center relative cursor-pointer hover:bg-gray-50 group">
            <input type="file" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            {receipt ? <p className="text-forest font-bold">{receipt.name}</p> : <div className="text-gray-400 flex flex-col items-center"><Upload size={32} className="mb-2"/><p>ارفع إيصال التحويل لتفعيل الباقة</p></div>}
        </div>

        <Button 
          onClick={() => { if (!loading && receipt) handleSubscribe(); }} 
          className={`w-full py-4 text-lg ${(!receipt || loading) ? 'opacity-50' : ''}`}
        >
          {loading ? 'جاري الإرسال...' : 'اشترك الآن'}
        </Button>
      </div>
    </div>
  );
};

export default SubscribeFirstTime;