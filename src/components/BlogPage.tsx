import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Clock, Calendar, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import type { Article } from '../types';

// ─── Helpers ────────────────────────────────────────────────

function estimateReadingTime(text: string): number {
  const words = (text || '').trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDateAr(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return ''; }
}

// ─── Category extraction ─────────────────────────────────────
function getCategory(article: Article): string {
  // Use category field if present, otherwise try to infer
  const cat = (article as any).category;
  if (cat && typeof cat === 'string' && cat.trim()) return cat.trim();
  return 'صحة';
}

// ─── Skeleton Card ───────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-healix">
    <div className="skeleton h-52 w-full" />
    <div className="p-6 flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-20" />
      </div>
      <div className="skeleton h-5 w-4/5" />
      <div className="skeleton h-5 w-3/5" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
    </div>
  </div>
);

const SkeletonFeatured: React.FC = () => (
  <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-healix">
    <div className="skeleton h-[28rem] w-full" />
    <div className="p-8 flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-16" />
      </div>
      <div className="skeleton h-8 w-4/5" />
      <div className="skeleton h-8 w-3/5" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-4/5" />
      <div className="skeleton h-10 w-36 rounded-xl" />
    </div>
  </div>
);

// ─── Article Card ────────────────────────────────────────────
interface ArticleCardProps {
  article: Article;
  priority?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const readTime = estimateReadingTime(article.content || article.excerpt || '');
  const category = getCategory(article);

  return (
    <Link
      to={`/blog/${article.id}`}
      className="group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-healix hover-lift transition-all duration-300"
    >
      {/* Image */}
      <div className="h-52 overflow-hidden relative flex-shrink-0">
        <img
          src={article.image_url || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80'}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-premium"
        />
        {/* Category Badge */}
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/90 text-on-primary text-xs font-bold backdrop-blur-sm">
          {category}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-3 flex-1">
        {/* Meta */}
        <div className="flex items-center gap-4 text-on-surface-variant">
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <Clock size={13} className="text-primary" />
            {readTime} دقائق قراءة
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <Calendar size={13} className="text-primary" />
            {formatDateAr(article.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-on-surface font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2 flex-1">
          {article.excerpt || (article.content || '').slice(0, 120) + '…'}
        </p>

        {/* Read More */}
        <div className="flex items-center gap-2 text-primary font-bold text-sm mt-1 group-hover:gap-3 transition-all duration-300">
          اقرأ المقال
          <ArrowLeft size={15} />
        </div>
      </div>
    </Link>
  );
};

// ─── Featured Card ───────────────────────────────────────────
const FeaturedCard: React.FC<{ article: Article }> = ({ article }) => {
  const readTime = estimateReadingTime(article.content || article.excerpt || '');
  const category = getCategory(article);

  return (
    <Link
      to={`/blog/${article.id}`}
      className="group relative flex flex-col lg:flex-row bg-surface-container-lowest rounded-xl overflow-hidden shadow-healix-md hover-lift transition-all duration-500"
    >
      {/* Image (full height left / top on mobile) */}
      <div className="h-64 lg:h-auto lg:w-1/2 overflow-hidden relative flex-shrink-0">
        <img
          src={article.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=900&q=85'}
          alt={article.title}
          loading="eager"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-premium"
        />
        {/* Gradient overlay on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent lg:bg-gradient-to-l lg:from-black/20 lg:via-transparent lg:to-transparent" />
        {/* Category badge */}
        <span className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm text-on-primary text-xs font-bold tracking-wide">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center p-6 lg:p-8 lg:w-1/2 gap-4">
        {/* Meta row */}
        <div className="flex items-center gap-4 text-on-surface-variant text-sm">
          <span className="flex items-center gap-1.5">
            <Clock size={15} className="text-primary" />
            {readTime} دقائق قراءة
          </span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="flex items-center gap-1.5">
            <Calendar size={15} className="text-primary" />
            {formatDateAr(article.created_at)}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-on-surface font-black text-xl md:text-2xl leading-tight group-hover:text-primary transition-colors duration-300">
          {article.title}
        </h2>

        {/* Excerpt */}
        <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3">
          {article.excerpt || (article.content || '').slice(0, 160) + '…'}
        </p>

        {/* CTA */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs w-fit group-hover:bg-primary-container transition-all duration-300 active:scale-95">
          اقرأ المقال الكامل
          <ArrowLeft size={14} />
        </div>
      </div>
    </Link>
  );
};

// ─── Empty State ─────────────────────────────────────────────
const EmptyState: React.FC<{ query: string }> = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="56" fill="#f1f4f0" />
      <path d="M40 70 Q60 40 80 70" stroke="#bec9c2" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="46" cy="55" r="4" fill="#bec9c2"/>
      <circle cx="74" cy="55" r="4" fill="#bec9c2"/>
      <path d="M35 85 Q60 100 85 85" stroke="#a6f2d1" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M55 30 L65 30 M60 25 L60 35" stroke="#004532" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <div>
      <h3 className="text-xl font-bold text-on-surface mb-2">
        {query ? `لا نتائج لـ "${query}"` : 'لا توجد مقالات في هذه الفئة بعد'}
      </h3>
      <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
        {query ? 'جرب كلمات بحث مختلفة أو تصفح فئة أخرى' : 'سيتم نشر مقالات جديدة قريباً'}
      </p>
    </div>
  </div>
);

// ─── Error State ─────────────────────────────────────────────
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
    <div className="w-20 h-20 rounded-full bg-error-container/30 flex items-center justify-center">
      <RefreshCw size={32} className="text-error" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-on-surface mb-2">حدث خطأ في تحميل المقالات</h3>
      <p className="text-on-surface-variant text-sm mb-6">تحقق من اتصالك بالإنترنت وحاول مجدداً</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary-container transition-all active:scale-95"
      >
        إعادة المحاولة
      </button>
    </div>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-12" dir="rtl">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container hover:border-primary text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={18} />
      </button>

      {visiblePages.map((page, idx) => {
        const prev = visiblePages[idx - 1];
        return (
          <React.Fragment key={page}>
            {prev && page - prev > 1 && (
              <span className="text-on-surface-variant px-1">…</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                page === currentPage
                  ? 'bg-primary text-on-primary shadow-healix'
                  : 'hover:bg-surface-container text-on-surface-variant hover:text-primary border border-outline-variant/30 hover:border-primary'
              }`}
            >
              {page}
            </button>
          </React.Fragment>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container hover:border-primary text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  );
};

// ─── Main BlogPage Component ─────────────────────────────────
const ARTICLES_PER_PAGE = 9;

const ALL_CATEGORIES_LABEL = 'الكل';
const PREDEFINED_CATEGORIES = ['التغذية', 'الرياضة', 'الصحة', 'الأطفال', 'الأسرة', 'التحاليل', 'نمط الحياة'];

const BlogPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES_LABEL);
  const [currentPage, setCurrentPage] = useState(1);


  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setArticles(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // Derive categories
  const categories = [ALL_CATEGORIES_LABEL, ...PREDEFINED_CATEGORIES];

  // Filter
  const filtered = articles.filter(a => {
    const matchesQuery = !query ||
      a.title?.toLowerCase().includes(query.toLowerCase()) ||
      (a.excerpt || '').toLowerCase().includes(query.toLowerCase()) ||
      (a.content || '').toLowerCase().includes(query.toLowerCase());
    const matchesCat = activeCategory === ALL_CATEGORIES_LABEL ||
      getCategory(a).includes(activeCategory);
    return matchesQuery && matchesCat;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const featuredArticle = null;
  const gridArticles = filtered;
  const pagedArticles = gridArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleSearch = (val: string) => {
    setQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-surface font-thmanyah" dir="rtl">

      {/* ── Hero Section ─────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-28 pb-12 px-5 md:px-16 text-center"
      >
        {/* Soft gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-fixed/20 via-surface to-surface pointer-events-none" />

        <div className="relative max-w-2xl mx-auto fade-in-section">
          {/* Title only */}
          <h1 className="text-display-lg-mobile md:text-display-lg font-black text-primary tracking-tight leading-[1.1]">
            مدونة هيليكس
          </h1>
        </div>
      </section>

      {/* ── Search Bar ───────────────────────────────────── */}
      <section className="fade-in-section px-5 md:px-16 pb-6 pt-4">
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute inset-0 rounded-full bg-primary-fixed/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-center bg-surface-container-lowest rounded-full px-5 py-3.5 shadow-healix border border-outline-variant/30 focus-within:border-primary transition-all duration-300">
            <Search size={18} className="text-primary/50 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="ابحث في المقالات…"
              className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-right text-sm placeholder:text-outline-variant text-on-surface"
              dir="rtl"
            />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="ml-2 text-on-surface-variant hover:text-primary transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Category Pills ────────────────────────────────── */}
      <section className="fade-in-section px-5 md:px-16 pb-6">
        <div className="flex flex-row-reverse gap-3 overflow-x-auto hide-scrollbar md:justify-center max-w-5xl mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-label-sm font-bold transition-all duration-300 active:scale-95 ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary shadow-healix'
                  : 'bg-secondary-container text-primary hover:bg-primary-fixed'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-5 md:px-16 pb-24">

        {loading ? (
          <>
            <div className="mb-12 fade-in-section">
              <SkeletonFeatured />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : error ? (
          <ErrorState onRetry={fetchArticles} />
        ) : filtered.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <section className="mb-12 fade-in-section max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest bg-primary-fixed/40 px-3 py-1 rounded-lg">
                      المقال المميز
                    </span>
                  </div>
                </div>
                <FeaturedCard article={featuredArticle} />
              </section>
            )}

            {/* Articles Grid */}
            {gridArticles.length > 0 && (
              <section className="fade-in-section">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest bg-primary-fixed/40 px-3 py-1 rounded-lg">
                      المقالات
                    </span>
                    <p className="text-caption text-on-surface-variant mt-2">
                      {filtered.length} مقال{(filtered.length) !== 1 ? '' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {pagedArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default BlogPage;