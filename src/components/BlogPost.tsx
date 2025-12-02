import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';
import { blogPosts } from '../../data/posts';
import Button from './Button';

const BlogPost: React.FC = () => {
  const { id } = useParams(); // بناخد رقم المقال من الرابط
  const post = blogPosts.find(p => p.id === Number(id)); // بنبحث عنه في الداتا

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-forest">
        <h2 className="text-3xl font-bold mb-4">المقال غير موجود</h2>
        <Link to="/blog">
            <Button>الرجوع للمدونة</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="pt-32 pb-24 px-6 md:px-12 bg-cream min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden shadow-sm border border-sage/20">
        {/* صورة المقال */}
        <div className="h-[300px] md:h-[400px] w-full relative">
            <img 
              src={post.image} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="p-8 md:p-12">
            {/* بيانات المقال */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-orange mb-6">
                <span className="bg-orange/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <User size={16}/> {post.author}
                </span>
                <span className="bg-orange/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <Calendar size={16}/> {post.date}
                </span>
                <span className="bg-orange/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <Clock size={16}/> ٥ دقائق قراءة
                </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-forest mb-8 leading-tight">
                {post.title}
            </h1>

            {/* محتوى المقال */}
            <div className="prose prose-lg prose-forest max-w-none font-medium text-gray-600 leading-loose">
                {/* هنا بنعرض المحتوى، وممكن نستخدم dangerouslySetInnerHTML لو المحتوى فيه HTML */}
                <p>{post.content}</p> 
                <p className="mt-4">
                    هنا باقي محتوى المقال التفصيلي.. يمكننا إضافة المزيد من النصوص والصور هنا لاحقاً لجعل الصفحة غنية بالمعلومات الطبية المفيدة.
                </p>
            </div>

            <div className="mt-12 pt-8 border-t border-sage/20">
                <Link to="/blog" className="inline-flex items-center gap-2 text-forest font-bold hover:text-orange transition-colors">
                    <ArrowRight size={20} /> العودة للمدونة
                </Link>
            </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPost;