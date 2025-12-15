import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const BlogPage: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
      setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  return (
    <>
      <Header />
      <div className="bg-cream min-h-screen py-20">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-forest mb-4">مدونة هيليكس الطبية 🩺</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">أحدث المقالات والنصائح الغذائية من دكتور التغذية لمساعدتك في رحلتك.</p>
            </div>

            {loading ? (
                <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-forest" size={40}/></div>
            ) : articles.length === 0 ? (
                <div className="text-center text-gray-400">لا توجد مقالات منشورة بعد.</div>
            ) : (
                <div className="grid md:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <Link to={`/blog/${article.id}`} key={article.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100">
                            <div className="h-64 overflow-hidden relative">
                                <img 
                                    src={article.image_url || 'https://placehold.co/600x400'} 
                                    alt={article.title} 
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-4 text-xs font-bold text-gray-400 mb-3">
                                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(article.created_at).toLocaleDateString('ar-EG')}</span>
                                    <span className="flex items-center gap-1 text-orange"><User size={14}/> دكتور هيليكس</span>
                                </div>
                                <h2 className="text-xl font-bold text-forest mb-3 line-clamp-2 group-hover:text-orange transition-colors">{article.title}</h2>
                                <p className="text-gray-500 text-sm line-clamp-3 mb-4">{article.excerpt}</p>
                                <span className="text-forest font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                    اقرأ المزيد <ArrowRight size={16} />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
      </div>
      <Footer />
    </>
  );
};
export default BlogPage;