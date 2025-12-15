import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, User, ArrowRight, Share2 } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const BlogPost: React.FC = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      const { data } = await supabase.from('articles').select('*').eq('id', id).single();
      setArticle(data);
      setLoading(false);
    };
    if(id) fetchArticle();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center">جاري التحميل...</div>;
  if (!article) return <div className="min-h-screen bg-cream flex items-center justify-center">المقال غير موجود</div>;

  return (
    <>
      <Header />
      <article className="min-h-screen bg-white pb-20">
        {/* Hero Image */}
        <div className="h-[50vh] relative">
            <img src={article.image_url || 'https://placehold.co/1200x600'} className="w-full h-full object-cover" alt="Cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white container mx-auto">
                <Link to="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-orange mb-6 font-bold transition-colors">
                    <ArrowRight size={20}/> العودة للمدونة
                </Link>
                <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{article.title}</h1>
                <div className="flex gap-6 text-sm font-bold opacity-90">
                    <span className="flex items-center gap-2"><User size={18}/> دكتور هيليكس</span>
                    <span className="flex items-center gap-2"><Calendar size={18}/> {new Date(article.created_at).toLocaleDateString('ar-EG', {dateStyle: 'long'})}</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 -mt-10 relative z-10">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100">
                <p className="text-xl font-bold text-gray-500 mb-8 border-r-4 border-orange pr-4 italic">
                    {article.excerpt}
                </p>
                <div className="prose prose-lg prose-forest max-w-none text-gray-700 leading-loose whitespace-pre-wrap">
                    {article.content}
                </div>
                
                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-forest">شارك المقال:</span>
                    <button className="p-3 rounded-full bg-gray-50 hover:bg-orange/10 hover:text-orange transition-colors">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>
        </div>
      </article>
      <Footer />
    </>
  );
};
export default BlogPost;