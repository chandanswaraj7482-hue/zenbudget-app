import React, { useEffect } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';

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
        alert('Link copied to clipboard!');
      }
    } catch (e) {
      console.error('Error sharing:', e);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
        <h1 className="text-5xl font-black mb-6 tracking-tighter">Post Not Found</h1>
        <p className="text-white/50 mb-10 text-xl">The article you are looking for does not exist.</p>
        <button 
          onClick={handleBackToBlog}
          className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-full font-bold transition-all hover:scale-105"
        >
          Back to Blog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[120vw] max-w-[1200px] h-[600px] bg-gradient-to-b from-emerald-900/20 via-[#050505]/50 to-transparent blur-[120px] opacity-70 pointer-events-none -z-10" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#050505]/60 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={handleBackToBlog}
            className="flex items-center gap-4 text-white/60 hover:text-white transition-colors group"
          >
            <div className="w-11 h-11 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-white/10 transition-all duration-300">
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="font-bold hidden sm:inline tracking-wide text-sm uppercase">Back to Blog</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all duration-300"
            title="Share Article"
          >
            <span className="font-bold text-sm hidden sm:inline text-white/70 group-hover:text-white uppercase tracking-wider">Share</span>
            <Share2 size={16} className="text-white/70 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>
      </header>

      {/* Article Content */}
      <main className="pt-20 pb-32 relative z-10">
        {/* Hero Image Section */}
        <div className="w-full h-[65vh] md:h-[75vh] relative overflow-hidden flex items-end justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10" />
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover scale-[1.02] transform hover:scale-[1.05] transition-transform duration-[2s] ease-out"
          />
          <div className="relative z-20 w-full max-w-5xl px-6 pb-24 md:pb-32 text-center">
            <div className="flex gap-3 flex-wrap mb-8 justify-center">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 bg-emerald-500 text-white rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-10 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-8 text-base text-white/60 font-semibold tracking-wide">
              <div className="flex items-center gap-3 bg-white/[0.05] pr-5 pl-2 py-2 rounded-full border border-white/[0.05] backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                  {post.author.charAt(0)}
                </div>
                <span className="text-white/90">{post.author}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/[0.05] px-5 py-3 rounded-full border border-white/[0.05] backdrop-blur-md">
                <Calendar size={18} className="text-emerald-400" /> 
                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body Container */}
        <div className="max-w-4xl mx-auto px-6 relative z-30 -mt-16 md:-mt-24">
          <article className="w-full bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/[0.05] rounded-[3rem] p-8 md:p-20 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            
            <div 
              className="prose prose-invert prose-emerald max-w-none
                         prose-headings:font-black prose-headings:tracking-tight prose-headings:text-white
                         prose-h2:text-4xl md:prose-h2:text-5xl prose-h2:mt-20 prose-h2:mb-10 prose-h2:leading-[1.15]
                         prose-h3:text-3xl md:prose-h3:text-4xl prose-h3:mt-16 prose-h3:mb-8
                         prose-p:text-lg md:prose-p:text-2xl prose-p:text-white/70 prose-p:leading-[1.8] prose-p:mb-10 prose-p:font-medium
                         prose-strong:text-white prose-strong:font-bold
                         prose-ul:text-lg md:prose-ul:text-xl prose-ul:text-white/70 prose-ul:mb-10 prose-ul:leading-[1.8]
                         prose-li:my-3
                         prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-a:transition-colors prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
                         prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-500/5 prose-blockquote:px-10 prose-blockquote:py-8 prose-blockquote:rounded-3xl prose-blockquote:font-medium prose-blockquote:text-white/90 prose-blockquote:italic prose-blockquote:text-2xl prose-blockquote:leading-relaxed prose-blockquote:my-12"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </article>
        </div>
      </main>

      {/* Footer CTA */}
      <section className="py-40 px-6 relative z-10 border-t border-white/[0.02] bg-gradient-to-b from-[#050505] to-emerald-900/10">
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 mb-10 shadow-[0_0_50px_rgba(16,185,129,0.3)] relative group cursor-pointer hover:scale-105 transition-transform duration-500">
             <div className="absolute inset-0 bg-white/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="text-5xl font-black text-white leading-none tracking-tighter">Z</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter">
            Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">money.</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/50 mb-14 max-w-2xl mx-auto font-medium leading-relaxed">
            Stop guessing where your money goes. Start tracking it effortlessly today.
          </p>
          <button 
            onClick={() => {
              window.history.pushState(null, '', '/#app');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="group inline-flex items-center justify-center gap-4 bg-white hover:bg-gray-100 text-black px-12 py-6 rounded-full font-bold text-xl transition-all hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
          >
            Get Started Free 
            <span className="bg-black/5 text-black p-2.5 rounded-full group-hover:translate-x-1.5 transition-transform">
              <ArrowRight size={22} />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default BlogPostView;
