import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, Trophy, RotateCcw, Play, Coins, Share2, Copy, Check, Sparkles, Shield, AlertTriangle, Flame, Video, Volume2, VolumeX, Zap, Heart, Magnet, Bomb } from 'lucide-react';
import { admobService } from '../services/admobService';
import {
  playCoinSound,
  playDeleteSound,
  playAddTransactionSound,
  playDangerHitSound,
  playGameOverSound,
  playPowerupSound,
  playNotificationSound,
  playCelebrationSound,
  playClickSound,
  triggerSparklesExplosion
} from '../utils/audio';

interface CoinCatcherGameProps {
  currencySymbol?: string;
  userReferralCode?: string;
  defaultExpanded?: boolean;
  title?: string;
}

interface Character {
  id: string;
  name: string;
  emoji: string;
  perk: string;
  tag: string;
  glow: string;
  speedMultiplier: number;
}

const CHARACTERS: Character[] = [
  { id: 'investor', name: 'Smart Investor', emoji: '💼', perk: 'Disciplined SIP & Compounding', tag: 'DISCIPLINED', glow: '#10b981', speedMultiplier: 1.0 },
  { id: 'titan', name: 'Wealth Titan', emoji: '👑', perk: '+15% Speed & Capital Inflow', tag: 'PORTFOLIO', glow: '#fbbf24', speedMultiplier: 1.15 },
  { id: 'strategist', name: 'Asset Planner', emoji: '📊', perk: '+25% Extra Dividend Return', tag: 'HIGH YIELD', glow: '#38bdf8', speedMultiplier: 1.0 },
  { id: 'fortress', name: 'Risk Hedger', emoji: '🛡️', perk: '+1 Emergency Reserve Shield', tag: 'PROTECTED', glow: '#a855f7', speedMultiplier: 1.05 }
];

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

export const CoinCatcherGame: React.FC<CoinCatcherGameProps> = ({
  currencySymbol = '₹',
  userReferralCode = '',
  defaultExpanded = false,
  title = '🎮 Zen Coin Catcher Arcade'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Sound toggle (stored in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('zb_game_sound') !== 'false';
  });

  // Character selection
  const [selectedCharId, setSelectedCharId] = useState<string>(() => {
    const saved = localStorage.getItem('zb_game_char');
    if (saved && ['investor', 'titan', 'strategist', 'fortress'].includes(saved)) {
      return saved;
    }
    return 'investor';
  });

  // Mode: 'blitz' (high action) vs 'zen' (relaxed speed)
  const [gameMode, setGameMode] = useState<'blitz' | 'zen'>('blitz');

  const selectedChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

  const playSound = useCallback((fn: () => void) => {
    if (soundEnabled) {
      try { fn(); } catch (_) {}
    }
  }, [soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('zb_game_sound', next ? 'true' : 'false');
    if (next) playClickSound();
  };

  const handleSelectChar = (char: Character) => {
    setSelectedCharId(char.id);
    localStorage.setItem('zb_game_char', char.id);
    playSound(playClickSound);
  };

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
    screenShake: number;
    celebrated500: boolean;
    celebratedHigh: boolean;
  }>({
    playerX: 190,
    playerWidth: 54,
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
    nextItemId: 1,
    screenShake: 0,
    celebrated500: false,
    celebratedHigh: false
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
    if (pts >= 1200) return { title: '👑 Zen Wealth Legend', color: '#fbbf24', nextGoal: 'MAX RANK' };
    if (pts >= 700) return { title: '🛡️ Financial Fortress', color: '#38bdf8', nextGoal: `₹${1200 - pts} to Legend` };
    if (pts >= 350) return { title: '📈 SIP Wealth Builder', color: '#34d399', nextGoal: `₹${700 - pts} to Fortress` };
    if (pts >= 150) return { title: '💼 Disciplined Saver', color: '#a78bfa', nextGoal: `₹${350 - pts} to SIP Builder` };
    return { title: '🐣 Budget Beginner', color: '#94a3b8', nextGoal: `₹${150 - pts} to Saver` };
  };

  const getShareMessage = (pts: number) => {
    const rank = getFinancialRank(pts).title;
    return `🚨 *Reality Check:* 83% of people lose ₹4,500+ every month to untracked small spends & hidden charges! 💸\n\n🎮 I scored *${currencySymbol}${pts.toLocaleString()}* playing as ${selectedChar.name} in Zen Coin Catcher!\n🏆 Wealth Rank: *${rank}*\n🛡️ Dodged 36% Credit Card Traps & Compounded my SIP!\n\n🧠 *Can your brain dodge financial traps & build real wealth?*\nChallenge my score now & try the AI Money Manager that saves ₹5,000+ every month:\n\n📲 *Download Android APK / Play Free:* \n👉 ${appShareUrl}\n\n⚡ _(Auto-tracks daily spends, scans bank passbooks & blocks impulse buys!)_`;
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
      life: 40
    });
  }, []);

  // 🎯 TACTICAL FORMATIONS SPAWNER
  const spawnFormation = useCallback((canvasWidth: number) => {
    const gs = gameStateRef.current;
    const isCrash = gs.crashTimer > 0;
    const isZenMode = gameMode === 'zen';

    // Speed calculation
    const modeMultiplier = isZenMode ? 0.8 : 1.0;
    const baseSpeed = (isCrash ? 1.7 : 1.45 + Math.min(0.2, (gs.difficulty - 1) * 0.02)) * modeMultiplier;

    const roll = Math.random();

    // 1. 🥪 THE SANDWICH TRAP (High-value coin flanked by traps)
    if (roll < (isZenMode ? 0.15 : 0.25)) {
      const centerX = 80 + Math.random() * (canvasWidth - 160);
      const coinPool = FINANCIAL_ITEMS.coins;
      const coinItem = coinPool[Math.floor(2 + Math.random() * 4)];

      let coinVal = coinItem.value;
      if (selectedChar.id === 'strategist') {
        coinVal = Math.round(coinVal * 1.25);
      }

      gs.items.push({
        id: gs.nextItemId++,
        x: centerX,
        y: -30,
        type: 'coin',
        value: coinVal,
        emoji: coinItem.emoji,
        label: coinItem.label,
        speed: baseSpeed,
        size: coinItem.size
      });

      if (!isZenMode) {
        gs.items.push({
          id: gs.nextItemId++,
          x: centerX - 75,
          y: -30,
          type: 'expense',
          value: -1,
          emoji: '💳',
          label: 'Card Fee',
          speed: baseSpeed,
          size: 20
        });

        gs.items.push({
          id: gs.nextItemId++,
          x: centerX + 75,
          y: -30,
          type: 'expense',
          value: -1,
          emoji: '💸',
          label: 'Impulse Buy',
          speed: baseSpeed,
          size: 20
        });
      }
      return;
    }

    // 2. 〰️ OSCILLATING SWEEPER
    if (roll < 0.45 && !isZenMode) {
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
          amp: 45 + Math.random() * 15,
          freq: 0.048,
          phase: Math.random() * Math.PI * 2
        }
      });

      const safeCoinX = startX > canvasWidth / 2 ? 45 + Math.random() * 60 : canvasWidth - 105 + Math.random() * 60;
      gs.items.push({
        id: gs.nextItemId++,
        x: safeCoinX,
        y: -35,
        type: 'coin',
        value: selectedChar.id === 'strategist' ? 45 : 35,
        emoji: '📈',
        label: 'SIP Growth',
        speed: baseSpeed,
        size: 26
      });
      return;
    }

    // 3. 💣 DEBT BOMB CASCADE (Only in Blitz mode)
    if (roll < 0.65 && !isZenMode && gs.score > 80) {
      const bombX = 50 + Math.random() * (canvasWidth - 100);
      gs.items.push({
        id: gs.nextItemId++,
        x: bombX,
        y: -30,
        type: 'bomb',
        value: -1,
        emoji: '💣',
        label: 'Debt Bomb',
        speed: baseSpeed * 1.1,
        size: 28,
        fuseTimer: 180
      });

      const oppositeX = bombX < canvasWidth / 2 ? canvasWidth - 80 : 80;
      gs.items.push({
        id: gs.nextItemId++,
        x: oppositeX,
        y: -30,
        type: 'coin',
        value: selectedChar.id === 'strategist' ? 120 : 100,
        emoji: '💰',
        label: 'Salary Inflow',
        speed: baseSpeed,
        size: 28
      });
      return;
    }

    // 4. 🎣 SCAM / RUGPULL FAKE (Looks like diamond but is trap)
    if (roll < 0.75 && !isZenMode && gs.score > 120) {
      const scamX = 40 + Math.random() * (canvasWidth - 80);
      gs.items.push({
        id: gs.nextItemId++,
        x: scamX,
        y: -30,
        type: 'scam',
        value: -30,
        emoji: '🎰',
        label: 'F&O Gamble Trap',
        speed: baseSpeed * 1.05,
        size: 27
      });
      return;
    }

    // 5. 🪙 STANDARD COIN / POWERUP SPAWN
    const subRoll = Math.random();
    if (subRoll < 0.70) {
      const c = FINANCIAL_ITEMS.coins[Math.floor(Math.random() * FINANCIAL_ITEMS.coins.length)];
      let val = c.value;
      if (selectedChar.id === 'strategist') val = Math.round(val * 1.25);

      gs.items.push({
        id: gs.nextItemId++,
        x: 40 + Math.random() * (canvasWidth - 80),
        y: -30,
        type: 'coin',
        value: val,
        emoji: c.emoji,
        label: c.label,
        speed: baseSpeed,
        size: c.size
      });
    } else if (subRoll < 0.85) {
      // Shield Powerup
      gs.items.push({
        id: gs.nextItemId++,
        x: 40 + Math.random() * (canvasWidth - 80),
        y: -30,
        type: 'shield',
        value: 50,
        emoji: '🛡️',
        label: 'Emergency Shield',
        speed: baseSpeed,
        size: 26
      });
    } else if (subRoll < 0.94) {
      // Heart Life
      gs.items.push({
        id: gs.nextItemId++,
        x: 40 + Math.random() * (canvasWidth - 80),
        y: -30,
        type: 'heart',
        value: 0,
        emoji: '❤️',
        label: 'Emergency Buffer',
        speed: baseSpeed,
        size: 26
      });
    } else {
      // Magnet
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
  }, [gameMode, selectedChar.id]);

  const resetGame = useCallback(() => {
    const gs = gameStateRef.current;
    const startLives = selectedChar.id === 'fortress' ? 6 : (gameMode === 'zen' ? 7 : 5);
    const startShield = selectedChar.id === 'fortress';

    gs.playerX = 190;
    gs.score = 0;
    gs.lives = startLives;
    gs.invulnerableTimer = 0;
    gs.hasShield = startShield;
    gs.magnetTimer = selectedChar.id === 'titan' ? 120 : 0;
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
    gs.screenShake = 0;
    gs.celebrated500 = false;
    gs.celebratedHigh = false;

    setScore(0);
    setLives(startLives);
    setHasShield(startShield);
    setGameOver(false);
    setStarted(true);
    setCombo(0);
    setHasRevivedWithAd(false);
    playSound(playClickSound);
    admobService.recordActionAndMaybeShowAd();
  }, [gameMode, selectedChar.id, playSound]);

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
        playSound(playCelebrationSound);
      });
    } finally {
      setAdLoading(false);
    }
  };

  const movePlayerBy = (deltaX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gs = gameStateRef.current;
    const speedBonus = selectedChar.speedMultiplier;
    gs.playerX = Math.max(28, Math.min(canvas.width - 28, gs.playerX + deltaX * speedBonus));
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
      if (gs.invulnerableTimer > 0) gs.invulnerableTimer--;

      // Magnet timer tick down
      if (gs.magnetTimer > 0) gs.magnetTimer--;

      // Screen shake decay
      if (gs.screenShake > 0) gs.screenShake--;

      // Market Crash Event logic (Blitz Mode only)
      if (gameMode === 'blitz') {
        if (gs.crashTimer > 0) {
          gs.crashTimer--;
          if (gs.crashTimer === 0) {
            gs.score += 200;
            gs.hasShield = true;
            setScore(gs.score);
            setHasShield(true);
            playSound(playCelebrationSound);
            createFloatingText(W / 2, H / 2 - 20, `🎉 CRASH SURVIVED! +${currencySymbol}200 & 🛡️ SHIELD!`, '#34d399');
            createParticles(W / 2, H / 2, '#34d399', 24);
          }
        } else if (gs.score >= gs.nextCrashScore) {
          gs.crashTimer = 480; // 8 seconds
          gs.nextCrashScore += 450;
          playSound(() => playNotificationSound('warning'));
          createFloatingText(W / 2, 60, `🚨 MARKET CRASH! SURVIVE 8 SECONDS!`, '#f43f5e');
        }
      }

      // Difficulty scaling
      gs.difficulty = 1 + Math.floor(gs.score / 250) * 0.15;

      // Spawning with steady cadence
      gs.spawnTimer++;
      const spawnCadence = gs.crashTimer > 0 ? 30 : Math.max(34, 46 - Math.floor(gs.difficulty * 2));
      if (gs.spawnTimer >= spawnCadence) {
        spawnFormation(W);
        gs.spawnTimer = 0;
      }

      // Update items
      gs.items = gs.items.filter(item => {
        item.y += item.speed;

        if (item.oscillation && item.startX !== undefined) {
          const osc = item.oscillation;
          item.x = item.startX + Math.sin(gs.frameCount * osc.freq + osc.phase) * osc.amp;
        } else if (item.vx) {
          item.x += item.vx;
          if (item.x < 24) { item.x = 24; item.vx = Math.abs(item.vx); }
          else if (item.x > W - 24) { item.x = W - 24; item.vx = -Math.abs(item.vx); }
        }

        // Magnet attraction
        const magnetReach = selectedChar.id === 'titan' ? 120 : 90;
        if ((gs.magnetTimer > 0 || selectedChar.id === 'titan') && (item.type === 'coin' || item.type === 'shield' || item.type === 'heart')) {
          const dist = Math.abs(gs.playerX - item.x);
          if (dist < magnetReach && item.y < H - 60) {
            item.x += (gs.playerX - item.x) * 0.09;
          }
        }

        const playerY = H - 60;
        const playerLeft = gs.playerX - gs.playerWidth / 2;
        const playerRight = gs.playerX + gs.playerWidth / 2;

        const isVerticallyAligned = item.y + item.size / 2 > playerY && item.y - item.size / 2 < playerY + 38;

        // 💥 DEBT BOMB
        if (item.type === 'bomb') {
          if (item.y >= H - 52) {
            const blastRadius = 34;
            const distToPlayer = Math.abs(gs.playerX - item.x);
            createParticles(item.x, H - 42, '#f97316', 22);

            if (distToPlayer < blastRadius && isVerticallyAligned) {
              if (gs.invulnerableTimer === 0) {
                if (gs.hasShield) {
                  gs.hasShield = false;
                  setHasShield(false);
                  gs.invulnerableTimer = 65;
                  gs.screenShake = 8;
                  playSound(playDangerHitSound);
                  createParticles(item.x, item.y, '#38bdf8', 16);
                  createFloatingText(item.x, item.y - 12, '🛡️ Shield Absorbed Bomb!', '#38bdf8');
                  return false;
                }
                gs.lives--;
                gs.invulnerableTimer = 70;
                gs.combo = 0;
                gs.screenShake = 14;
                setLives(gs.lives);
                setCombo(0);
                playSound(playDangerHitSound);
                if (navigator.vibrate) try { navigator.vibrate([100, 50, 100]); } catch {}
                createFloatingText(item.x, item.y - 12, '💣 Debt Bomb Blast! -1 Life', '#f43f5e');

                if (gs.lives <= 0) {
                  gs.gameOver = true;
                  gs.started = false;
                  setGameOver(true);
                  setStarted(false);
                  playSound(playGameOverSound);
                  if (gs.score > highScore) {
                    setHighScore(gs.score);
                    localStorage.setItem('zb_coin_catcher_high', gs.score.toString());
                  }
                }
                return false;
              }
            }
            return false;
          }
        }

        // 🛡️ SHIELD
        if (item.type === 'shield') {
          if (isVerticallyAligned && item.x > playerLeft - 4 && item.x < playerRight + 4) {
            gs.hasShield = true;
            gs.score += item.value;
            setHasShield(true);
            setScore(gs.score);
            playSound(playPowerupSound);
            createParticles(item.x, item.y, '#38bdf8', 18);
            createFloatingText(item.x, item.y - 12, '🛡️ EMERGENCY SHIELD EQUIPPED!', '#38bdf8');
            return false;
          }
        }

        // 🧲 MAGNET
        if (item.type === 'magnet') {
          if (isVerticallyAligned && item.x > playerLeft - 4 && item.x < playerRight + 4) {
            gs.magnetTimer = 360; // 6 seconds
            gs.score += item.value;
            setScore(gs.score);
            playSound(playPowerupSound);
            createParticles(item.x, item.y, '#fbbf24', 18);
            createFloatingText(item.x, item.y - 12, '🧲 COMPOUND MAGNET ACTIVE!', '#fbbf24');
            return false;
          }
        }

        // ❤️ HEART
        if (item.type === 'heart') {
          if (isVerticallyAligned && item.x > playerLeft - 4 && item.x < playerRight + 4) {
            gs.lives = Math.min(5, gs.lives + 1);
            setLives(gs.lives);
            playSound(playPowerupSound);
            createParticles(item.x, item.y, '#ec4899', 16);
            createFloatingText(item.x, item.y - 12, '❤️ +1 EMERGENCY BUFFER LIFE!', '#ec4899');
            return false;
          }
        }

        // 🪙 COINS
        if (item.type === 'coin') {
          if (isVerticallyAligned && item.x > playerLeft - 2 && item.x < playerRight + 2) {
            gs.combo++;
            gs.coinsCollected++;
            if (gs.combo > gs.maxCombo) gs.maxCombo = gs.combo;

            let multiplier = 1;
            if (gs.combo >= 10) multiplier = 3.0;
            else if (gs.combo >= 6) multiplier = 2.0;
            else if (gs.combo >= 3) multiplier = 1.5;

            const totalEarned = Math.round(item.value * multiplier);
            gs.score += totalEarned;

            // Milestone celebrations
            if (gs.score >= 500 && !gs.celebrated500) {
              gs.celebrated500 = true;
              triggerSparklesExplosion(0.5, 0.4);
            }
            if (highScore > 0 && gs.score > highScore && !gs.celebratedHigh) {
              gs.celebratedHigh = true;
              triggerSparklesExplosion(0.5, 0.3);
            }

            playSound(playCoinSound);
            createParticles(item.x, item.y, '#34d399', 14);
            createFloatingText(item.x, item.y - 10, `+${currencySymbol}${totalEarned} ${multiplier > 1 ? `(${multiplier}x)` : ''}`, '#86efac');
            setScore(gs.score);
            setCombo(gs.combo);
            return false;
          }
        }

        // 🎣 SCAM
        if (item.type === 'scam') {
          if (isVerticallyAligned && item.x > playerLeft - 4 && item.x < playerRight + 4) {
            gs.score = Math.max(0, gs.score - 30);
            gs.combo = 0;
            gs.screenShake = 6;
            setScore(gs.score);
            setCombo(0);
            playSound(() => playNotificationSound('warning'));
            if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch {}
            createParticles(item.x, item.y, '#f87171', 16);
            createFloatingText(item.x, item.y - 12, `🚨 SCAM BUSTED! -${currencySymbol}30 & Streak Lost!`, '#f87171');
            return false;
          }
        }

        // ⚠️ HAZARD
        if (item.type === 'expense') {
          if (isVerticallyAligned && item.x > playerLeft + 6 && item.x < playerRight - 6) {
            if (gs.invulnerableTimer > 0) return false;

            if (gs.hasShield) {
              gs.hasShield = false;
              setHasShield(false);
              gs.invulnerableTimer = 65;
              gs.screenShake = 8;
              playSound(playDangerHitSound);
              createParticles(item.x, item.y, '#38bdf8', 14);
              createFloatingText(item.x, item.y - 10, `🛡️ Shield Absorbed Trap!`, '#38bdf8');
              return false;
            }

            gs.lives--;
            gs.invulnerableTimer = 65;
            gs.combo = 0;
            gs.screenShake = 12;
            setLives(gs.lives);
            setCombo(0);
            playSound(playDangerHitSound);
            if (navigator.vibrate) try { navigator.vibrate([80, 50, 80]); } catch {}
            createParticles(item.x, item.y, '#f43f5e', 20);
            createFloatingText(item.x, item.y - 10, `💔 -1 Life (${item.label})`, '#fda4af');

            if (gs.lives <= 0) {
              gs.gameOver = true;
              gs.started = false;
              setGameOver(true);
              setStarted(false);
              playSound(playGameOverSound);
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
      ctx.save();
      if (gs.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      }

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#060a14');
      bgGrad.addColorStop(0.5, '#0a1024');
      bgGrad.addColorStop(1, '#0e1834');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Cyber Grid Lines
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

      // Market Crash Red Edge Alert
      if (gs.crashTimer > 0) {
        const pulseAlpha = 0.15 + Math.sin(gs.frameCount * 0.12) * 0.1;
        ctx.fillStyle = `rgba(244, 63, 94, ${pulseAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.strokeRect(1, 1, W - 2, H - 2);

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#fca5a5';
        ctx.textAlign = 'center';
        ctx.fillText(`🚨 MARKET CRASH! SURVIVE: ${Math.ceil(gs.crashTimer / 60)}s`, W / 2, 44);
      }

      // Ground Line with glow
      const groundGrad = ctx.createLinearGradient(0, H - 16, 0, H);
      groundGrad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
      groundGrad.addColorStop(1, 'rgba(52, 211, 153, 0.05)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H - 16, W, 16);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, H - 16);
      ctx.lineTo(W, H - 16);
      ctx.stroke();

      // Falling items
      gs.items.forEach(item => {
        if (item.type === 'bomb' && item.y > H - 90) {
          const pulse = Math.sin(gs.frameCount * 0.25) * 0.15 + 0.25;
          ctx.fillStyle = `rgba(244, 63, 94, ${pulse})`;
          ctx.beginPath();
          ctx.arc(item.x, H - 42, 44, 0, Math.PI * 2);
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

        ctx.font = 'bold 8.5px sans-serif';
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

      // Player Avatar
      const pX = gs.playerX;
      const pY = H - 60;

      // Platform Glow
      ctx.fillStyle = selectedChar.glow + '40';
      ctx.beginPath();
      ctx.ellipse(pX, pY + 40, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Magnet Pulsing Ring
      if (gs.magnetTimer > 0 || selectedChar.id === 'titan') {
        const ringRadius = 30 + (gs.frameCount % 20) * 1.5;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
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
        ctx.arc(pX, pY + 16, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Invulnerability flash
      const isInvulnerable = gs.invulnerableTimer > 0;
      const isFlashed = isInvulnerable && Math.floor(gs.frameCount / 5) % 2 === 0;

      if (isInvulnerable && !gs.hasShield) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pX, pY + 16, 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Render Player Character Emoji
      ctx.globalAlpha = isFlashed ? 0.45 : 1;
      ctx.shadowColor = gs.hasShield ? '#38bdf8' : selectedChar.glow;
      ctx.shadowBlur = 18;
      ctx.font = '38px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedChar.emoji, pX, pY + 16);
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
        ctx.font = 'bold 10.5px sans-serif';
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
        ctx.shadowBlur = 12;
        const multiplierText = gs.combo >= 10 ? '3x' : gs.combo >= 6 ? '2x' : '1.5x';
        ctx.fillText(`🔥 ${gs.combo}x SIP STREAK (${multiplierText})`, W / 2, 26);
        ctx.shadowBlur = 0;
      }

      // HUD: Score
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`${currencySymbol}${gs.score}`, 14, 24);

      // HUD: Lives & Shield
      ctx.textAlign = 'right';
      ctx.font = '13px sans-serif';
      const shieldIcon = gs.hasShield ? ' 🛡️' : '';
      ctx.fillText(`${'❤️'.repeat(Math.max(0, gs.lives))}${shieldIcon}`, W - 14, 24);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isExpanded, started, gameOver, spawnFormation, createParticles, createFloatingText, currencySymbol, highScore, selectedChar, gameMode, playSound]);

  // Controls (Keyboard: Arrow Keys & Spacebar to start)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!started || gameOver) {
          e.preventDefault();
          resetGame();
        }
      }
      if (!isExpanded || !started || gameOver) return;
      const step = 18;
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayerBy(-step);
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayerBy(step);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isExpanded, started, gameOver, resetGame]);

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
      marginTop: '10px',
      marginBottom: '20px',
      borderRadius: '24px',
      border: '1.5px solid rgba(16, 185, 129, 0.35)',
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 10, 20, 0.98) 100%)',
      overflow: 'hidden',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), 0 0 24px rgba(16, 185, 129, 0.15)'
    }}>
      {/* Arcade Marquee Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        color: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gamepad2 size={18} color="#10b981" />
          <span style={{ fontSize: '13.5px', fontWeight: 900, letterSpacing: '-0.01em' }}>
            {title}
          </span>
          <span style={{
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            fontWeight: 800,
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            TURBO
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            style={{
              background: soundEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${soundEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              padding: '6px',
              color: soundEnabled ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Trophy High Score Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(251, 191, 36, 0.15)',
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid rgba(251, 191, 36, 0.4)'
          }}>
            <Trophy size={13} color="#fbbf24" />
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24' }}>
              {currencySymbol}{highScore}
            </span>
          </div>

          <button
            onClick={() => { setIsExpanded(false); setStarted(false); setGameOver(false); }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '4px 9px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Real-time In-Game HUD Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>WEALTH</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>{currencySymbol}{score}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HEALTH</div>
          <div style={{ fontSize: '14px', letterSpacing: '1px' }}>{'❤️'.repeat(Math.max(0, lives))}{hasShield ? ' 🛡️' : ''}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SIP STREAK</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: combo >= 3 ? '#fbbf24' : '#94a3b8' }}>
            {combo >= 3 ? `🔥${combo}x` : `${combo}x`}
          </div>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={380}
          height={430}
          style={{
            width: '100%',
            aspectRatio: '380 / 430',
            display: 'block',
            background: '#060a14',
            touchAction: 'none',
            cursor: started && !gameOver ? 'ew-resize' : 'default'
          }}
        />

        {/* 🌟 VIBRANT ARCADE START OVERLAY */}
        {!started && !gameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.18) 0%, rgba(6, 10, 20, 0.98) 75%)',
            backdropFilter: 'blur(10px)',
            padding: '16px 14px 14px 14px',
            boxSizing: 'border-box'
          }}>
            {/* Top Badge & Title */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontSize: '10px',
                fontWeight: 800,
                color: '#34d399',
                marginBottom: '6px'
              }}>
                <Zap size={11} />
                <span>FINANCIAL AGILITY ARCADE</span>
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 900,
                margin: '0',
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
              }}>
                Zen Coin Catcher
              </h3>
            </div>

            {/* Character Selector Section */}
            <div style={{ width: '100%', maxWidth: '340px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px',
                textAlign: 'center'
              }}>
                SELECT WEALTH STRATEGY
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px'
              }}>
                {CHARACTERS.map(c => {
                  const isSelected = c.id === selectedCharId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectChar(c)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${c.glow}` : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected ? `${c.glow}20` : 'rgba(255, 255, 255, 0.03)',
                        boxShadow: isSelected ? `0 0 14px ${c.glow}50` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <span style={{ fontSize: '26px', transform: isSelected ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s' }}>
                        {c.emoji}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: isSelected ? '#ffffff' : '#94a3b8', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </span>
                      <span style={{
                        fontSize: '7.5px',
                        fontWeight: 900,
                        color: c.glow,
                        background: `${c.glow}18`,
                        padding: '1px 4px',
                        borderRadius: '4px'
                      }}>
                        {c.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Character Perk Subtitle */}
              <div style={{
                textAlign: 'center',
                fontSize: '10px',
                color: selectedChar.glow,
                fontWeight: 700,
                marginTop: '5px'
              }}>
                ⚡ {selectedChar.name}: {selectedChar.perk}
              </div>
            </div>

            {/* Visual Power-Up Cards (Replaces boring wall of text) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              width: '100%',
              maxWidth: '340px'
            }}>
              <div style={{
                padding: '6px 4px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '15px' }}>🪙</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#34d399' }}>SIP Coins</div>
                <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>+₹15 to +₹250</div>
              </div>

              <div style={{
                padding: '6px 4px',
                borderRadius: '10px',
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '15px' }}>🧲</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#fbbf24' }}>Magnet</div>
                <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Pulls Money</div>
              </div>

              <div style={{
                padding: '6px 4px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '15px' }}>🛡️</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>Shield</div>
                <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Absorbs 1 Trap</div>
              </div>

              <div style={{
                padding: '6px 4px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '15px' }}>💣</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#f87171' }}>Debt Bomb</div>
                <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Dodge Hazard!</div>
              </div>
            </div>

            {/* Mode Selector */}
            <div style={{
              display: 'flex',
              gap: '6px',
              width: '100%',
              maxWidth: '340px'
            }}>
              <button
                onClick={() => { setGameMode('blitz'); playSound(playClickSound); }}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  borderRadius: '10px',
                  border: gameMode === 'blitz' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: gameMode === 'blitz' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: gameMode === 'blitz' ? '#ffffff' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Flame size={12} color={gameMode === 'blitz' ? '#fbbf24' : '#94a3b8'} />
                <span>⚡ Turbo Blitz</span>
              </button>

              <button
                onClick={() => { setGameMode('zen'); playSound(playClickSound); }}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  borderRadius: '10px',
                  border: gameMode === 'zen' ? '1.5px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: gameMode === 'zen' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: gameMode === 'zen' ? '#ffffff' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} color={gameMode === 'zen' ? '#06b6d4' : '#94a3b8'} />
                <span>🌿 Chill Zen</span>
              </button>
            </div>

            {/* Launch Action Button */}
            <div style={{ width: '100%', maxWidth: '340px' }}>
              <button
                onClick={resetGame}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Coins size={18} />
                <span>START ARCADE GAME</span>
              </button>
              <div style={{
                textAlign: 'center',
                fontSize: '9.5px',
                color: '#64748b',
                marginTop: '4px'
              }}>
                Slide finger to steer • Press Spacebar to play
              </div>
            </div>
          </div>
        )}

        {/* 🏆 GAMIFIED VICTORY & SHARE OVERLAY */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 30%, rgba(15, 23, 42, 0.98) 0%, rgba(6, 10, 20, 0.99) 100%)',
            backdropFilter: 'blur(12px)',
            gap: '8px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '38px', animation: 'bounce 0.8s infinite' }}>
              {score >= highScore && score > 0 ? '🏆' : '💸'}
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 900, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              {score >= highScore && score > 0 ? '🎉 New Wealth Record!' : 'Game Over!'}
            </h3>

            {/* Rank Badge */}
            <div style={{
              background: `${userRank.color}15`,
              padding: '5px 14px',
              borderRadius: '999px',
              border: `1.5px solid ${userRank.color}50`,
              color: userRank.color,
              fontSize: '12px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{userRank.title}</span>
            </div>

            {/* Score Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              width: '100%',
              maxWidth: '310px',
              marginTop: '4px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '8px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 700 }}>WEALTH</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>{currencySymbol}{score}</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '8px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 700 }}>HIGH SCORE</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24' }}>{currencySymbol}{highScore}</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '8px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 700 }}>MAX STREAK</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>{gameStateRef.current.maxCombo}x</div>
              </div>
            </div>

            {/* Next Rank Progress */}
            {userRank.nextGoal !== 'MAX RANK' && (
              <div style={{
                fontSize: '10px',
                color: '#94a3b8',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                Target: <span style={{ color: userRank.color, fontWeight: 800 }}>{userRank.nextGoal}</span>
              </div>
            )}

            {/* Viral Share Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', width: '100%', maxWidth: '310px' }}>
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
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
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
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
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

            {/* Watch Video Ad to Revive */}
            {!hasRevivedWithAd && (
              <button
                onClick={handleReviveWithAd}
                disabled={adLoading}
                style={{
                  width: '100%',
                  maxWidth: '310px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: adLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  opacity: adLoading ? 0.7 : 1
                }}
              >
                <Video size={14} />
                {adLoading ? 'Loading Sponsor Video...' : '🎬 Watch Video Ad to Revive (+3 Lives)'}
              </button>
            )}

            {/* Play Again Button */}
            <button
              onClick={resetGame}
              style={{
                width: '100%',
                maxWidth: '310px',
                padding: '11px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.4)'
              }}
            >
              <RotateCcw size={15} />
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Financial Wisdom Banner Footer */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(16, 185, 129, 0.06)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <Sparkles size={14} color="#10b981" style={{ flexShrink: 0 }} />
        <span style={{ lineHeight: 1.4, color: '#cbd5e1' }}>{FINANCIAL_TIPS[currentTipIndex]}</span>
      </div>
    </div>
  );
};
