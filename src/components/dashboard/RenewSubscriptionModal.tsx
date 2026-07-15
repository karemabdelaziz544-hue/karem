import React, { useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { X, Check, Upload, AlertCircle, Users, Lock, ChevronLeft } from 'lucide-react';
import Button from '../Button';
import toast from 'react-hot-toast';

type PlanType = 'individual' | 'family_small' | 'family_large';

const PLANS = {
  individual: { name: 'باقة فردية', price: 500, capacity: 0 },
  family_small: { name: 'عائلي (فردين)', price: 900, capacity: 1 }, 
  family_large: { name: 'عائلي (4 أفراد)', price: 1600, capacity: 3 } 
};

const RenewSubscriptionModal: React.FC<{ onClose: () => void; currentPlan: string }> = ({ onClose }) => {
  const { familyMembers, currentProfile } = useFamily();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [selectedMembersToKeep, setSelectedMembersToKeep] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const subMembers = familyMembers.filter(m => m.manager_id === currentProfile?.id);

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    const newCapacity = PLANS[plan].capacity;
    if (subMembers.length > newCapacity) {
      setStep(2); 
      setSelectedMembersToKeep([]); 
    } else {
      setStep(3); 
      setSelectedMembersToKeep(subMembers.map(m => m.id));
    }
  };

  const toggleMemberSelection = (id: string) => {
    if (!selectedPlan) return;
    const max = PLANS[selectedPlan].capacity;

    if (selectedMembersToKeep.includes(id)) {
      setSelectedMembersToKeep(prev => prev.filter(mId => mId !== id));
    } else {
      if (selectedMembersToKeep.length < max) {
        setSelectedMembersToKeep(prev => [...prev, id]);
      } else {
        toast.error(`هذه الباقة تسمح بـ ${max} أفراد فقط`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !receipt || !currentProfile) return;
    setLoading(true);

    try {
      const fileExt = receipt.name.split('.').pop();
      const fileName = `renew_${currentProfile.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receipt);

      if (uploadError) throw uploadError;

      // 👈 التعديل هنا: استخدام fileName كمسار آمن بدلاً من الرابط العام
      const { error } = await supabase.from('payment_requests').insert([{
        user_id: currentProfile.id,
        amount: PLANS[selectedPlan].price,
        plan_type: selectedPlan,
        status: 'pending',
        receipt_url: fileName, // 👈 التعديل
        renewal_metadata: {
          sub_count: PLANS[selectedPlan].capacity,
          keep_member_ids: selectedMembersToKeep
        }
      }]);

      if (error) throw error;

      toast.success("تم إرسال طلب التجديد بنجاح! سيتم مراجعته قريباً");
      onClose();
    } catch (error: any) {
      toast.error("حدث خطأ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">تجديد الاشتراك 🔄</h2>
        
        {step === 1 && (
          <div className="space-y-4 mt-6">
            <p className="text-gray-500 mb-4">اختر الباقة التي تريد التجديد عليها:</p>
            <div className="grid gap-3">
              {(Object.keys(PLANS) as PlanType[]).map((planKey) => (
                <div 
                  key={planKey}
                  onClick={() => handlePlanSelect(planKey)}
                  className="p-4 border-2 rounded-xl cursor-pointer hover:border-forest transition-all flex justify-between items-center group"
                >
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-forest">{PLANS[planKey].name}</h3>
                    <p className="text-xs text-gray-500">تسمح بـ {PLANS[planKey].capacity === 0 ? 'الحساب الأساسي فقط' : `${PLANS[planKey].capacity} حسابات فرعية`}</p>
                  </div>
                  <span className="font-bold text-lg text-forest">{PLANS[planKey].price} EGP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedPlan && (
          <div className="space-y-6 mt-6">
            <div className="bg-orange/10 p-4 rounded-xl border border-orange/20 flex gap-3">
              <AlertCircle className="text-orange shrink-0" />
              <div className="text-sm text-orange/80">
                <p className="font-bold">تنبيه:</p>
                <p>الباقة المختارة ({PLANS[selectedPlan].name}) تدعم عدد أفراد أقل من المسجلين حالياً. يرجى اختيار من تريد الإبقاء عليه، وسيتم <strong>قفل</strong> باقي الحسابات مؤقتاً.</p>
              </div>
            </div>

            <h3 className="font-bold text-gray-700">اختر {PLANS[selectedPlan].capacity} أفراد للإبقاء عليهم:</h3>
            
            <div className="space-y-2">
              {subMembers.map(member => {
                const isSelected = selectedMembersToKeep.includes(member.id);
                const isUserLocked = !isSelected && selectedMembersToKeep.length >= PLANS[selectedPlan].capacity;
                
                return (
                  <div 
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'border-forest bg-forest/5' : 'border-gray-200 hover:bg-gray-50'
                    } ${isUserLocked && !isSelected ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-forest border-forest' : 'border-gray-300'}`}>
                        {isSelected && <Check size={12} className="text-white"/>}
                      </div>
                      <span className="font-bold text-gray-700">{member.full_name}</span>
                    </div>
                    {!isSelected && <Lock size={16} className="text-gray-400"/>}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t">
               <button onClick={() => setStep(1)} className="text-gray-500 font-bold text-sm">رجوع</button>
               <Button 
                 onClick={() => setStep(3)} 
                 disabled={selectedMembersToKeep.length === 0 && PLANS[selectedPlan].capacity > 0} 
               >
                 متابعة للدفع
               </Button>
            </div>
          </div>
        )}

        {step === 3 && selectedPlan && (
           <div className="space-y-6 mt-6">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                 <p className="text-gray-500 text-sm mb-1">المبلغ المطلوب</p>
                 <p className="text-3xl font-black text-forest">{PLANS[selectedPlan].price} EGP</p>
                 <p className="text-xs text-gray-400 mt-2">فودافون كاش: 010xxxxxxx</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">إرفاق إيصال التحويل</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                   <input type="file" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                   {receipt ? (
                     <div className="text-forest font-bold flex items-center justify-center gap-2">
                       <Check size={20}/> {receipt.name}
                     </div>
                   ) : (
                     <div className="text-gray-400">
                       <Upload size={32} className="mx-auto mb-2"/>
                       <p>اضغط لرفع صورة الإيصال</p>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                 <button onClick={() => setStep(subMembers.length > PLANS[selectedPlan].capacity ? 2 : 1)} className="text-gray-500 font-bold text-sm">رجوع</button>
                 <Button onClick={handleSubmit} disabled={!receipt || loading}>
                   {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                 </Button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default RenewSubscriptionModal;