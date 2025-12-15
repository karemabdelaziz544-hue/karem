import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Plus, Trash2, Save, X, Loader2, Tag } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';

const ManagePromoCodes: React.FC = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form Data
  const [newCode, setNewCode] = useState('');
  const [discount, setDiscount] = useState(10); // الافتراضي 10%
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
        const { error } = await supabase.from('promo_codes').insert([{
            code: newCode.toUpperCase().trim(), // دايما حروف كبيرة
            discount_percent: discount
        }]);

        if (error) throw error;
        
        toast.success("تم إنشاء الكود بنجاح 🎉");
        setNewCode('');
        setDiscount(10);
        setShowForm(false);
        fetchCodes();
    } catch (err: any) {
        toast.error("فشل الإنشاء: " + err.message);
    } finally {
        setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("حذف هذا الكود نهائياً؟")) return;
    await supabase.from('promo_codes').delete().eq('id', id);
    setCodes(prev => prev.filter(c => c.id !== id));
    toast.success("تم الحذف");
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
      await supabase.from('promo_codes').update({ is_active: !currentStatus }).eq('id', id);
      fetchCodes(); // تحديث عشان نشوف الحالة الجديدة
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-forest flex items-center gap-2">
          <Tag className="text-orange" /> أكواد الخصم
        </h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={20} className="ml-2" /> كود جديد
        </Button>
      </div>

      {/* فورم الإنشاء */}
      {showForm && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg mb-8 animate-in slide-in-from-top-4">
              <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-lg">إنشاء كوبون خصم</h3>
                  <button onClick={() => setShowForm(false)}><X className="text-gray-400 hover:text-red-500"/></button>
              </div>
              <form onSubmit={handleCreate} className="flex gap-4 items-end">
                  <div className="flex-1">
                      <Input label="الكود (مثال: SALE20)" value={newCode} onChange={e => setNewCode(e.target.value)} required placeholder="SUMMER24" />
                  </div>
                  <div className="w-32">
                      <Input label="الخصم %" type="number" min="1" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} required />
                  </div>
                  <Button className="mb-1" disabled={creating}>
                      {creating ? <Loader2 className="animate-spin"/> : 'حفظ'}
                  </Button>
              </form>
          </div>
      )}

      {/* جدول الأكواد */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {codes.map(code => (
            <div key={code.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${code.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-black text-forest tracking-wider">{code.code}</h3>
                        <span className="text-orange font-bold text-sm">{code.discount_percent}% خصم</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${code.is_active ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-300'}`}></div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                        <Ticket size={14}/> استُخدم {code.usage_count} مرة
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => toggleStatus(code.id, code.is_active)}
                            className={`text-xs font-bold px-3 py-1 rounded-lg ${code.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                        >
                            {code.is_active ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={() => handleDelete(code.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                </div>
            </div>
        ))}
        {codes.length === 0 && !loading && <p className="text-gray-400 col-span-full text-center py-10">لا توجد أكواد خصم حالياً.</p>}
      </div>
    </div>
  );
};

export default ManagePromoCodes;