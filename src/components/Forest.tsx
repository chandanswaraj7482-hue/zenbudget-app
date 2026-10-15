import React from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import type { Transaction } from '../types';

interface ForestProps {
  onBack: () => void;
  transactions: Transaction[];
}

export const Forest: React.FC<ForestProps> = ({ onBack, transactions }) => {
  // Calculate dynamic streak based on actual transactions
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toDateString();
    const hasActivity = transactions.some(t => new Date(t.date).toDateString() === checkDate);
    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      break; // break streak on gap (allow today to be empty)
    }
  }

  // Calculate percentage grown (30 days = 100%)
  const percentage = Math.min(100, Math.round((streak / 30) * 100));

  // Determine stage details
  const getStageInfo = (strk: number) => {
    if (strk >= 21) {
      return {
        title: 'Mighty Zen Oak 🌳',
        desc: 'Your financial discipline is rock solid. You have grown a giant oak that shelters your future.',
        next: 'Max level reached! Maintain your habit.',
        color: '#10b981',
        glowingColor: 'rgba(16, 185, 129, 0.2)'
      };
    } else if (strk >= 14) {
      return {
        title: 'Healthy Pine Tree 🌲',
        desc: 'Sensible habits are taking deep roots. Your pine is standing tall against impulsive spending.',
        next: '7 more days to grow into a Mighty Oak!',
        color: '#14b8a6',
        glowingColor: 'rgba(20, 184, 166, 0.2)'
      };
    } else if (strk >= 7) {
      return {
        title: 'Growing Sapling 🌿',
        desc: 'Your garden is sprouting! A week of awareness has given life to a beautiful sapling.',
        next: '7 more days to grow into a Pine Tree!',
        color: '#3b82f6',
        glowingColor: 'rgba(59, 130, 246, 0.2)'
      };
    } else if (strk >= 3) {
      return {
        title: 'Fresh Sprout 🌱',
        desc: 'A promising start. Keep inputting your daily budgets to feed the soil.',
        next: '4 more days to grow into a Sapling!',
        color: '#a855f7',
        glowingColor: 'rgba(168, 85, 247, 0.2)'
      };
    } else {
      return {
        title: 'Dormant Seed 🌰',
        desc: 'Every forest starts with a single seed. Log transactions daily to water your seed.',
        next: '3 days of logs to hatch the Seed!',
        color: '#f59e0b',
        glowingColor: 'rgba(245, 158, 11, 0.2)'
      };
    }
  };

  const stage = getStageInfo(streak);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif" }}>
            Money Forest
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Cultivate wealth by logging habits
          </p>
        </div>
      </div>

      {/* Help info banner explaining what to do */}
      <div className="glass-panel animate-fade-in" style={{ padding: '14px 18px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.15)', display: 'flex', gap: '12px', alignItems: 'center', textAlign: 'left' }}>
        <span style={{ fontSize: '24px' }}>💡</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>How to grow your Forest</h4>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4', margin: 0 }}>
            Money Forest is a gamified habit builder. Your seed grows based on your daily transaction logs. 
            If you log at least one transaction today, your tree is watered and your streak increases. 
            Keep logging daily to watch your seed grow from a Dormant Seed into a Mighty Zen Oak!
          </p>
        </div>
      </div>

      {/* Interactive Tree View Box */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          position: 'relative', 
          background: 'linear-gradient(180deg, rgba(25, 25, 40, 0.6) 0%, rgba(10, 10, 15, 0.8) 100%)',
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: `0 20px 40px rgba(0,0,0,0.4), inset 0 0 30px ${stage.glowingColor}`,
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: stage.color }}>
          <Flame size={12} fill={stage.color} style={{ border: 'none' }} />
          <span>{streak} Day Streak</span>
        </div>

        {/* Beautiful Interactive Visual Tree */}
        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Radial Aura Background */}
          <div style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${stage.glowingColor} 0%, rgba(0,0,0,0) 70%)`,
            filter: 'blur(10px)',
            zIndex: 0,
            animation: 'pulse-glow 4s infinite alternate'
          }} />

          {/* SVG Tree with Dynamic Color Fill based on percentage */}
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', zIndex: 1 }}>
            <defs>
              <linearGradient id="treeGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#5c3a21" /> {/* Trunk is always brown */}
                <stop offset="25%" stopColor="#5c3a21" />
                <stop offset="25%" stopColor={percentage > 0 ? stage.color : '#334155'} />
                <stop offset={`${25 + (percentage * 0.75)}%`} stopColor={stage.color} />
                <stop offset={`${25 + (percentage * 0.75)}%`} stopColor="#1e293b" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Dormant Seed Rich Gradients */}
              <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5c3317" />
                <stop offset="100%" stopColor="#291206" />
              </linearGradient>
              <linearGradient id="seedCapGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a16207" />
                <stop offset="50%" stopColor="#854d0e" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>
              <linearGradient id="seedNutGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="35%" stopColor="#d97706" />
                <stop offset="75%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="seedGlossGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <radialGradient id="seedAuraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.45)" />
                <stop offset="50%" stopColor="rgba(16, 185, 129, 0.2)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>

              <filter id="shadow">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.5"/>
              </filter>
            </defs>

            {/* Glowing outer rings */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="50" cy="50" r="43" fill="none" stroke={stage.color} strokeWidth="0.5" strokeOpacity="0.2" />

            {streak < 3 ? (
              /* 🌰 REAL DORMANT SEED SVG ILLUSTRATION */
              <g filter="url(#shadow)">
                {/* Fertile Soil Mound */}
                <ellipse cx="50" cy="82" rx="34" ry="7" fill="url(#soilGrad)" />
                <ellipse cx="50" cy="80" rx="26" ry="4" fill="#3d2314" opacity="0.8" />
                <circle cx="28" cy="82" r="1.5" fill="#78350f" />
                <circle cx="72" cy="81" r="1.3" fill="#78350f" />
                <circle cx="38" cy="84" r="1" fill="#92400e" />
                <circle cx="62" cy="83" r="1.4" fill="#92400e" />

                {/* Soft Ambient Aura */}
                <circle cx="50" cy="58" r="24" fill="url(#seedAuraGrad)" />

                {/* Acorn Stem */}
                <path d="M 50,38 C 49,33 52,29 55,26" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />

                {/* Acorn Textured Cap */}
                <path 
                  d="M 33,52 C 33,42 41,37 50,37 C 59,37 67,42 67,52 C 67,54 65,55 50,55 C 35,55 33,54 33,52 Z" 
                  fill="url(#seedCapGrad)" 
                  stroke="#713f12"
                  strokeWidth="0.8"
                />
                {/* Cap Scale Texture Lines */}
                <path d="M 37,44 Q 44,40 50,44 Q 56,40 63,44" fill="none" stroke="#5c2e0b" strokeWidth="0.7" opacity="0.5" strokeDasharray="1.5,1.5" />
                <path d="M 39,48 Q 45,45 50,48 Q 55,45 61,48" fill="none" stroke="#5c2e0b" strokeWidth="0.7" opacity="0.5" strokeDasharray="1.5,1.5" />

                {/* Seed Nut / Shiny Shell Body */}
                <path 
                  d="M 34,53 C 34,66 43,78 50,81 C 57,78 66,66 66,53 C 66,51 34,51 34,53 Z" 
                  fill="url(#seedNutGrad)" 
                  stroke="#78350f"
                  strokeWidth="0.8"
                />

                {/* Specular Glow Reflection */}
                <path 
                  d="M 38,55 C 37,63 42,70 45,74 C 43,70 40,64 40,56 C 40,54 44,53 45,53 C 41,53 38,54 38,55 Z" 
                  fill="url(#seedGlossGrad)" 
                  opacity="0.65" 
                />
                <ellipse cx="43" cy="58" rx="2" ry="4.5" fill="#ffffff" opacity="0.35" transform="rotate(-15 43 58)" />

                {/* Glowing Golden Core */}
                <circle cx="50" cy="63" r="3.2" fill="#fbbf24" opacity="0.85">
                  <animate attributeName="r" values="2.6;4.2;2.6" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Gentle Sprouting Magical Particles */}
                <circle cx="42" cy="46" r="1.3" fill="#f59e0b">
                  <animate attributeName="cy" values="46;37;46" dur="3.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="58" cy="43" r="1.1" fill="#34d399">
                  <animate attributeName="cy" values="43;34;43" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0.9;0.25" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="50" cy="32" r="1.4" fill="#fbbf24">
                  <animate attributeName="cy" values="32;24;32" dur="2.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2.7s" repeatCount="indefinite" />
                </circle>
              </g>
            ) : (
              /* Tree Silhouette filled with dynamic gradient for streak >= 3 */
              <g filter="url(#shadow)">
                {/* Ground level line */}
                <line x1="20" y1="85" x2="80" y2="85" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
                <line x1="30" y1="85" x2="70" y2="85" stroke={stage.color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />

                {/* Combined Tree Path (Trunk + Foliage layers) */}
                <path 
                  d="
                    M 47,85 L 53,85 L 52,65 L 56,60 L 52,58 L 51,48 
                    C 56,47 62,48 65,42 C 69,36 67,28 60,26 C 62,20 57,13 50,13 C 43,13 38,20 40,26 C 33,28 31,36 35,42 C 38,48 44,47 49,48 
                    L 48,58 L 44,60 L 48,65 Z
                  " 
                  fill="url(#treeGrad)" 
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                  style={{ transition: 'fill 0.8s ease' }}
                />

                {/* Decorative extra leaf clusters that color up depending on streak milestones */}
                {streak >= 3 && <circle cx="38" cy="38" r="4" fill={stage.color} opacity="0.8" />}
                {streak >= 7 && <circle cx="62" cy="38" r="4.5" fill={stage.color} opacity="0.8" />}
                {streak >= 14 && <circle cx="50" cy="20" r="5" fill={stage.color} opacity="0.9" />}
                {streak >= 21 && <circle cx="50" cy="32" r="6" fill={stage.color} opacity="0.9" />}

                {/* Little birds or flowers when maxed */}
                {streak >= 21 && (
                  <>
                    <path d="M 33,30 Q 35,28 37,30 Q 39,28 41,30" fill="none" stroke="#fff" strokeWidth="0.5" />
                    <path d="M 61,24 Q 63,22 65,24 Q 67,22 69,24" fill="none" stroke="#fff" strokeWidth="0.5" />
                  </>
                )}
              </g>
            )}
          </svg>

          {/* Percentage Center Text Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(4px)',
            borderRadius: '12px',
            padding: '4px 10px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{percentage}% Grown</span>
          </div>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
          {stage.title}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '6px', maxWidth: '280px', lineHeight: 1.4 }}>
          {stage.desc}
        </p>

        {/* Milestone Indicator */}
        <div style={{ 
          marginTop: '20px', 
          width: '100%', 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 16px', 
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>NEXT MILESTONE</span>
          <span style={{ fontSize: '12px', color: stage.color, fontWeight: 700 }}>{stage.next}</span>
        </div>
      </div>

      {/* Grid of milestones */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px', textAlign: 'left' }}>
        Forest Milestones
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        
        <div className="glass-panel" style={{ padding: '16px', opacity: streak >= 3 ? 1 : 0.5, border: streak >= 3 ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>🌱</span>
            {streak >= 3 && <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: 800, background: 'rgba(168, 85, 247, 0.1)', padding: '2px 6px', borderRadius: '10px' }}>UNLOCKED</span>}
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px', color: '#fff' }}>Sprout (3 Days)</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Log daily logs for 3 consecutive days.</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px', opacity: streak >= 7 ? 1 : 0.5, border: streak >= 7 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>🌿</span>
            {streak >= 7 && <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 800, background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '10px' }}>UNLOCKED</span>}
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px', color: '#fff' }}>Sapling (7 Days)</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Log daily budgets for 7 consecutive days.</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px', opacity: streak >= 14 ? 1 : 0.5, border: streak >= 14 ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>🌲</span>
            {streak >= 14 && <span style={{ fontSize: '10px', color: '#14b8a6', fontWeight: 800, background: 'rgba(20, 184, 166, 0.1)', padding: '2px 6px', borderRadius: '10px' }}>UNLOCKED</span>}
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px', color: '#fff' }}>Pine Tree (14 Days)</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Maintain budget awareness for 14 days.</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px', opacity: streak >= 21 ? 1 : 0.5, border: streak >= 21 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>🌳</span>
            {streak >= 21 && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '10px' }}>UNLOCKED</span>}
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px', color: '#fff' }}>Zen Oak (21+ Days)</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>A fully matured tree representing your budget mastery.</span>
        </div>

      </div>

      {/* Motivational wisdom quotes */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
        <span style={{ fontSize: '28px' }}>🧘</span>
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Zen Wisdom</h4>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px', fontStyle: 'italic', lineHeight: 1.4 }}>
            "The best time to plant a tree was 20 years ago. The second best time is now. Log daily, grow steadily."
          </p>
        </div>
      </div>

    </div>
  );
};
