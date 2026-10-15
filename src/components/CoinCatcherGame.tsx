import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, Trophy, RotateCcw, Play, Coins, Share2, Copy, Check, Sparkles, Shield, AlertTriangle, Flame, Video } from 'lucide-react';
import { admobService } from '../services/admobService';
import {
  playCoinSound,
  playDeleteSound,
  playAddTransactionSound,
  playDangerHitSound,
  playGameOverSound,
  playPowerupSound,
  playNotificationSound,
  playCelebrationSound
} from '../utils/audio';

interface CoinCatcherGameProps {
  currencySymbol?: string;
  userReferralCode?: string;
  defaultExpanded?: boolean;
  title?: string;
}

interface FallingItem {
  id: number;
  x: number;
  y: number;
  vx?: number;
  type: 'coin' | 'expense' | 'heart' | 'scam' | 'bomb' | 'shield' | 'magnet';
  value: number;
  emoji: string;
  label: string;
  speed: number;
  size: number;
  startX?: number;
  oscillation?: { amp: number; freq: number; phase: number };
  fuseTimer?: number;
  isDetonating?: boolean;
  detonationRadius?: number;
  detonationLife?: number;
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
    hasShield: boolean;
    magnetTimer: number;
    crashTimer: number;
    nextCrashScore: number;
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
    nextItemId: number;
  }>({
    playerX: 175,
    playerWidth: 50,
    score: 0,
    lives: 5,
    invulnerableTimer: 0,
    hasShield: false,
    magnetTimer: 0,
    crashTimer: 0,
    nextCrashScore: 250,
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
    frameCount: 0,
    nextItemId: 1
  });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [hasShield, setHasShield] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('zb_coin_catcher_high') || '0');
  });
  const [combo, setCombo] = useState(0);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasRevivedWithAd, setHasRevivedWithAd] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [currentTipIndex] = useState(() => Math.floor(Math.random() * FINANCIAL_TIPS.length));


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

  const createParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const gs = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      gs.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 1,
        life: 20 + Math.random() * 15,
        color,
        size: 2.5 + Math.random() * 3
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
      life: 38
    });
  }, []);

  // 🎯 TACTICAL FORMATIONS SPAWNER (NORMAL SPEED, HIGH SKILL & TACTICS)
  const spawnFormation = useCallback((canvasWidth: number) => {
    const gs = gameStateRef.current;
    const isCrash = gs.crashTimer > 0;

    // Relaxed, super smooth falling speed (1.4 - 1.7 px/frame)
    const baseSpeed = isCrash ? 1.7 : 1.45 + Math.min(0.2, (gs.difficulty - 1) * 0.02);

    const roll = Math.random();

    // 1. 🥪 THE SANDWICH TRAP (25% chance): High-value coin flanked with wide clearance!
    if (roll < 0.25) {
      const centerX = 80 + Math.random() * (canvasWidth - 160);
      const coinPool = FINANCIAL_ITEMS.coins;
      const coinItem = coinPool[Math.floor(2 + Math.random() * 4)]; // 60, 100, 150, or 250
      
      // Center Coin
      gs.items.push({
        id: gs.nextItemId++,
        x: centerX,
        y: -30,
        type: 'coin',
        value: coinItem.value,
        emoji: coinItem.emoji,
        label: coinItem.label,
        speed: baseSpeed,
        size: coinItem.size
      });

      // Left Flanking Trap (70px generous gap)
      gs.items.push({
        id: gs.nextItemId++,
        x: centerX - 70,
        y: -30,
        type: 'expense',
        value: -1,
        emoji: '💳',
        label: 'Card Fee',
        speed: baseSpeed,
        size: 20
      });

      // Right Flanking Trap (70px generous gap)
      gs.items.push({
        id: gs.nextItemId++,
        x: centerX + 70,
        y: -30,
        type: 'expense',
        value: -1,
        emoji: '💸',
        label: 'Impulse Buy',
        speed: baseSpeed,
        size: 20
      });
      return;
    }

    // 2. 〰️ OSCILLATING SWEEPER (20% chance): Hazard swings back and forth across lanes
    if (roll < 0.50) {
      const startX = 60 + Math.random() * (canvasWidth - 120);
      gs.items.push({
        id: gs.nextItemId++,
        x: startX,
        y: -30,
        type: 'expense',
        value: -1,
        emoji: '⚡',
        label: 'Late Fee Fine',
        speed: baseSpeed * 0.95,
        size: 25,
        startX,
        oscillation: {
          amp: 48 + Math.random() * 18,
          freq: 0.048,
          phase: Math.random() * Math.PI * 2
        }
      });

      // Also spawn a regular coin on a different column
      const safeCoinX = startX > canvasWidth / 2 ? 45 + Math.random() * 60 : canvasWidth - 105 + Math.random() * 60;
      gs.items.push({
        id: gs.nextItemId++,
        x: safeCoinX,
        y: -35,
        type: 'coin',
        value: 35,
        emoji: '📈',
        label: 'SIP Growth',
        speed: baseSpeed,
        size: 26
      });
      return;
    }

    // 3. 💣 DEBT BOMB BLAST (15% chance): Drops slowly, but explodes near the ground!
    if (roll < 0.65) {
      const bombX = 45 + Math.random() * (canvasWidth - 90);
      gs.items.push({
        id: gs.nextItemId++,
        x: bombX,
        y: -30,
        type: 'bomb',
        value: -1,
        emoji: '💣',
        label: 'Debt Bomb',
        speed: baseSpeed * 0.9,
        size: 27,
        fuseTimer: 0
      });

      // Tempting coin nearby
      const coinX = bombX > canvasWidth / 2 ? 40 + Math.random() * 70 : canvasWidth - 110 + Math.random() * 70;
      gs.items.push({
        id: gs.nextItemId++,
        x: coinX,
        y: -30,
        type: 'coin',
        value: 60,
        emoji: '🛡️',
        label: 'Emergency Fund',
        speed: baseSpeed,
        size: 27
      });
      return;
    }

    // 4. 🎣 SCAM / RUGPULL BAIT (12% chance): Deceptive coin that costs points & shatters streak!
    if (roll < 0.77) {
      const scamX = 40 + Math.random() * (canvasWidth - 80);
      gs.items.push({
        id: gs.nextItemId++,
        x: scamX,
        y: -30,
        type: 'scam',
        value: -75,
        emoji: '🎣',
        label: 'Fake Ponzi Scam',
        speed: baseSpeed,
        size: 25
      });

      // Genuine coin somewhere else
      const realX = scamX > canvasWidth / 2 ? 45 + Math.random() * 70 : canvasWidth - 115 + Math.random() * 70;
      gs.items.push({
        id: gs.nextItemId++,
        x: realX,
        y: -32,
        type: 'coin',
        value: 40,
        emoji: '🪙',
        label: 'Daily Savings',
        speed: baseSpeed,
        size: 25
      });
      return;
    }

    // 5. 💰 QUAD COIN SHOWER (15% chance): Rich shower of positive coins across lanes!
    if (roll < 0.90) {
      const step = (canvasWidth - 50) / 4;
      const emojis = ['🪙', '📈', '💎', '💰'];
      const values = [40, 50, 75, 100];
      for (let i = 0; i < 4; i++) {
        const laneX = 25 + i * step + step / 2;
        gs.items.push({
          id: gs.nextItemId++,
          x: laneX,
          y: -30 - (i % 2) * 18,
          type: 'coin',
          value: values[i],
          emoji: emojis[i],
          label: 'Wealth Bonus',
          speed: baseSpeed * 0.92,
          size: 26
        });
      }
      return;
    }

    // 6. 🎁 POWER-UP OR EXTRA HEALTH (10% chance)
    const powerRoll = Math.random();
    if (gs.lives < 5 && powerRoll < 0.65) {
      gs.items.push({
        id: gs.nextItemId++,
        x: 40 + Math.random() * (canvasWidth - 80),
        y: -30,
        type: 'heart',
        value: 50,
        emoji: '💖',
        label: 'Health Shield',
        speed: baseSpeed * 0.85,
        size: 26
      });
    } else if (powerRoll < 0.75 && !gs.hasShield) {
      gs.items.push({
        id: gs.nextItemId++,
        x: 40 + Math.random() * (canvasWidth - 80),
        y: -30,
        type: 'shield',
        value: 40,
        emoji: '🛡️',
        label: 'Emergency Buffer',
        speed: baseSpeed,
        size: 26
      });
    } else {
      gs.items.push({
        id: gs.nextItemId++,
        x: 40 + Math.random() * (canvasWidth - 80),
        y: -30,
        type: 'magnet',
        value: 30,
        emoji: '🧲',
        label: 'Compound Magnet',
        speed: baseSpeed,
        size: 26
      });
    }
  }, []);

  const resetGame = useCallback(() => {
    const gs = gameStateRef.current;
    gs.playerX = 175;
    gs.score = 0;
    gs.lives = 5;
    gs.invulnerableTimer = 0;
    gs.hasShield = false;
    gs.magnetTimer = 0;
    gs.crashTimer = 0;
    gs.nextCrashScore = 650;
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
    setLives(5);
    setHasShield(false);
    setGameOver(false);
    setStarted(true);
    setCombo(0);
    setHasRevivedWithAd(false);
    admobService.recordActionAndMaybeShowAd();
  }, []);

  const handleReviveWithAd = async () => {
    setAdLoading(true);
    try {
      await admobService.showRewardedAd(() => {
        const gs = gameStateRef.current;
        gs.lives = 3;
        gs.invulnerableTimer = 150;
        gs.gameOver = false;
        gs.started = true;
        setLives(3);
        setGameOver(false);
        setHasRevivedWithAd(true);
        playCelebrationSound();
      });
    } finally {
      setAdLoading(false);
    }
  };

  const movePlayerBy = (deltaX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gs = gameStateRef.current;
    gs.playerX = Math.max(26, Math.min(canvas.width - 26, gs.playerX + deltaX));
  };

  // 🕹️ GAME LOOP
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

      // Magnet timer tick down
      if (gs.magnetTimer > 0) {
        gs.magnetTimer--;
      }

      // Market Crash Event logic
      if (gs.crashTimer > 0) {
        gs.crashTimer--;
        if (gs.crashTimer === 0) {
          // Crash survived! Big reward!
          gs.score += 200;
          gs.hasShield = true;
          setScore(gs.score);
          setHasShield(true);
          playCelebrationSound();
          createFloatingText(W / 2, H / 2 - 20, `🎉 CRASH SURVIVED! +${currencySymbol}200 & 🛡️ SHIELD!`, '#34d399');
          createParticles(W / 2, H / 2, '#34d399', 24);
        }
      } else if (gs.score >= gs.nextCrashScore) {
        // Trigger Market Crash
        gs.crashTimer = 480; // 8 seconds at 60 FPS
        gs.nextCrashScore += 350;
        playNotificationSound('warning');
        createFloatingText(W / 2, 60, `🚨 MARKET CRASH! SURVIVE 8 SECONDS!`, '#f43f5e');
      }

      // Gentle difficulty scaling
      gs.difficulty = 1 + Math.floor(gs.score / 250) * 0.15;

      // Spawning with steady cadence (Normal speed, high tactics)
      gs.spawnTimer++;
      const spawnCadence = gs.crashTimer > 0 ? 32 : Math.max(36, 48 - Math.floor(gs.difficulty * 2));
      if (gs.spawnTimer >= spawnCadence) {
        spawnFormation(W);
        gs.spawnTimer = 0;
      }

      // Update items
      gs.items = gs.items.filter(item => {
        // Vertical descent at normal speed
        item.y += item.speed;

        // Oscillating trajectory (sine wave)
        if (item.oscillation && item.startX !== undefined) {
          const osc = item.oscillation;
          item.x = item.startX + Math.sin(gs.frameCount * osc.freq + osc.phase) * osc.amp;
        } else if (item.vx) {
          item.x += item.vx;
          if (item.x < 24) { item.x = 24; item.vx = Math.abs(item.vx); }
          else if (item.x > W - 24) { item.x = W - 24; item.vx = -Math.abs(item.vx); }
        }

        // Magnetism: if magnet is active, gently attract positive coins within 85px
        if (gs.magnetTimer > 0 && (item.type === 'coin' || item.type === 'shield' || item.type === 'heart')) {
          const dist = Math.abs(gs.playerX - item.x);
          if (dist < 85 && item.y < H - 55) {
            item.x += (gs.playerX - item.x) * 0.08;
          }
        }

        const playerY = H - 55;
        const playerLeft = gs.playerX - gs.playerWidth / 2;
        const playerRight = gs.playerX + gs.playerWidth / 2;

        const isVerticallyAligned = item.y + item.size / 2 > playerY && item.y - item.size / 2 < playerY + 36;

        // 💥 DEBT BOMB LOGIC
        if (item.type === 'bomb') {
          // As bomb nears ground, fuse burns
          if (item.y >= H - 50) {
            // Detonate!
            const blastRadius = 32;
            const distToPlayer = Math.abs(gs.playerX - item.x);
            createParticles(item.x, H - 40, '#f97316', 22);

            if (distToPlayer < blastRadius && isVerticallyAligned) {
              if (gs.invulnerableTimer === 0) {
                if (gs.hasShield) {
                  gs.hasShield = false;
                  setHasShield(false);
                  gs.invulnerableTimer = 65;
                  playDangerHitSound();
                  createParticles(item.x, item.y, '#38bdf8', 16);
                  createFloatingText(item.x, item.y - 12, '🛡️ Shield Absorbed Bomb!', '#38bdf8');
                  return false;
                }
                gs.lives--;
                gs.invulnerableTimer = 70;
                gs.combo = 0;
                setLives(gs.lives);
                setCombo(0);
                playDangerHitSound();
                if (navigator.vibrate) try { navigator.vibrate([100, 50, 100]); } catch {}
                createFloatingText(item.x, item.y - 12, '💣 Debt Bomb Blast! -1 Life', '#f43f5e');

                if (gs.lives <= 0) {
                  gs.gameOver = true;
                  gs.started = false;
                  setGameOver(true);
                  setStarted(false);
                  playGameOverSound();
                  if (gs.score > highScore) {
                    setHighScore(gs.score);
                    localStorage.setItem('zb_coin_catcher_high', gs.score.toString());
                  }
                }
              }
            } else {
              // Successfully dodged blast!
              gs.trapsDodged++;
              createFloatingText(item.x, H - 45, '💣 Blast Dodged!', '#38bdf8');
            }
            return false;
          }
        }

        // 🪙 COINS & POSITIVE BUFFS
        if (item.type === 'coin' || item.type === 'heart' || item.type === 'shield' || item.type === 'magnet') {
          if (isVerticallyAligned && item.x > playerLeft - 18 && item.x < playerRight + 18) {
            if (item.type === 'heart') {
              gs.lives = Math.min(5, gs.lives + 1);
              setLives(gs.lives);
              gs.score += item.value;
              setScore(gs.score);
              playPowerupSound();
              createParticles(item.x, item.y, '#ec4899', 18);
              createFloatingText(item.x, item.y - 12, `💖 Life Restored! (+${currencySymbol}50)`, '#f472b6');
            } else if (item.type === 'shield') {
              gs.hasShield = true;
              setHasShield(true);
              gs.score += item.value;
              setScore(gs.score);
              playPowerupSound();
              createParticles(item.x, item.y, '#38bdf8', 18);
              createFloatingText(item.x, item.y - 12, `🛡️ Emergency Buffer Shield!`, '#38bdf8');
            } else if (item.type === 'magnet') {
              gs.magnetTimer = 300; // 5 seconds
              gs.score += item.value;
              setScore(gs.score);
              playPowerupSound();
              createParticles(item.x, item.y, '#fbbf24', 18);
              createFloatingText(item.x, item.y - 12, `🧲 Compound Magnet (5s)!`, '#fbbf24');
            } else {
              const comboBonus = Math.floor(gs.combo * 2.0);
              const totalEarned = item.value + comboBonus;
              gs.score += totalEarned;
              gs.combo++;
              gs.coinsCollected++;
              if (gs.combo > gs.maxCombo) gs.maxCombo = gs.combo;
              
              playCoinSound(gs.combo);
              if (navigator.vibrate) try { navigator.vibrate(20); } catch {}
              createParticles(item.x, item.y, '#34d399', 12);
              createFloatingText(item.x, item.y - 10, `+${currencySymbol}${totalEarned} ${item.label}`, '#86efac');
              setScore(gs.score);
              setCombo(gs.combo);
            }
            return false;
          }
        }

        // 🎣 SCAM / RUGPULL ITEM
        if (item.type === 'scam') {
          if (isVerticallyAligned && item.x > playerLeft - 4 && item.x < playerRight + 4) {
            gs.score = Math.max(0, gs.score - 30);
            gs.combo = 0;
            setScore(gs.score);
            setCombo(0);
            playNotificationSound('warning');
            if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch {}
            createParticles(item.x, item.y, '#f87171', 16);
            createFloatingText(item.x, item.y - 12, `🚨 SCAM BUSTED! -${currencySymbol}30 & Streak Lost!`, '#f87171');
            return false;
          }
        }

        // ⚠️ HAZARD / TRAP ITEMS
        if (item.type === 'expense') {
          if (isVerticallyAligned && item.x > playerLeft + 6 && item.x < playerRight - 6) {
            if (gs.invulnerableTimer > 0) {
              return false;
            }

            if (gs.hasShield) {
              gs.hasShield = false;
              setHasShield(false);
              gs.invulnerableTimer = 65;
              playDangerHitSound();
              createParticles(item.x, item.y, '#38bdf8', 14);
              createFloatingText(item.x, item.y - 10, `🛡️ Shield Absorbed Trap!`, '#38bdf8');
              return false;
            }

            gs.lives--;
            gs.invulnerableTimer = 65;
            gs.combo = 0;
            setLives(gs.lives);
            setCombo(0);
            playDangerHitSound();
            if (navigator.vibrate) try { navigator.vibrate([80, 50, 80]); } catch {}
            createParticles(item.x, item.y, '#f43f5e', 20);
            createFloatingText(item.x, item.y - 10, `💔 -1 Life (${item.label})`, '#fda4af');

            if (gs.lives <= 0) {
              gs.gameOver = true;
              gs.started = false;
              setGameOver(true);
              setStarted(false);
              playGameOverSound();
              if (gs.score > highScore) {
                setHighScore(gs.score);
                localStorage.setItem('zb_coin_catcher_high', gs.score.toString());
              }
            }
            return false;
          }
        }

        // Off-screen check
        if (item.y > H + 25) {
          if (item.type === 'expense' || item.type === 'bomb') {
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

      // --- 🎨 RENDER CANVAS ---
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

      // Market Crash Red Edge Alert Pulsing
      if (gs.crashTimer > 0) {
        const pulseAlpha = 0.15 + Math.sin(gs.frameCount * 0.12) * 0.1;
        ctx.fillStyle = `rgba(244, 63, 94, ${pulseAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.strokeRect(1, 1, W - 2, H - 2);

        // Crash banner
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#fca5a5';
        ctx.textAlign = 'center';
        ctx.fillText(`🚨 MARKET CRASH! SURVIVE: ${Math.ceil(gs.crashTimer / 60)}s`, W / 2, 44);
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
        // Bomb Danger Blast Radius Indicator
        if (item.type === 'bomb' && item.y > H - 85) {
          const pulse = Math.sin(gs.frameCount * 0.25) * 0.15 + 0.25;
          ctx.fillStyle = `rgba(244, 63, 94, ${pulse})`;
          ctx.beginPath();
          ctx.arc(item.x, H - 40, 46, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f43f5e';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.font = `${item.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (item.type === 'coin') {
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 12;
        } else if (item.type === 'heart') {
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 14;
        } else if (item.type === 'shield') {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
        } else if (item.type === 'magnet') {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 14;
        } else if (item.type === 'scam') {
          ctx.shadowColor = '#f87171';
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
        }

        ctx.fillText(item.emoji, item.x, item.y);
        ctx.shadowBlur = 0;

        // Label below item
        ctx.font = 'bold 8px sans-serif';
        if (item.type === 'coin') {
          ctx.fillStyle = '#a7f3d0';
          ctx.fillText(`+${item.value}`, item.x, item.y + item.size / 2 + 8);
        } else if (item.type === 'heart') {
          ctx.fillStyle = '#fbcfe8';
          ctx.fillText('+LIFE', item.x, item.y + item.size / 2 + 8);
        } else if (item.type === 'shield') {
          ctx.fillStyle = '#bae6fd';
          ctx.fillText('SHIELD', item.x, item.y + item.size / 2 + 8);
        } else if (item.type === 'magnet') {
          ctx.fillStyle = '#fef08a';
          ctx.fillText('MAGNET', item.x, item.y + item.size / 2 + 8);
        } else if (item.type === 'scam') {
          ctx.fillStyle = '#f87171';
          ctx.fillText('SCAM!', item.x, item.y + item.size / 2 + 8);
        } else if (item.type === 'bomb') {
          ctx.fillStyle = '#fb923c';
          ctx.fillText('BOMB', item.x, item.y + item.size / 2 + 8);
        } else {
          ctx.fillStyle = '#fca5a5';
          ctx.fillText('DODGE', item.x, item.y + item.size / 2 + 8);
        }
      });

      // Piggy Character
      const pX = gs.playerX;
      const pY = H - 55;

      // Platform Glow
      ctx.fillStyle = 'rgba(52, 211, 153, 0.28)';
      ctx.beginPath();
      ctx.ellipse(pX, pY + 38, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Magnet Pulsing Ring
      if (gs.magnetTimer > 0) {
        const ringRadius = 28 + (gs.frameCount % 20) * 1.5;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pX, pY + 16, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Shield Aura
      if (gs.hasShield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(pX, pY + 16, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Invulnerability protective flash
      const isInvulnerable = gs.invulnerableTimer > 0;
      const isFlashed = isInvulnerable && Math.floor(gs.frameCount / 5) % 2 === 0;

      if (isInvulnerable && !gs.hasShield) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pX, pY + 16, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Piggy
      ctx.globalAlpha = isFlashed ? 0.45 : 1;
      ctx.shadowColor = gs.hasShield ? '#38bdf8' : '#10b981';
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
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.fillText(`🔥 ${gs.combo}x SIP STREAK!`, W / 2, 24);
        ctx.shadowBlur = 0;
      }

      // HUD: Score
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`${currencySymbol}${gs.score}`, 12, 22);

      // HUD: Lives & Shield
      ctx.textAlign = 'right';
      ctx.font = '13px sans-serif';
      const shieldIcon = gs.hasShield ? ' 🛡️' : '';
      ctx.fillText(`${'❤️'.repeat(Math.max(0, gs.lives))}${shieldIcon}`, W - 12, 22);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isExpanded, started, gameOver, spawnFormation, createParticles, createFloatingText, currencySymbol, highScore]);

  // Controls (Keyboard)
  useEffect(() => {
    if (!isExpanded || !started || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      const step = 16;
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayerBy(-step);
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayerBy(step);
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
      gs.playerX = Math.max(26, Math.min(canvas.width - 26, targetX));
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
      gs.playerX = Math.max(26, Math.min(canvas.width - 26, (e.clientX - rect.left) * scaleX));
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
          <div style={{ fontSize: '15px' }}>{'❤️'.repeat(Math.max(0, lives))}{hasShield ? ' 🛡️' : ''}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>SIP Streak</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: combo >= 3 ? '#fbbf24' : 'var(--text-secondary)' }}>
            {combo >= 3 ? `🔥${combo}x` : `${combo}x`}
          </div>
        </div>
      </div>

      {/* Gameplay Tip Banner */}
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
            Catch 🪙 gold coins & 💎 gems to build wealth • Dodge 💣 traps!
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>
          Zen Arcade
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
            gap: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '42px', animation: 'bounce 1s infinite' }}>🐷</div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Zen Coin Catcher
            </h3>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#34d399'
            }}>
              <span>⚡ Normal Speed • Tactical Hard Mode</span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', margin: '0', lineHeight: 1.5, maxWidth: '290px' }}>
              Slide or swipe your finger across screen to steer 🐷<br/>
              • Weave between <span style={{ color: '#fbbf24', fontWeight: 700 }}>Sandwich Traps</span> & sweeping hazards<br/>
              • Dodge <span style={{ color: '#f87171', fontWeight: 700 }}>Debt Bombs 💣 & Fake Scams 🎣</span><br/>
              • Don't miss coins or your <span style={{ color: '#38bdf8', fontWeight: 700 }}>SIP streak resets!</span>
            </p>
            <button
              onClick={resetGame}
              style={{
                padding: '12px 32px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
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

            {!hasRevivedWithAd && (
              <button
                onClick={handleReviveWithAd}
                disabled={adLoading}
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '11px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: adLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  marginTop: '8px',
                  opacity: adLoading ? 0.7 : 1
                }}
              >
                <Video size={15} />
                {adLoading ? 'Loading Sponsor Video...' : '🎬 Watch Video Ad to Revive (+3 Lives)'}
              </button>
            )}

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
