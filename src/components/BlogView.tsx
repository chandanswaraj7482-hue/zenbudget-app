import React, { useEffect } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToLanding}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-xl font-bold text-white leading-none tracking-tighter">Z</span>
              </div>
              <span className="text-xl font-bold tracking-tight">ZenBudget</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
              Insights & Ideas
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              Master your money with our latest articles on personal finance, budgeting strategies, and wealth creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => handlePostClick(post.slug)}
                className="group cursor-pointer rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-primary/50 transition-all duration-300 flex flex-col h-full"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-4 left-4 z-20 flex gap-2 flex-wrap">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-primary/80 backdrop-blur-sm text-white rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-white/60 mb-6 line-clamp-3 flex-grow">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/40 pt-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2">
                      <User size={14} /> {post.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <section className="py-20 px-6 border-t border-white/10 bg-gradient-to-b from-black to-emerald-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take control of your finances?</h2>
          <p className="text-lg text-white/60 mb-10">Join thousands of users who are already saving more and spending smarter with ZenBudget.</p>
          <button 
            onClick={() => {
              window.history.pushState(null, '', '/#app');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="inline-flex items-center justify-center gap-3 bg-primary hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            Start Tracking Free <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default BlogView;
