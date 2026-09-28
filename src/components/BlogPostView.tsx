import React, { useEffect } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight, Share2 } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';
import { triggerToast } from './Toast';

interface BlogPostViewProps {
  slug: string;
  onBackToLanding: () => void;
}

export const BlogPostView: React.FC<BlogPostViewProps> = ({ slug, onBackToLanding }) => {
  const post = blogPosts.find(p => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | ZenBudget Blog`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', post.excerpt);
      }
    } else {
      document.title = 'Post Not Found | ZenBudget Blog';
    }
    window.scrollTo(0, 0);
  }, [post]);

  const handleBackToBlog = () => {
    window.history.pushState(null, '', '/blog');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        triggerToast('Link copied to clipboard!', 'success');
      }
    } catch (e) {
      console.error('Error sharing:', e);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <p className="text-white/60 mb-8">The article you are looking for does not exist.</p>
        <button 
          onClick={handleBackToBlog}
          className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Back to Blog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={handleBackToBlog}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium hidden sm:inline">Back to Blog</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            title="Share Article"
          >
            <Share2 size={18} className="text-white" />
          </button>
        </div>
      </header>

      {/* Article Content */}
      <main className="pt-20 pb-24">
        {/* Hero Image */}
        <div className="w-full h-[40vh] md:h-[50vh] relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-12">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2 flex-wrap mb-6">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-primary text-white rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <User size={16} /> <span className="font-medium text-white">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} /> <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <article className="max-w-3xl mx-auto px-6 py-12">
          {/* We use a prose-like custom styling for the injected HTML */}
          <div 
            className="prose prose-invert prose-emerald max-w-none
                       prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-white
                       prose-p:text-lg prose-p:text-white/80 prose-p:leading-relaxed prose-p:mb-6
                       prose-strong:text-emerald-400 prose-strong:font-bold
                       prose-a:text-emerald-400 hover:prose-a:text-emerald-300"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </article>
      </main>

      {/* Footer CTA */}
      <section className="py-20 px-6 border-t border-white/10 bg-gradient-to-b from-black to-emerald-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <span className="text-3xl font-bold text-white leading-none tracking-tighter">Z</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Master your money with ZenBudget</h2>
          <p className="text-lg text-white/60 mb-10">Stop guessing where your money goes. Start tracking it effortlessly today.</p>
          <button 
            onClick={() => {
              window.history.pushState(null, '', '/#app');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="inline-flex items-center justify-center gap-3 bg-primary hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            Get Started Free <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default BlogPostView;
