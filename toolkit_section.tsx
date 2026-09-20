{/* ═══════════════ YOUR TOOLKIT ACCORDION ═══════════════ */}
      <section id="toolkit" style={{ padding: '40px 24px 80px', maxWidth: '1440px', margin: '0 auto', overflow: 'hidden' }}>
        <div className="scroll-fade-up toolkit-grid" style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '56px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D58B6D', marginBottom: '16px', display: 'block' }}>Your Toolkit</span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 2.8rem)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '28px' }}>Build a Wealthier Life with Proven Tools</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {toolkitItems.map((item, i) => (
                <div key={i} onClick={() => setActiveToolkit(i)} style={{
                  borderRadius: '2rem', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer',
                  background: i === activeToolkit ? '#10b981' : (isDark ? '#161d18' : '#ffffff'),
                  color: i === activeToolkit ? '#ffffff' : t.text,
                  border: i === activeToolkit ? '1px solid #10b981' : `1px solid ${t.border}`,
                  boxShadow: i === activeToolkit ? '0 16px 36px rgba(16,185,129,0.25)' : 'none',
                  transform: i === activeToolkit ? 'scale(1.02)' : 'scale(1)',
                }}>
                  <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', background: i === activeToolkit ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6'), color: i === activeToolkit ? '#ffffff' : t.textMuted }}>{item.badge}</span>
                      <h3 style={{ fontSize: '17px', fontWeight: 800 }}>{item.title}</h3>
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '12px', background: i === activeToolkit ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'), color: i === activeToolkit ? '#ffffff' : t.text }}>
                      {i === activeToolkit ? <ArrowUpRight size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  <div style={{ padding: i === activeToolkit ? '0 28px 28px' : '0 28px', maxHeight: i === activeToolkit ? '200px' : '0', overflow: 'hidden', opacity: i === activeToolkit ? 1 : 0, transition: 'all 0.4s ease-in-out', fontSize: '15px', lineHeight: 1.6, color: i === activeToolkit ? 'rgba(255,255,255,0.9)' : 'transparent' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: '2.5rem', overflow: 'hidden', position: 'relative', background: '#111827', minHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <img 
              src={toolkitItems[activeToolkit].image} 
              alt={toolkitItems[activeToolkit].title} 
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'opacity 0.5s' }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent)' }}></div>
            
            <div style={{ position: 'absolute', bottom: '32px', left: '32px', right: '32px', zIndex: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '20px', padding: '24px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a7f3d0', marginBottom: '6px', display: 'block' }}>{toolkitItems[activeToolkit].badge}</span>
                <h4 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{toolkitItems[activeToolkit].title}</h4>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0 }}>{toolkitItems[activeToolkit].desc}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      