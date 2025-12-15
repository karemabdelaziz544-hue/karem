import React, { useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { X, Check, Upload, Users, Lock, Zap, Star, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import Button from '../Button';
import toast from 'react-hot-toast';

// 💰 إعدادات الأسعار (عدلها براحتك)
const PRICING = {
  standard: { base: 500, extra: 100, name: 'Standard' },
  pro: { base: 800, extra: 200, name: 'Pro' }
};

const ModifySubscriptionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { familyMembers, currentProfile } = useFamily();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [tier, setTier] = useState<'standard' | 'pro'>('standard');
  const [subCount, setSubCount] = useState(0); // عدد الأفراد الفرعيين الجدد
  const [selectedMembersToKeep, setSelectedMembersToKeep] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<File | null>(null);

  // الحسابات الحالية
  const subMembers = familyMembers.filter(m => m.manager_id === currentProfile?.id);
  const currentSubCount = subMembers.length;

  // 🧮 حساب السعر
  const totalPrice = PRICING[tier].base + (subCount * PRICING[tier].extra);

  // منطق اختيار الأعضاء (لو العدد الجديد أقل من القديم)
  const toggleMemberSelection = (id: string) => {
    if (selectedMembersToKeep.includes(id)) {
      setSelectedMembersToKeep(prev => prev.filter(mId => mId !== id));
    } else {
      if (selectedMembersToKeep.length < subCount) {
        setSelectedMembersToKeep(prev => [...prev, id]);
      } else {
        toast.error(`لقد اخترت ${subCount} أفراد بالفعل`);
      }
    }
  };

  // الانتقال للخطوة التالية
  const handleNext = () => {
    if (step === 2) {
      // لو قلل العدد، لازم يختار مين يفضل
      if (subCount < currentSubCount) {
        setSelectedMembersToKeep([]); // تصفير الاختيارات للبدء
        setStep(3);
      } else {
        // لو زود العدد أو سابه زي ما هو، نتخطى خطوة القفل
        setSelectedMembersToKeep(subMembers.map(m => m.id)); // نختار الكل تلقائي
        setStep(4);
      }
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!receipt || !currentProfile) return;
    setLoading(true);

    try {
      // 1. رفع الإيصال
      const fileExt = receipt.name.split('.').pop();
      const fileName = `modify_${Date.now()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage.from('receipts').upload(fileName, receipt);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

      // 2. إرسال الطلب
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: currentProfile.id,
        amount: totalPrice,
        plan_type: tier, // standard or pro
        status: 'pending',
        receipt_url: urlData.publicUrl,
        renewal_metadata: {
            sub_count: subCount,
            keep_member_ids: selectedMembersToKeep
        }
      }]);

      if (error) throw error;
      toast.success("تم إرسال طلب تعديل الباقة بنجاح!");
      onClose();
    } catch (error: any) {
      toast.error("حدث خطأ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative animate-in zoom-in-95 flex flex-col">
        
        {/* Header with Progress */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-800">تعديل الباقة ⚙️</h2>
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(s => (
                   <div key={s} className={`h-2 w-8 rounded-full transition-colors ${s <= step ? 'bg-forest' : 'bg-gray-200'}`} />
                ))}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
            
            {/* Step 1: Choose Tier */}
            {step === 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-700">1. اختر نوع الباقة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Standard */}
                        <div 
                            onClick={() => setTier('standard')}
                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 hover:scale-105 ${tier === 'standard' ? 'border-gray-500 bg-gray-50' : 'border-gray-100'}`}
                        >
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600"><Star size={24}/></div>
                            <div>
                                <h4 className="font-bold text-xl text-gray-800">Standard</h4>
                                <p className="text-sm text-gray-500">الباقة الأساسية</p>
                            </div>
                            <div className="mt-2">
                                <span className="block text-lg font-bold">{PRICING.standard.base} EGP</span>
                                <span className="text-xs text-gray-400">+ {PRICING.standard.extra} EGP لكل فرد</span>
                            </div>
                            {tier === 'standard' && <div className="bg-gray-800 text-white p-1 rounded-full absolute top-4 right-4"><Check size={14}/></div>}
                        </div>

                        {/* Pro */}
                        <div 
                            onClick={() => setTier('pro')}
                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 hover:scale-105 ${tier === 'pro' ? 'border-orange bg-orange/5' : 'border-gray-100'}`}
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-orange to-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange/30"><Zap size={24}/></div>
                            <div>
                                <h4 className="font-bold text-xl text-gray-800">Pro Max</h4>
                                <p className="text-sm text-gray-500">أعلى مميزات ومتابعة</p>
                            </div>
                            <div className="mt-2">
                                <span className="block text-lg font-bold text-orange">{PRICING.pro.base} EGP</span>
                                <span className="text-xs text-gray-400">+ {PRICING.pro.extra} EGP لكل فرد</span>
                            </div>
                            {tier === 'pro' && <div className="bg-orange text-white p-1 rounded-full absolute top-4 right-4"><Check size={14}/></div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Family Size */}
            {step === 2 && (
                <div className="space-y-6 text-center py-4">
                    <h3 className="text-lg font-bold text-gray-700">2. حدد عدد الأفراد الإضافيين (الفرعيين)</h3>
                    <p className="text-gray-500 text-sm">كم حساب فرعي تريد إضافته بجانب حسابك الرئيسي؟</p>
                    
                    <div className="flex items-center justify-center gap-6">
                        <button onClick={() => setSubCount(Math.max(0, subCount - 1))} className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 text-2xl font-bold">-</button>
                        <div className="text-5xl font-black text-forest w-20">{subCount}</div>
                        <button onClick={() => setSubCount(subCount + 1)} className="w-12 h-12 bg-forest text-white rounded-xl flex items-center justify-center hover:bg-forest/90 text-2xl font-bold">+</button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl inline-block mt-4">
                        <p className="text-sm text-gray-500">إجمالي المبلغ المطلوب</p>
                        <p className="text-3xl font-black text-forest flex items-center justify-center gap-2">
                            <Calculator size={20}/> {totalPrice} EGP
                        </p>
                    </div>
                </div>
            )}

            {/* Step 3: Who to keep (Downgrade Logic) */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                        <Lock className="text-red-500 shrink-0"/>
                        <div className="text-sm text-red-600">
                            <p className="font-bold">تنبيه تقليل العدد:</p>
                            <p>أنت اخترت {subCount} أفراد فقط، بينما لديك حالياً {currentSubCount} أفراد. يرجى اختيار من سيبقى مففعلاً، وسيتم قفل الباقي.</p>
                        </div>
                    </div>

                    <h3 className="font-bold text-gray-700">اختر {subCount} أفراد للإبقاء عليهم:</h3>
                    <div className="space-y-2">
                        {subMembers.map(member => {
                            const isSelected = selectedMembersToKeep.includes(member.id);
                            const isLockedUI = !isSelected && selectedMembersToKeep.length >= subCount;
                            return (
                                <div 
                                    key={member.id}
                                    onClick={() => toggleMemberSelection(member.id)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'border-forest bg-forest/5' : 'border-gray-200'} ${isLockedUI && !isSelected ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-forest border-forest' : 'border-gray-300'}`}>
                                            {isSelected && <Check size={12} className="text-white"/>}
                                        </div>
                                        <span className="font-bold">{member.full_name}</span>
                                    </div>
                                    {!isSelected && <Lock size={16} className="text-gray-400"/>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
                <div className="space-y-6 text-center">
                    <h3 className="text-lg font-bold text-gray-700">4. تأكيد الدفع</h3>
                    <div className="bg-forest/5 p-6 rounded-2xl border border-forest/10">
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-gray-500">نوع الباقة:</span>
                            <span className="font-bold">{PRICING[tier].name}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-gray-500">عدد الأفراد الفرعيين:</span>
                            <span className="font-bold">{subCount}</span>
                        </div>
                        <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center text-lg">
                            <span className="font-bold text-gray-700">الإجمالي:</span>
                            <span className="font-black text-forest">{totalPrice} EGP</span>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors relative cursor-pointer">
                        <input type="file" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        {receipt ? (
                            <div className="text-forest font-bold flex items-center justify-center gap-2"><Check size={20}/> {receipt.name}</div>
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <Upload size={32} className="mb-2"/>
                                <p>اضغط لرفع صورة إيصال التحويل</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="text-gray-500 font-bold px-4 py-2 flex items-center gap-2 hover:bg-gray-100 rounded-xl"><ChevronRight size={16}/> رجوع</button>
            ) : (
                <div></div>
            )}
            
            {step < 4 ? (
                <Button onClick={handleNext} disabled={step === 3 && selectedMembersToKeep.length !== subCount}>
                    التالي <ChevronLeft size={16} className="mr-2"/>
                </Button>
            ) : (
                <Button onClick={handleSubmit} disabled={!receipt || loading} className="px-8">
                    {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                </Button>
            )}
        </div>

      </div>
    </div>
  );
};

export default ModifySubscriptionModal;