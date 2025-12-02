import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom'; // 1. استدعينا Link هنا
import { blogPosts } from '../../data/posts';

const BlogPage: React.FC = () => {
  return (
    <section className="pt-32 pb-24 px-6 md:px-12 bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-forest mb-4">مدونة هيليكس الطبية</h1>
          <p className="text-forest/70 text-lg font-medium">نصائح طبية موثوقة لحياة صحية لكل أفراد الأسرة.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-lg border border-sage/30 hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="h-48 overflow-hidden shrink-0">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <div className="flex items-center gap-4 text-xs font-bold text-orange mb-3">
                    <span className="flex items-center gap-1"><User size={14}/> {post.author}</span>
                    <span className="flex items-center gap-1"><Calendar size={14}/> {post.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-forest mb-3 leading-tight">{post.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 font-medium">{post.summary}</p>
                </div>

                {/* 2. هنا التغيير: وضعنا الزرار داخل Link */}
                <Link to={`/blog/${post.id}`} className="mt-auto">
                  <button className="text-forest font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all w-full">
                    اقرأ المقال <ArrowLeft size={16} />
                  </button>
                </Link>
                
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPage;