import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal'; // 👈 استيراد المودال

const ManageBlog: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالة المودال
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  // 👈 دالة الحذف بعد التأكيد
  const executeDelete = async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) {
        toast.success("تم الحذف بنجاح");
        setArticles(prev => prev.filter(a => a.id !== id));
    } else {
        toast.error("حدث خطأ أثناء الحذف");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-forest flex items-center gap-2">
          <FileText className="text-orange" /> إدارة المدونة
        </h1>
        <Button onClick={() => navigate('/admin/blog/new')}>
          <Plus size={20} className="ml-2" /> مقال جديد
        </Button>
      </div>

      <div className="grid gap-4">
        {articles.map(article => (
            <div key={article.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <img src={article.image_url || 'https://placehold.co/100'} loading="lazy" className="w-16 h-16 rounded-lg object-cover" alt="img" />
                    <div>
                        <h3 className="font-bold text-forest">{article.title}</h3>
                        <p className="text-xs text-gray-400">{new Date(article.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* 👈 التعديل هنا: فتح المودال */}
                    <button onClick={() => setDeleteId(article.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </div>
            </div>
        ))}
        {articles.length === 0 && !loading && <p className="text-center text-gray-400">لا توجد مقالات.</p>}
      </div>

      {/* 👈 المودال */}
      <ConfirmModal 
         isOpen={!!deleteId}
         title="تأكيد حذف المقال"
         message="هل أنت متأكد من رغبتك في حذف هذا المقال نهائياً من المدونة؟"
         onCancel={() => setDeleteId(null)}
         onConfirm={() => { if (deleteId) executeDelete(deleteId); }}
      />
    </div>
  );
};

export default ManageBlog;