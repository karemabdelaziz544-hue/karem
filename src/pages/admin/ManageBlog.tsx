import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const ManageBlog: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("حذف المقال؟")) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) {
        toast.success("تم الحذف");
        setArticles(prev => prev.filter(a => a.id !== id));
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
                    <img src={article.image_url || 'https://placehold.co/100'} className="w-16 h-16 rounded-lg object-cover" alt="img" />
                    <div>
                        <h3 className="font-bold text-forest">{article.title}</h3>
                        <p className="text-xs text-gray-400">{new Date(article.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleDelete(article.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </div>
            </div>
        ))}
        {articles.length === 0 && !loading && <p className="text-center text-gray-400">لا توجد مقالات.</p>}
      </div>
    </div>
  );
};
export default ManageBlog;