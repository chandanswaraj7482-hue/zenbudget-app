import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, Trophy, RotateCcw, Play, Coins, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { playCoinSound, playDeleteSound, playAddTransactionSound } from '../utils/audio';

interface CoinCatcherGameProps {
  currencySymbol?: string;
  userReferralCode?: string;
  defaultExpanded?: boolean;
  title?: string;
}

interface FallingItem {
  x: number;
  y: number;
  type: 'coin' | 'expense' | 'heart';
  value: number;
  emoji: string;
  label: string;
  speed: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const FINANCIAL_ITEMS: {
  coins: { emoji: string; label: string; value: number; size: number }[];
  expenses: { emoji: string; label: string; size: number }[];
} = {
  coins: [
    { emoji: '🪙', label: 'Daily Savings', value: 15, size: 24 },
    { emoji: '📈', label: 'SIP Growth', value: 35, size: 26 },
    { emoji: '🛡️', label: 'Emergency Fund', value: 60, size: 28 },
    { emoji: '💰', label: 'Salary Inflow', value: 100, size: 30 },
    { emoji: '💎', label: 'Debt Freedom', value: 150, size: 32 },
    { emoji: '🏆', label: 'Wealth Goal', value: 250, size: 34 }
  ],
  expenses: [
    { emoji: '💸', label: 'Impulse Buy', size: 24 },
    { emoji: '💳', label: '36% Card Fee', size: 24 },
    { emoji: '⚠️', label: 'Zombie Sub', size: 24 },
    { emoji: '🎰', label: 'F&O Gamble', size: 24 },
    { emoji: '📉', label: 'FOMO Speculation', size: 24 },
    { emoji: '⚡', label: 'Late Fee Fine', size: 24 }
  ]
};

const FINANCIAL_TIPS = [
  'Rule of 72: Divide 72 by interest rate to find years needed to double your wealth.',
  '50/30/20 Rule: 50% Needs, 30% Wants, 20% Savings & Debt payoff.',
  'Pay Yourself First: Invest into your SIP the very day your salary lands.',
  'Emergency Fund: Keep 3-6 months of basic living expenses in liquid funds.',
  'Avoid 36%+ APR credit card debt — always clear bills in full before due date!'
];

interface LiveActivity {
  id: string;
  name: string;
  city: string;
  score: number;
  badge: string;
  timeAgo: string;
  avatar: string;
}

const LIVE_ACTIVITIES: LiveActivity[] = [
  { id: '1', name: 'Priya S.', city: 'Bengaluru', score: 1420, badge: '👑 Zen Legend', timeAgo: '1m ago', avatar: '👩‍💼' },
  { id: '2', name: 'Rahul M.', city: 'Mumbai', score: 980, badge: '📈 SIP Master', timeAgo: '3m ago', avatar: '👨‍💻' },
  { id: '3', name: 'Ananya P.', city: 'Delhi', score: 1650, badge: '🛡️ Fortress', timeAgo: '5m ago', avatar: '👩‍🎓' },
  { id: '4', name: 'Vikram K.', city: 'Pune', score: 850, badge: '💼 Disciplined', timeAgo: '8m ago', avatar: '👨‍💼' },
  { id: '5', name: 'Sneha R.', city: 'Hyderabad', score: 1890, badge: '👑 Zen Legend', timeAgo: '12m ago', avatar: '👩‍🔬' },
  { id: '6', name: 'Kunal D.', city: 'Jaipur', score: 1120, badge: '🛡️ Fortress', timeAgo: '15m ago', avatar: '🧑‍💻' },
];

export const CoinCatcherGame: React.FC<CoinCatcherGameProps> = ({
  currencySymbol = '₹',
  userReferralCode = '',
  defaultExpanded = false,
  title = '💰 Zen Coin Catcher'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  
  const gameStateRef = useRef<{
    playerX: number;
    playerWidth: number;
    score: number;
    lives: number;
    invulnerableTimer: number;
    items: FallingItem[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    spawnTimer: number;
    difficulty: number;
    gameOver: boolean;
    started: boolean;
    combo: number;
    maxCombo: number;
    coinsCollected: number;
    trapsDodged: number;
    frameCount: number;
  }>({
    playerX: 160,
    playerWidth: 52,
    score: 0,
    lives: 3,
    invulnerableTimer: 0,
    items: [],
    particles: [],
    floatingTexts: [],
    spawnTimer: 0,
    difficulty: 1,
    gameOver: false,
    started: false,
    combo: 0,
    maxCombo: 0,
    coinsCollected: 0,
    trapsDodged: 0,
    frameCount: 0
  });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('zb_coin_catcher_high') || '0');
  });
  const [combo, setCombo] = useState(0);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentTipIndex] = useState(() => Math.floor(Math.random() * FINANCIAL_TIPS.length));
  const [activityIndex, setActivityIndex] = useState(0);

  // Rotate live activity stream
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityIndex(prev => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  const touchXRef = useRef<number | null>(null);

  // Derive Referral Code & Viral Share text
  const refCode = userReferralCode || localStorage.getItem('zb_ref_code') || 'ZENBUDGET';
  const appShareUrl = `https://zenbudget-tracker.vercel.app/?ref=${encodeURIComponent(refCode)}&game=coin_catcher`;

  const getFinancialRank = (pts: number) => {
    if (pts >= 1200) return { title: '👑 Zen Wealth Legend', color: '#fbbf24' };
    if (pts >= 700) return { title: '🛡️ Financial Fortress', color: '#38bdf8' };
    if (pts >= 350) return { title: '📈 SIP Wealth Builder', color: '#34d399' };
    if (pts >= 150) return { title: '💼 Disciplined Saver', color: '#a78bfa' };
    return { title: '🐣 Budget Beginner', color: '#94a3b8' };
  };

  const getShareMessage = (pts: number) => {
    const rank = getFinancialRank(pts).title;
    return `🚨 *Reality Check:* 83% of people lose ₹4,500+ every month to untracked small spends & hidden charges! 💸\n\n🎮 I scored *${currencySymbol}${pts.toLocaleString()}* in ZenBudget Financial Coin Catcher!\n🏆 Wealth Rank: *${rank}*\n🛡️ Dodged 36% Credit Card Traps & Compounded my SIP!\n\n🧠 *Can your brain dodge financial traps & build real wealth?*\nChallenge my score now & try the AI Money Manager that saves ₹5,000+ every month:\n\n📲 *Download Android APK / Play Free:* \n👉 ${appShareUrl}\n\n⚡ _(Auto-tracks daily spends, scans bank passbooks & blocks impulse buys!)_`;
  };

  const handleCopyLink = async () => {
    const text = getShareMessage(score);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    const text = getShareMessage(score);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ZenBudget Financial Coin Catcher',
          text
        });
        return;
      } catch {
        // Fallback to whatsapp
      }
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const spawnItem = useCallback((canvasWidth: number): FallingItem => {
    const gs = gameStateRef.current;
    
    // Challenging danger trap ratio (32% - 45% danger obstacles to dodge)
    let trapChance = 0.32;
    if (gs.score > 700) trapChance = 0.44;
    else if (gs.score > 250) trapChance = 0.38;
    
    // Rare 3% chance of life recovery shield
    const heartChance = gs.lives < 3 ? 0.04 : 0.01;
    const roll = Math.random();

    // Gentle, readable falling speed (not hyper-fast, but challenging to navigate)
    const diffMultiplier = 1 + Math.min(0.40, (gs.difficulty - 1) * 0.04);

    if (roll < heartChance) {
      // 💖 Extra Heart / Shield
      return {
        x: 25 + Math.random() * (canvasWidth - 50),
        y: -30,
        type: 'heart',
        value: 50,
        emoji: '💖',
        label: 'Health Shield',
        speed: (0.90 + Math.random() * 0.35) * diffMultiplier,
        size: 26
      };
    } else if (roll < heartChance + trapChance) {
      // ⚠️ Trap / Danger item (Impulse buys, card fees, F&O gamble, late fees)
      const pool = FINANCIAL_ITEMS.expenses;
      const exp = pool[Math.floor(Math.random() * pool.length)];
      return {
        x: 25 + Math.random() * (canvasWidth - 50),
        y: -30,
        type: 'expense',
        value: -1,
        emoji: exp.emoji,
        label: exp.label,
        speed: (0.95 + Math.random() * 0.40) * diffMultiplier,
        size: exp.size
      };
    } else {
      // 🪙 Positive Coins / Wealth items
      const pool = FINANCIAL_ITEMS.coins;
      const coinRoll = Math.random();
      const idx = coinRoll < 0.40 ? 0 : coinRoll < 0.65 ? 1 : coinRoll < 0.82 ? 2 : coinRoll < 0.92 ? 3 : coinRoll < 0.97 ? 4 : 5;
      const coin = pool[idx];
      return {
        x: 25 + Math.random() * (canvasWidth - 50),
        y: -30,
        type: 'coin',
        value: coin.value,
        emoji: coin.emoji,
        label: coin.label,
        speed: (0.85 + Math.random() * 0.35) * diffMultiplier,
        size: coin.size
      };
    }
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const gs = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      gs.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 7,
        vy: -Math.random() * 5 - 1,
        life: 22 + Math.random() * 16,
        color,
        size: 2.5 + Math.random() * 3.5
      });
    }
  }, []);

  const createFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    const gs = gameStateRef.current;
    gs.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 36
    });
  }, []);

  const resetGame = useCallback(() => {
    const gs = gameStateRef.current;
    gs.playerX = 160;
    gs.score = 0;
    gs.lives = 3;
    gs.invulnerableTimer = 0;
    gs.items = [];
    gs.particles = [];
    gs.floatingTexts = [];
    gs.spawnTimer = 0;
    gs.difficulty = 1;
    gs.gameOver = false;
    gs.started = true;
    gs.combo = 0;
    gs.maxCombo = 0;
    gs.coinsCollected = 0;
    gs.trapsDodged = 0;
    gs.frameCount = 0;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setStarted(true);
    setCombo(0);
  }, []);

  const movePlayerBy = (deltaX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gs = gameStateRef.current;
    gs.playerX = Math.max(30, Math.min(canvas.width - 30, gs.playerX + deltaX));
  };

  // Game loop
  useEffect(() => {
    if (!isExpanded || !started || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const gs = gameStateRef.current;

    const loop = () => {
      gs.frameCount++;

      // Invulnerability tick down
      if (gs.invulnerableTimer > 0) {
        gs.invulnerableTimer--;
      }

      // Smooth difficulty scaling
      gs.difficulty = 1 + Math.floor(gs.frameCount / 700) * 0.2;

      // Spawning with clean spacing
      gs.spawnTimer++;
      const spawnRate = Math.max(34, 52 - Math.floor(gs.difficulty * 2));
      if (gs.spawnTimer >= spawnRate) {
        gs.items.push(spawnItem(W));
        gs.spawnTimer = 0;
      }

      // Update items
      gs.items = gs.items.filter(item => {
        item.y += item.speed;

        const playerY = H - 55;
        const playerLeft = gs.playerX - gs.playerWidth / 2;
        const playerRight = gs.playerX + gs.playerWidth / 2;

        const isVerticallyAligned = item.y + item.size / 2 > playerY && item.y - item.size / 2 < playerY + 38;

        // Collision Check
        if (item.type === 'coin' || item.type === 'heart') {
          // Generous catch box for positive items
          if (isVerticallyAligned && item.x > playerLeft - 16 && item.x < playerRight + 16) {
            if (item.type === 'heart') {
              gs.lives = Math.min(3, gs.lives + 1);
              setLives(gs.lives);
              gs.score += item.value;
              setScore(gs.score);
              playAddTransactionSound();
              if (navigator.vibrate) try { navigator.vibrate([30, 30, 60]); } catch {}
              createParticles(item.x, item.y, '#ec4899', 14);
              createFloatingText(item.x, item.y - 12, `💖 +1 Life Restored! (+${currencySymbol}50)`, '#f472b6');
            } else {
              const comboBonus = Math.floor(gs.combo * 1.5);
              const totalEarned = item.value + comboBonus;
              gs.score += totalEarned;
              gs.combo++;
              gs.coinsCollected++;
              if (gs.combo > gs.maxCombo) gs.maxCombo = gs.combo;
              
              // SFX, Haptic & visuals
              playCoinSound();
              if (navigator.vibrate) try { navigator.vibrate(20); } catch {}
              createParticles(item.x, item.y, '#34d399', 10);
              createFloatingText(item.x, item.y - 10, `+${currencySymbol}${totalEarned} ${item.label}`, '#86efac');
              setScore(gs.score);
              setCombo(gs.combo);
            }
            return false;
          }
        } else if (item.type === 'expense') {
          // Accurate danger hitbox: player must actively dodge left/right
          if (isVerticallyAligned && item.x > playerLeft - 2 && item.x < playerRight + 2) {
            if (gs.invulnerableTimer > 0) {
              // Shield absorbed trap!
              createParticles(item.x, item.y, '#38bdf8', 8);
              createFloatingText(item.x, item.y - 10, `🛡️ Shield Absorbed!`, '#38bdf8');
              return false;
            }

            gs.lives--;
            gs.invulnerableTimer = 45; // ~0.75 seconds immunity
            gs.combo = 0;
            playDeleteSound();
            if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch {}
            createParticles(item.x, item.y, '#f43f5e', 16);
            createFloatingText(item.x, item.y - 10, `💔 -1 Life (${item.label})`, '#fda4af');
            setLives(gs.lives);
            setCombo(0);

            if (gs.lives <= 0) {
              gs.gameOver = true;
              gs.started = false;
              setGameOver(true);
              setStarted(false);
              playDeleteSound();
              if (gs.score > highScore) {
                setHighScore(gs.score);
                localStorage.setItem('zb_coin_catcher_high', gs.score.toString());
              }
              return false;
            }
            return false;
          }
        }

        // Off-screen
        if (item.y > H + 25) {
          if (item.type === 'coin') {
            gs.combo = 0;
            setCombo(0);
          } else {
            gs.trapsDodged++;
          }
          return false;
        }
        return true;
      });

      // Update particles
      gs.particles = gs.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16;
        p.life--;
        return p.life > 0;
      });

      // Update floating texts
      gs.floatingTexts = gs.floatingTexts.filter(ft => {
        ft.y -= 0.8;
        ft.life--;
        return ft.life > 0;
      });

      // --- RENDER SCREEN ---
      // Cyber Dark Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#060a14');
      bgGrad.addColorStop(1, '#0c1427');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle Cyber Grid
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < W; i += 28) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      for (let i = 0; i < H; i += 28) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }

      // Ground Line
      const groundGrad = ctx.createLinearGradient(0, H - 14, 0, H);
      groundGrad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
      groundGrad.addColorStop(1, 'rgba(52, 211, 153, 0.05)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H - 14, W, 14);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, H - 14);
      ctx.lineTo(W, H - 14);
      ctx.stroke();

      // Falling items
      gs.items.forEach(item => {
        ctx.font = `${item.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (item.type === 'coin') {
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 12;
        } else if (item.type === 'heart') {
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 14;
        } else {
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
        }
        ctx.fillText(item.emoji, item.x, item.y);
        ctx.shadowBlur = 0;

        // Label below item
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = item.type === 'coin' ? '#a7f3d0' : item.type === 'heart' ? '#fbcfe8' : '#fca5a5';
        ctx.fillText(item.type === 'coin' ? `+${item.value}` : item.type === 'heart' ? '+LIFE' : 'DODGE', item.x, item.y + item.size / 2 + 8);
      });

      // Piggy Character
      const pX = gs.playerX;
      const pY = H - 55;

      // Platform Glow
      ctx.fillStyle = 'rgba(52, 211, 153, 0.28)';
      ctx.beginPath();
      ctx.ellipse(pX, pY + 38, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Invulnerability protective shield aura & flash
      const isInvulnerable = gs.invulnerableTimer > 0;
      const isFlashed = isInvulnerable && Math.floor(gs.frameCount / 5) % 2 === 0;

      if (isInvulnerable) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(pX, pY + 16, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Piggy
      ctx.globalAlpha = isFlashed ? 0.45 : 1;
      ctx.shadowColor = isInvulnerable ? '#38bdf8' : '#10b981';
      ctx.shadowBlur = 16;
      ctx.font = '38px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐷', pX, pY + 16);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Particles
      gs.particles.forEach(p => {
        ctx.globalAlpha = Math.min(1, p.life / 10);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Floating Texts
      gs.floatingTexts.forEach(ft => {
        ctx.globalAlpha = Math.min(1, ft.life / 15);
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      // Combo Text
      if (gs.combo >= 3) {
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.fillText(`🔥 ${gs.combo}x SIP STREAK!`, W / 2, 28);
        ctx.shadowBlur = 0;
      }

      // HUD: Score
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`${currencySymbol}${gs.score}`, 12, 22);

      // HUD: Lives
      ctx.textAlign = 'right';
      ctx.font = '14px serif';
      ctx.fillText('❤️'.repeat(Math.max(0, gs.lives)), W - 12, 22);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isExpanded, started, gameOver, spawnItem, createParticles, createFloatingText, currencySymbol, highScore]);

  // Controls (Keyboard)
  useEffect(() => {
    if (!isExpanded || !started || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      const speed = 20;
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayerBy(-speed);
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayerBy(speed);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isExpanded, started, gameOver]);

  // Controls (Touch Gestures & Mouse Drag)
  useEffect(() => {
    if (!isExpanded || !started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updatePositionFromTouch = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const targetX = (touch.clientX - rect.left) * scaleX;
      const gs = gameStateRef.current;
      gs.playerX = Math.max(28, Math.min(canvas.width - 28, targetX));
      touchXRef.current = targetX;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        updatePositionFromTouch(e.touches[0]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        updatePositionFromTouch(e.touches[0]);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const gs = gameStateRef.current;
      gs.playerX = Math.max(28, Math.min(canvas.width - 28, (e.clientX - rect.left) * scaleX));
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isExpanded, started, gameOver]);

  if (!isExpanded) {
    return (
      <div style={{ marginTop: '20px', marginBottom: '16px' }}>
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🎮
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {title}
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Catch SIP coins, dodge late fees • Best: {currencySymbol}{highScore}
              </span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '999px',
            background: '#10b981',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
          }}>
            <Play size={13} fill="#ffffff" />
            Play
          </div>
        </button>
      </div>
    );
  }

  const userRank = getFinancialRank(score);

  return (
    <div style={{
      marginTop: '20px',
      marginBottom: '20px',
      borderRadius: '24px',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      background: 'var(--bg-card)',
      overflow: 'hidden',
      boxShadow: '0 12px 35px rgba(0,0,0,0.12)'
    }}>
      {/* Game Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-input, rgba(255,255,255,0.08))',
        color: 'var(--text-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Gamepad2 size={18} color="#10b981" />
          <span style={{ fontSize: '14px', fontWeight: 800 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(251, 191, 36, 0.12)',
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <Trophy size={13} color="#fbbf24" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>
              {currencySymbol}{highScore}
            </span>
          </div>
          <button
            onClick={() => { setIsExpanded(false); setStarted(false); setGameOver(false); }}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '8px',
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.04)',
        borderBottom: '1px solid var(--border-input, rgba(255,255,255,0.06))'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Wealth Scored</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{currencySymbol}{score}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Financial Health</div>
          <div style={{ fontSize: '15px' }}>{'❤️'.repeat(Math.max(0, lives))}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>SIP Streak</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: combo >= 3 ? '#fbbf24' : 'var(--text-secondary)' }}>
            {combo >= 3 ? `🔥${combo}x` : `${combo}x`}
          </div>
        </div>
      </div>

      {/* Live Social Proof Activity Stream */}
      <div style={{
        padding: '7px 16px',
        background: 'rgba(16, 185, 129, 0.08)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
            flexShrink: 0
          }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {LIVE_ACTIVITIES[activityIndex].avatar} <strong>{LIVE_ACTIVITIES[activityIndex].name}</strong> ({LIVE_ACTIVITIES[activityIndex].city}) scored <strong style={{ color: '#10b981' }}>{currencySymbol}{LIVE_ACTIVITIES[activityIndex].score}</strong>
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '8px' }}>
          {LIVE_ACTIVITIES[activityIndex].timeAgo}
        </span>
      </div>

      {/* Canvas Box */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={350}
          height={310}
          style={{
            width: '100%',
            display: 'block',
            background: '#060a14',
            touchAction: 'none'
          }}
        />

        {/* Start Overlay */}
        {!started && !gameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6, 10, 20, 0.94)',
            backdropFilter: 'blur(8px)',
            gap: '14px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '48px', animation: 'bounce 1s infinite' }}>🐷</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Zen Coin Catcher
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '0', lineHeight: 1.5, maxWidth: '280px' }}>
              Slide or swipe your finger across the screen to move 🐷<br/>
              <span style={{ color: '#34d399', fontWeight: 700 }}>Gesture Controls • Catch SIP & Dodge Traps!</span>
            </p>
            <button
              onClick={resetGame}
              style={{
                padding: '13px 34px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)'
              }}
            >
              <Coins size={18} />
              Start Game
            </button>
          </div>
        )}

        {/* Game Over & Share Overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6, 10, 20, 0.96)',
            backdropFilter: 'blur(10px)',
            gap: '10px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '38px' }}>
              {score >= highScore && score > 0 ? '🏆' : '💸'}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              {score >= highScore && score > 0 ? 'New Wealth Record!' : 'Game Over!'}
            </h3>
            
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              padding: '6px 14px',
              borderRadius: '999px',
              border: `1px solid ${userRank.color}40`,
              color: userRank.color,
              fontSize: '12px',
              fontWeight: 800
            }}>
              {userRank.title}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              width: '220px',
              marginTop: '2px'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '8px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>WEALTH</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#10b981' }}>{currencySymbol}{score}</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '8px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>BEST RECORD</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#fbbf24' }}>{currencySymbol}{highScore}</div>
              </div>
            </div>

            {/* Viral Share Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', width: '100%', maxWidth: '280px' }}>
              <button
                onClick={handleShare}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
                }}
              >
                <Share2 size={14} />
                Share Score
              </button>

              <button
                onClick={handleCopyLink}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {copiedLink ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <button
              onClick={resetGame}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '4px'
              }}
            >
              <RotateCcw size={14} />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Financial Wisdom Tip */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(16, 185, 129, 0.05)',
        borderTop: '1px solid var(--border-input, rgba(255,255,255,0.06))',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>
        <Sparkles size={14} color="#10b981" style={{ flexShrink: 0 }} />
        <span style={{ lineHeight: 1.4 }}>{FINANCIAL_TIPS[currentTipIndex]}</span>
      </div>
    </div>
  );
};
