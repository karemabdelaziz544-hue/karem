import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';

const ManageFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState({ name: '', role: '', content: '' });

  useEffect(() => { fetchFeedbacks(); }, []);

  const fetchFeedbacks = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (data) setFeedbacks(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('testimonials').insert([newFeedback]);
    if (!error) {
      setNewFeedback({ name: '', role: '', content: '' });
      fetchFeedbacks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرأي؟')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    fetchFeedbacks();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-black mb-8 text-slate-800 italic">إدارة آراء العملاء 📝</h1>

      {/* Form لإضافة فيدباك جديد */}
      <form onSubmit={handleAdd} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-12 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input 
            type="text" placeholder="اسم العميل" required
            className="p-4 bg-slate-50 rounded-xl border-none font-bold"
            value={newFeedback.name} onChange={e => setNewFeedback({...newFeedback, name: e.target.value})}
          />
          <input 
            type="text" placeholder="الوظيفة / الحالة (مثلاً: مشترك باقة Pro)" required
            className="p-4 bg-slate-50 rounded-xl border-none font-bold"
            value={newFeedback.role} onChange={e => setNewFeedback({...newFeedback, role: e.target.value})}
          />
        </div>
        <textarea 
          placeholder="محتوى الرأي..." required className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold h-32"
          value={newFeedback.content} onChange={e => setNewFeedback({...newFeedback, content: e.target.value})}
        />
        <button type="submit" className="bg-forest text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-black transition-all">
          <Plus size={20} /> إضافة كارت جديد
        </button>
      </form>

      {/* قائمة الكروت الحالية */}
      <div className="space-y-4">
        {loading ? <Loader2 className="animate-spin mx-auto text-forest" /> : feedbacks.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-black text-slate-800">{item.name}</h3>
              <p className="text-xs text-orange font-bold">{item.role}</p>
              <p className="text-sm text-slate-500 mt-2 max-w-md">{item.content}</p>
            </div>
            <button onClick={() => handleDelete(item.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageFeedback;