import React, { useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { X, Check, Upload, Users, Lock, ChevronLeft, ChevronRight, Calculator, Sparkles } from 'lucide-react';
import Button from '../Button';
import toast from 'react-hot-toast';

const PRICING = { base: 500, extra: 150 };

const ModifySubscriptionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { familyMembers, currentProfile } = useFamily();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const subMembers = familyMembers.filter(m => m.manager_id === currentProfile?.id);
  const currentSubCount = subMembers.length;
  const [subCount, setSubCount] = useState(currentSubCount); 
  const [selectedMembersToKeep, setSelectedMembersToKeep] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<File | null>(null);

  const totalPrice = PRICING.base + (subCount * PRICING.extra);

  // 1. تحديث دالة الاختيار لتكون حرة ومنطقية
  const toggleMemberSelection = (id: string) => {
    setSelectedMembersToKeep(prev => {
      if (prev.includes(id)) {
        return prev.filter(mId => mId !== id); 
      } else {
        if (prev.length < subCount) {
          return [...prev, id];
        } else {
          toast.error(`أقصى عدد مسموح به في باقتك الجديدة هو ${subCount} أفراد`);
          return prev;
        }
      }
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (subCount < currentSubCount) {
        // لو قلل العدد، يختار يدوي من يفضل
        setSelectedMembersToKeep([]);
        setStep(2);
      } else {
        // لو زود العدد أو ثبت، نختار الجميع تلقائياً وننتقل للدفع
        const allCurrentIds = subMembers.map(m => m.id);
        setSelectedMembersToKeep(allCurrentIds);
        setStep(3);
      }
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!receipt || !currentProfile) return;
    setLoading(true);
    try {
      const fileName = `modify_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('receipts').upload(fileName, receipt);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

      // إرسال طلب واحد منظم يحتوي على كافة التفاصيل للأدمن
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: currentProfile.id,
        amount: totalPrice,
        plan_type: 'helix_integrated',
        status: 'pending',
        receipt_url: urlData.publicUrl,
        renewal_metadata: { 
            sub_count: subCount, 
            keep_member_ids: selectedMembersToKeep,
            action_type: subCount < currentSubCount ? 'downgrade' : 'upgrade',
            updated_at: new Date().toISOString()
        }
      }]);

      if (error) throw error;
      toast.success("تم إرسال طلبك بنجاح!");
      onClose();
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 relative flex flex-col animate-in zoom-in-95 max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-800">إدارة العائلة ⚙️</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
            {step === 1 && (
                <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-forest/10 text-forest rounded-[1.5rem] flex items-center justify-center mx-auto"><Users size={40} /></div>
                    <h3 className="text-xl font-bold">تعديل عدد أفراد العائلة</h3>
                    <div className="flex items-center justify-center gap-6 py-6">
                        <button onClick={() => setSubCount(Math.max(0, subCount - 1))} className="w-12 h-12 bg-gray-100 rounded-2xl text-2xl font-bold">-</button>
                        <div className="text-5xl font-black text-forest w-20">{subCount}</div>
                        <button onClick={() => setSubCount(subCount + 1)} className="w-12 h-12 bg-forest text-white rounded-2xl text-2xl font-bold">+</button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="text-sm text-gray-500">التكلفة الشهرية الجديدة</p>
                        <p className="text-4xl font-black text-forest mt-1">{totalPrice} EGP</p>
                    </div>
                </div>
            )}

            {/* 2. تحديث واجهة الخطوة الثانية (Step 2) لضمان وضوح الحالة */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
                  <Users className="shrink-0" size={20}/>
                  <p className="text-xs font-bold">
                    لقد اخترت {subCount} أفراد. يرجى الضغط على الأسماء التي تريد "تفعيلها" في الباقة الجديدة.
                  </p>
                </div>
                
                <div className="space-y-2">
                  {subMembers.map(member => {
                    const isSelected = selectedMembersToKeep.includes(member.id);
                    return (
                      <div 
                        key={member.id} 
                        onClick={() => toggleMemberSelection(member.id)} 
                        className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'border-forest bg-forest/5 shadow-sm' : 'border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'bg-forest border-forest' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" strokeWidth={4}/>}
                          </div>
                          <span className={`font-bold ${isSelected ? 'text-forest' : 'text-gray-400'}`}>
                            {member.full_name}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="text-[10px] font-black text-forest bg-forest/10 px-2 py-0.5 rounded-full">مُختار</span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">سيتم إيقافه</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center text-xs font-bold text-gray-400 mt-4">
                  تم اختيار {selectedMembersToKeep.length} من أصل {subCount}
                </div>
              </div>
            )}

            {step === 3 && (
                <div className="space-y-6 text-center">
                    <h3 className="text-lg font-bold text-center">تأكيد الدفع</h3>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-2 text-right">
                        <div className="flex justify-between opacity-70"><span>عدد الأفراد:</span><span>{subCount + 1}</span></div>
                        <div className="flex justify-between text-xl font-bold border-t border-white/10 pt-2"><span>الإجمالي المطلوب:</span><span>{totalPrice} EGP</span></div>
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 relative cursor-pointer hover:bg-gray-50 group">
                        <input type="file" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        {receipt ? <p className="text-forest font-bold">{receipt.name}</p> : <div className="text-gray-400 flex flex-col items-center"><Upload size={32} className="mb-2" />ارفع صورة إيصال التحويل</div>}
                    </div>
                </div>
            )}
        </div>

        <div className="flex justify-between mt-8 border-t pt-4">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="text-gray-400 font-bold px-6 py-2 hover:bg-gray-50 rounded-xl">رجوع</button>}
            <div className="mr-auto">
              <Button 
                onClick={() => {
                  if (loading) return;
                  if (step < 3) {
                    if (step === 2 && selectedMembersToKeep.length !== subCount) {
                       toast.error(`يرجى اختيار ${subCount} أفراد للمتابعة`);
                       return;
                    }
                    handleNext();
                  } else {
                    handleSubmit();
                  }
                }} 
                className={`px-10 ${(loading || (step === 2 && selectedMembersToKeep.length !== subCount)) ? 'opacity-50' : ''}`}
              >
                {loading ? 'جاري الإرسال...' : (step === 3 ? 'تأكيد وإرسال الطلب' : 'التالي')}
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModifySubscriptionModal;