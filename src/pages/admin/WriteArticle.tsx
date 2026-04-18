import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Image as ImageIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const WriteArticle: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ title: '', excerpt: '', content: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `blog-${Date.now()}.${file.name.split('.').pop()}`;
    try {
      const { error } = await supabase.storage.from('blog-images').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success("تم رفع الصورة");
    } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await supabase.from('articles').insert([{
            ...formData,
            author_id: user?.id
        }]);
        if (error) throw error;
        toast.success("تم نشر المقال بنجاح! 🎉");
        navigate('/admin/blog');
    } catch (err: any) {
        toast.error("حدث خطأ: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in">
        <button onClick={() => navigate('/admin/blog')} className="flex items-center gap-2 text-gray-500 mb-6 font-bold hover:text-forest">
            <ArrowRight size={20} /> العودة للقائمة
        </button>
        <h1 className="text-3xl font-extrabold text-forest mb-8">كتابة مقال جديد ✍️</h1>
        
        <form onSubmit={handleSave} className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            {/* رفع الصورة */}
            <div onClick={() => fileInputRef.current?.click()} className="h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-orange hover:bg-orange/5 transition-all relative overflow-hidden">
                {formData.image_url ? (
                    <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                    <><ImageIcon size={40} /><span className="font-bold mt-2">صورة الغلاف</span></>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            <Input label="عنوان المقال" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            <Input label="مقتطف قصير (يظهر في القائمة)" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} required />
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">محتوى المقال</label>
                <textarea 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-orange outline-none min-h-[300px]"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="اكتب هنا..."
                    required
                ></textarea>
            </div>

            <Button className="w-full justify-center py-4 text-lg" disabled={loading || uploading}>
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} className="ml-2"/> نشر المقال</>}
            </Button>
        </form>
    </div>
  );
};
export default WriteArticle;