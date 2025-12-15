import React, { useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { Check, Upload, Star, Zap, Calculator, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import Button from '../Button';
import toast from 'react-hot-toast';

const PRICING = {
  standard: { base: 500, extra: 100, name: 'Standard' },
  pro: { base: 800, extra: 200, name: 'Pro' }
};

const SubscribeFirstTime: React.FC = () => {
  const { currentProfile } = useFamily();
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState<'standard' | 'pro'>('standard');
  const [subCount, setSubCount] = useState(0);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = PRICING[tier].base + (subCount * PRICING[tier].extra);

  const handleSubmit = async () => {
    if (!receipt || !currentProfile) return;
    setLoading(true);
    try {
      // 1. Upload
      const fileExt = receipt.name.split('.').pop();
      const fileName = `first_sub_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receipt);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

      // 2. Insert Request
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: currentProfile.id,
        amount: totalPrice,
        plan_type: tier,
        status: 'pending',
        receipt_url: urlData.publicUrl,
        renewal_metadata: { sub_count: subCount, type: 'new_subscription' }
      }]);

      if (error) throw error;
      toast.success("تم إرسال طلب الاشتراك! سيتم تفعيل حسابك قريباً");
      window.location.reload(); // Refresh to show pending status
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden max-w-3xl mx-auto my-8">
      {/* Header Banner */}
      <div className="bg-forest p-8 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Crown size={32} className="text-white"/>
            </div>
            <h1 className="text-3xl font-black mb-2">ابدأ رحلة هيليكس الآن 🚀</h1>
            <p className="text-white/80 max-w-md mx-auto">صمم باقتك بنفسك. اختر النظام المناسب لك ولعائلتك وابدأ فوراً.</p>
        </div>
      </div>

      <div className="p-8">
        {/* Progress Bar */}
        <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 w-12 rounded-full transition-all ${s <= step ? 'bg-forest' : 'bg-gray-100'}`}/>
            ))}
        </div>

        {/* Step 1: Tier */}
        {step === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-6">1. اختر نوع الباقة الأساسية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div onClick={() => setTier('standard')} className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${tier === 'standard' ? 'border-gray-600 bg-gray-50' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <Star size={24} className="text-gray-400"/>
                            {tier === 'standard' && <Check className="text-gray-800"/>}
                        </div>
                        <h3 className="text-xl font-bold">Standard</h3>
                        <p className="text-gray-500 text-sm mb-4">الباقة الأساسية للبداية</p>
                        <p className="font-bold text-2xl">{PRICING.standard.base} EGP</p>
                    </div>
                    <div onClick={() => setTier('pro')} className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${tier === 'pro' ? 'border-orange bg-orange/5' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <Zap size={24} className="text-orange"/>
                            {tier === 'pro' && <Check className="text-orange"/>}
                        </div>
                        <h3 className="text-xl font-bold text-orange">Pro Max</h3>
                        <p className="text-gray-500 text-sm mb-4">أعلى متابعة ومميزات</p>
                        <p className="font-bold text-2xl text-orange">{PRICING.pro.base} EGP</p>
                    </div>
                </div>
            </div>
        )}

        {/* Step 2: Members */}
        {step === 2 && (
            <div className="text-center animate-in slide-in-from-right-4 fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-2">2. أضف أفراد عائلتك</h2>
                <p className="text-gray-500 text-sm mb-8">كم حساب فرعي تريد إضافته (بخلاف حسابك)؟</p>
                
                <div className="flex items-center justify-center gap-6 mb-8">
                    <button onClick={() => setSubCount(Math.max(0, subCount - 1))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-xl">-</button>
                    <span className="text-5xl font-black text-forest w-16">{subCount}</span>
                    <button onClick={() => setSubCount(subCount + 1)} className="w-12 h-12 rounded-xl bg-forest text-white hover:bg-forest/90 font-bold text-xl">+</button>
                </div>
                
                <div className="bg-gray-50 inline-block px-6 py-3 rounded-xl">
                    <p className="text-sm text-gray-500">تكلفة الأفراد</p>
                    <p className="font-bold text-lg">+{subCount * PRICING[tier].extra} EGP</p>
                </div>
            </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
            <div className="text-center animate-in slide-in-from-right-4 fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-6">3. ملخص الدفع والتأكيد</h2>
                <div className="bg-forest/5 p-6 rounded-2xl border border-forest/10 max-w-sm mx-auto mb-6">
                    <div className="flex justify-between mb-2"><span>الباقة ({tier})</span><span className="font-bold">{PRICING[tier].base}</span></div>
                    <div className="flex justify-between mb-4"><span>{subCount} أفراد فرعيين</span><span className="font-bold">{subCount * PRICING[tier].extra}</span></div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-black text-forest"><span>الإجمالي</span><span>{totalPrice} EGP</span></div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors relative cursor-pointer max-w-sm mx-auto">
                    <input type="file" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                    {receipt ? (
                        <div className="text-forest font-bold flex items-center justify-center gap-2"><Check size={20}/> {receipt.name}</div>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center"><Upload size={24} className="mb-2"/><p>اضغط لرفع صورة الإيصال</p></div>
                    )}
                </div>
            </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="text-gray-500 font-bold px-4 py-2 hover:bg-gray-50 rounded-xl flex items-center gap-2"><ChevronRight size={16}/> رجوع</button>
            ) : <div></div>}

            {step < 3 ? (
                <Button onClick={() => setStep(step + 1)}>التالي <ChevronLeft size={16} className="mr-2"/></Button>
            ) : (
                <Button onClick={handleSubmit} disabled={!receipt || loading}>{loading ? 'جاري الإرسال...' : 'تأكيد الاشتراك'}</Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default SubscribeFirstTime;