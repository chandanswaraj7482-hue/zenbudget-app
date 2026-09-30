import React, { useEffect } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight, Sparkles } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';

interface BlogViewProps {
  onBackToLanding: () => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ onBackToLanding }) => {
  useEffect(() => {
    document.title = 'ZenBudget Blog - Personal Finance & Budgeting Tips';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Read the latest tips on personal finance, budget tracking, and wealth building from the ZenBudget team.');
    }
    window.scrollTo(0, 0);
  }, []);

  const handlePostClick = (slug: string) => {
    window.history.pushState(null, '', `/blog/${slug}`);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[120vw] max-w-[1200px] h-[600px] bg-gradient-to-b from-emerald-900/30 via-teal-900/10 to-transparent blur-[120px] opacity-70 pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-[-10%] w-[800px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] opacity-40 pointer-events-none -z-10" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#050505]/60 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBackToLanding}
              className="group flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300"
            >
              <ArrowLeft size={20} className="text-white/70 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToLanding}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <span className="text-xl font-bold text-white leading-none tracking-tighter">Z</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">ZenBudget</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-40 pb-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-28 relative">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-8 backdrop-blur-md">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest">Insights & Strategies</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
              <span className="text-white">Master Your </span>
              <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-emerald-300 to-teal-500 drop-shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                Financial Future
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-medium leading-relaxed">
              Elevate your money management with expert insights, proven wealth-building strategies, and the ZenBudget philosophy.
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {blogPosts.map((post, index) => (
              <div 
                key={post.id} 
                onClick={() => handlePostClick(post.slug)}
                className="group cursor-pointer rounded-[2.5rem] bg-[#111111]/80 backdrop-blur-xl border border-white/[0.05] overflow-hidden hover:bg-[#151515] hover:border-emerald-500/30 transition-all duration-500 flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image Container */}
                <div className="h-64 overflow-hidden relative m-3 rounded-[2rem] border border-white/[0.02]">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent z-10" />
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                      <ArrowRight size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 z-20 flex gap-2 flex-wrap">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-grow relative z-10 pt-4">
                  <h2 className="text-2xl font-bold mb-4 line-clamp-2 text-white group-hover:text-emerald-300 transition-colors duration-300 leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-white/50 mb-8 line-clamp-3 flex-grow leading-relaxed text-base font-medium">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-white/40 pt-6 border-t border-white/[0.05] mt-auto font-semibold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <User size={12} className="text-emerald-400" />
                      </div>
                      <span className="group-hover:text-white/80 transition-colors">{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2 group-hover:text-white/80 transition-colors">
                      <Calendar size={14} className="text-white/30 group-hover:text-emerald-400 transition-colors" /> 
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <section className="py-40 px-6 relative z-10 border-t border-white/[0.02] bg-gradient-to-b from-[#050505] to-emerald-900/10">
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] -z-10" />
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
            Ready to take <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">control?</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands of users who are already saving more, spending smarter, and building real wealth with ZenBudget.
          </p>
          <button 
            onClick={() => {
              window.history.pushState(null, '', '/#app');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="group inline-flex items-center justify-center gap-4 bg-white hover:bg-gray-100 text-black px-12 py-6 rounded-full font-bold text-xl transition-all hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]"
          >
            Start Tracking Free 
            <span className="bg-black/5 text-black p-2.5 rounded-full group-hover:translate-x-1.5 transition-transform">
              <ArrowRight size={22} />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default BlogView;
