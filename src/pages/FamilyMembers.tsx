import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👇 استيراد للتوجيه
import { useFamily } from '../contexts/FamilyContext';
import { supabase } from '../lib/supabase';
import { Plus, User, Trash2, Crown, Baby, Activity, Save, X, Loader2, Lock } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const FamilyMembers: React.FC = () => {
  const { familyMembers, refreshFamily, currentProfile, switchProfile } = useFamily();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // 👇 1. التحقق الصارم من الاشتراك (نفس منطق الداشبورد)
  const isSubscribed = currentProfile?.subscription_status === 'active' && 
                       (!currentProfile.subscription_end_date || new Date(currentProfile.subscription_end_date) > new Date());

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male',
    birthDate: '',
    relation: 'son',
    height: '',
    weight: ''
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    // حماية إضافية في الكود
    if (!isSubscribed) return toast.error("يجب الاشتراك أولاً");
    
    setLoading(true);

    try {
        const { error } = await supabase.rpc('create_sub_member', {
            member_name: formData.fullName,
            member_gender: formData.gender,
            member_birth: formData.birthDate,
            member_relation: formData.relation,
            member_height: Number(formData.height),
            member_weight: Number(formData.weight)
        });

        if (error) throw error;

        toast.success("تم إضافة الفرد بنجاح 🎉");
        setShowForm(false);
        setFormData({ fullName: '', gender: 'male', birthDate: '', relation: 'son', height: '', weight: '' });
        refreshFamily();

    } catch (error: any) {
        toast.error(error.message); // ستظهر رسالة الخطأ من قاعدة البيانات هنا
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
      if (!window.confirm("هل أنت متأكد من حذف هذا الفرد؟")) return;
      try {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) throw error;
          toast.success("تم الحذف");
          refreshFamily();
          if (currentProfile?.id === id) {
             const mainUser = familyMembers.find(m => !m.manager_id);
             if (mainUser) switchProfile(mainUser.id);
          }
      } catch (error: any) {
          toast.error("فشل الحذف: " + error.message);
      }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-black text-forest flex items-center gap-2">
                <Baby className="text-orange" /> إدارة العائلة
            </h1>
            <p className="text-gray-500 text-sm mt-1">أضف أفراد عائلتك لادارتهم تحت حساب واحد</p>
        </div>
        
        {/* 👇 2. إخفاء زر الإضافة وإظهار زر الاشتراك لو مش مشترك */}
        {isSubscribed ? (
            <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-forest text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-forest/90 transition-colors flex items-center gap-2 shadow-lg shadow-forest/20"
            >
                {showForm ? <X size={18}/> : <Plus size={18}/>}
                {showForm ? 'إلغاء' : 'إضافة فرد جديد'}
            </button>
        ) : (
            <button 
                onClick={() => navigate('/dashboard/subscriptions')}
                className="bg-orange/10 text-orange px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange/20 transition-colors flex items-center gap-2 border border-orange/20"
            >
                <Lock size={16}/> اشترك للإضافة
            </button>
        )}
      </div>

      {/* لو حاول يفتح الفورم وهو مش مشترك (حماية إضافية) */}
      {!isSubscribed && showForm && setShowForm(false)}

      {/* Form */}
      {showForm && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-orange/20 mb-8 animate-in slide-in-from-top-4">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">بيانات الفرد الجديد</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                  <Input 
                    label="الاسم بالكامل" 
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                    placeholder="مثال: يوسف أحمد"
                    required 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ الميلاد</label>
                          <input 
                            type="date" 
                            value={formData.birthDate} 
                            onChange={e => setFormData({...formData, birthDate: e.target.value})} 
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-forest outline-none"
                            required 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">صلة القرابة</label>
                          <select 
                            value={formData.relation} 
                            onChange={e => setFormData({...formData, relation: e.target.value})}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-forest outline-none"
                          >
                              <option value="son">ابن</option>
                              <option value="daughter">ابنة</option>
                              <option value="spouse">زوج/زوجة</option>
                              <option value="parent">والد/والدة</option>
                              <option value="other">آخر</option>
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">النوع</label>
                          <select 
                             value={formData.gender} 
                             onChange={e => setFormData({...formData, gender: e.target.value})}
                             className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-forest outline-none"
                          >
                              <option value="male">ذكر</option>
                              <option value="female">أنثى</option>
                          </select>
                      </div>
                      <Input label="الوزن (Kg)" type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} required />
                      <Input label="الطول (cm)" type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} required />
                  </div>

                  <div className="pt-4">
                      <Button className="w-full justify-center py-3" disabled={loading}>
                          {loading ? <Loader2 className="animate-spin"/> : <><Save size={18} className="ml-2"/> حفظ وإضافة</>}
                      </Button>
                  </div>
              </form>
          </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyMembers.map(member => {
              const isMain = !member.manager_id;
              const isActive = currentProfile?.id === member.id;
              
              return (
                <div 
                    key={member.id} 
                    className={`relative p-5 rounded-2xl border transition-all ${isActive ? 'bg-forest text-white border-forest shadow-lg scale-[1.02]' : 'bg-white border-gray-100 hover:border-orange/30 hover:shadow-md'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isActive ? 'bg-white text-forest' : 'bg-forest/10 text-forest'}`}>
                            {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover"/> : <User/>}
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                {member.full_name} 
                                {isMain && <span className="mr-2 text-[10px] bg-orange text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1 align-middle"><Crown size={10}/> رئيسي</span>}
                            </h3>
                            <div className={`text-xs mt-1 flex gap-3 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                                <span className="flex items-center gap-1"><Activity size={12}/> {member.weight || '-'}kg</span>
                                <span>|</span>
                                <span>{member.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                                {member.birth_date && (
                                    <>
                                        <span>|</span>
                                        <span>{new Date().getFullYear() - new Date(member.birth_date).getFullYear()} سنة</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-5 left-5 flex gap-2">
                        {!isActive && (
                            <button 
                                onClick={() => switchProfile(member.id)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${isActive ? 'bg-white text-forest' : 'bg-gray-100 hover:bg-forest hover:text-white text-gray-600'}`}
                            >
                                تبديل
                            </button>
                        )}
                        
                        {!isMain && (
                            <button 
                                onClick={() => handleDeleteMember(member.id)}
                                className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-white/50 hover:bg-white/20 hover:text-white' : 'text-gray-300 hover:bg-red-50 hover:text-red-500'}`}
                                title="حذف الفرد"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
              );
          })}
      </div>
    </div>
  );
};

export default FamilyMembers;