import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, ArrowLeft, Clock, Calendar, Share2, Copy, Check, ChevronRight } from 'lucide-react';
import { marked } from 'marked';
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

function getCategory(article: Article): string {
  const cat = (article as any).category;
  if (cat && typeof cat === 'string' && cat.trim()) return cat.trim();
  return 'صحة';
}

// ─── Reading Progress Hook ───────────────────────────────────
function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return progress;
}

// ─── Scroll Reveal Hook ──────────────────────────────────────
function useScrollReveal(deps: any[] = []) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ─── Skeleton ────────────────────────────────────────────────
const ArticleSkeleton: React.FC = () => (
  <div className="min-h-screen bg-surface font-thmanyah" dir="rtl">
    <div className="skeleton w-full" style={{ height: '55vh' }} />
    <div className="max-w-3xl mx-auto px-5 py-10 flex flex-col gap-6">
      <div className="skeleton h-4 w-24 rounded-full" />
      <div className="skeleton h-10 w-4/5" />
      <div className="skeleton h-10 w-3/5" />
      <div className="skeleton h-4 w-1/3" />
      <div className="mt-6 flex flex-col gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`skeleton h-4 ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Related Article Card ─────────────────────────────────────
const RelatedCard: React.FC<{ article: Article }> = ({ article }) => {
  const readTime = estimateReadingTime(article.content || article.excerpt || '');
  const category = getCategory(article);

  return (
    <Link
      to={`/blog/${article.id}`}
      className="group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-healix hover-lift transition-all duration-300"
    >
      <div className="h-44 overflow-hidden relative flex-shrink-0">
        <img
          src={article.image_url || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=75'}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary/85 backdrop-blur-sm text-on-primary text-xs font-bold">
          {category}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <span className="text-caption text-on-surface-variant flex items-center gap-1.5">
          <Clock size={12} className="text-primary" />
          {readTime} دقائق قراءة
        </span>
        <h4 className="font-bold text-on-surface text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h4>
        <p className="text-caption text-on-surface-variant line-clamp-2 flex-1">
          {article.excerpt || (article.content || '').slice(0, 100) + '…'}
        </p>
      </div>
    </Link>
  );
};

// ─── Share Menu ───────────────────────────────────────────────
const ShareMenu: React.FC<{ title: string; url: string; isOpen: boolean; onClose: () => void }> = ({
  title, url, isOpen, onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleNativeShare = async () => {
    if ('share' in navigator && navigator.share) {
      try {
        await navigator.share({ title, url });
        onClose();
      } catch { /* cancelled */ }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="share-popup">
        {'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface-container-low text-on-surface text-sm font-medium w-full text-right transition-colors"
          >
            <Share2 size={16} className="text-primary flex-shrink-0" />
            مشاركة المقال
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface-container-low text-on-surface text-sm font-medium w-full text-right transition-colors"
        >
          {copied
            ? <Check size={16} className="text-green-600 flex-shrink-0" />
            : <Copy size={16} className="text-primary flex-shrink-0" />}
          {copied ? 'تم النسخ!' : 'نسخ الرابط'}
        </button>
      </div>
    </>
  );
};

// ─── Main BlogPost Component ─────────────────────────────────
const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [prevArticle, setPrevArticle] = useState<Article | null>(null);
  const [nextArticle, setNextArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const progress = useReadingProgress();
  useScrollReveal([loading]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch main article
      const { data: art } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      setArticle(art);

      if (art) {
        // Related articles (same category, excluding current)
        const { data: related } = await supabase
          .from('articles')
          .select('*')
          .neq('id', id)
          .order('created_at', { ascending: false })
          .limit(4);
        setRelatedArticles(related || []);

        // Prev / Next by created_at
        const { data: prevData } = await supabase
          .from('articles')
          .select('id, title, image_url, created_at, excerpt')
          .lt('created_at', art.created_at)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setPrevArticle(prevData as Article | null);

        const { data: nextData } = await supabase
          .from('articles')
          .select('id, title, image_url, created_at, excerpt')
          .gt('created_at', art.created_at)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        setNextArticle(nextData as Article | null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [fetchData]);

  // Edit content: wrap raw text into paragraphs if not HTML
  const renderContent = (content: string): string => {
    if (!content) return '';
    // If the content appears to be raw markdown (has ## headers, * bullets, etc.),
    // parse it with marked; otherwise if it's already HTML, use as-is
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      // Fallback: split by double newline → paragraphs
      return content
        .split(/\n\n+/)
        .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
        .join('');
    }
  };

  if (loading) return <ArticleSkeleton />;

  if (!article) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 font-thmanyah" dir="rtl">
        <div className="text-6xl">📄</div>
        <h2 className="text-2xl font-bold text-on-surface">المقال غير موجود</h2>
        <p className="text-on-surface-variant">ربما تم حذف المقال أو الرابط غير صحيح</p>
        <Link
          to="/blog"
          className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-all"
        >
          العودة للمدونة
        </Link>
      </div>
    );
  }

  const readTime = estimateReadingTime(article.content || article.excerpt || '');
  const category = getCategory(article);
  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-surface font-thmanyah" dir="rtl">

      {/* ── Reading Progress Bar ──────────────────────────── */}
      <div
        className="reading-progress-bar"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* ── Main Container (Pushed below header) ─────────── */}
      <div className="pt-28 max-w-4xl mx-auto px-5 md:px-8">
        
        {/* Back Button and Path */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-primary-fixed/40 text-primary text-sm font-bold transition-all border border-outline-variant/30"
          >
            <ArrowRight size={16} />
            المدونة
          </Link>
          <span className="px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">
            {category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-display-lg-mobile md:text-5xl font-black text-primary leading-tight tracking-tight mb-6">
          {article.title}
        </h1>

        {/* Excerpt / Lead */}
        {article.excerpt && (
          <p className="text-lg md:text-xl font-medium text-on-surface-variant leading-relaxed border-r-4 border-primary pr-4 mb-8 italic">
            {article.excerpt}
          </p>
        )}

        {/* Author row & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-outline-variant/30 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
              ه
            </div>
            <div>
              <div className="font-bold text-on-surface text-sm">فريق هيليكس الطبي</div>
              <div className="text-caption text-on-surface-variant">محتوى طبي موثوق</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-primary" />
              {readTime} دقائق قراءة
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              {formatDateAr(article.created_at)}
            </span>
          </div>

          <button
            onClick={() => setShareOpen(o => !o)}
            className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="مشاركة"
          >
            <Share2 size={18} className="text-primary" />
          </button>
        </div>

        {/* Featured Image (Centered, Rounded, High Quality) */}
        <div className="relative w-full overflow-hidden rounded-2xl shadow-healix border border-outline-variant/20 mb-10" style={{ height: '45vh', minHeight: '320px', maxHeight: '550px' }}>
          <img
            src={article.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&q=85'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ── Article Body ─────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-5 md:px-0 py-12">
        <article
          className="blog-editorial-content fade-in-section"
          dangerouslySetInnerHTML={{ __html: renderContent(article.content || '') }}
        />
      </main>

      {/* ── Prev / Next Navigation ────────────────────────── */}
      {(prevArticle || nextArticle) && (
        <section className="max-w-3xl mx-auto px-5 md:px-0 pb-12 fade-in-section">
          <div className="border-t border-outline-variant/20 pt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prev Article */}
              {prevArticle ? (
                <Link
                  to={`/blog/${prevArticle.id}`}
                  className="group flex flex-col p-5 rounded-xl bg-surface-container-lowest shadow-healix hover-lift transition-all"
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant mb-3">
                    <ArrowRight size={14} />
                    المقال السابق
                  </span>
                  <h4 className="font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {prevArticle.title}
                  </h4>
                </Link>
              ) : <div />}

              {/* Next Article */}
              {nextArticle ? (
                <Link
                  to={`/blog/${nextArticle.id}`}
                  className="group flex flex-col p-5 rounded-xl bg-surface-container-lowest shadow-healix hover-lift transition-all text-left"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs font-bold text-on-surface-variant mb-3">
                    المقال التالي
                    <ArrowLeft size={14} />
                  </span>
                  <h4 className="font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors text-right line-clamp-2">
                    {nextArticle.title}
                  </h4>
                </Link>
              ) : <div />}
            </div>
          </div>
        </section>
      )}

      {/* ── Related Articles ──────────────────────────────── */}
      {relatedArticles.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-5 md:px-16 pb-20 fade-in-section">
          <div className="border-t border-outline-variant/20 pt-12">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest bg-primary-fixed/40 px-3 py-1 rounded-lg">
                  مقالات ذات صلة
                </span>
              </div>
              <Link
                to="/blog"
                className="flex items-center gap-1.5 text-primary font-bold text-sm hover:gap-2.5 transition-all"
              >
                عرض الكل
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {relatedArticles.map(rel => (
                <RelatedCard key={rel.id} article={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Floating Share FAB ────────────────────────────── */}
      <div className="fab-share" onClick={() => setShareOpen(o => !o)} aria-label="مشاركة المقال">
        {shareOpen ? <Check size={22} /> : <Share2 size={22} />}
      </div>

      <ShareMenu
        title={article.title}
        url={currentUrl}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
};

export default BlogPost;