import confetti from 'canvas-confetti';

/**
 * WEALTHGENZ SYNTHESIZED NOTIFICATION AUDIO CHIMES & SOUND FX
 * Uses Web Audio API to play responsive chimes without downloading sound files.
 */

let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (err) {
    return null;
  }
};

/**
 * 🔊 1. Subtle Clean Click / Tap Sound
 */
export const playClickSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.035);
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch (err) {}
};

/**
 * 🔊 2. Tab Switch / Navigation Sound (Crisp tick)
 */
export const playTabSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.04);
    
    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (err) {}
};

/**
 * 🔊 3. Add Transaction / Cash Register Cha-Ching SFX!
 */
export const playAddTransactionSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Coin chime 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // High cash register chime 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.35);

    // Sparkle harmonic
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.15); // G6
    gain3.gain.setValueAtTime(0.06, ctx.currentTime + 0.15);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.15);
    osc3.stop(ctx.currentTime + 0.4);
  } catch (err) {}
};

/**
 * 🔊 4. Coin Pickup SFX (for Game)
 */
export const playCoinSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.05); // E6
    
    gainNode.gain.setValueAtTime(0.07, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (err) {}
};

/**
 * 🔊 5. Delete / Cancel / Close Sound (Soft low swoosh)
 */
export const playDeleteSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (err) {}
};

/**
 * 🔊 6. Standard Notification & Chimes
 */
export const playNotificationSound = (type: 'success' | 'warning' | 'info' | 'income' | 'error' | 'celebration') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0, vol = 0.08) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gainNode.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    if (type === 'income' || type === 'celebration') {
      playTone(523.25, 'sine', 0.12, 0, 0.1);
      playTone(659.25, 'sine', 0.12, 0.06, 0.1);
      playTone(783.99, 'sine', 0.14, 0.12, 0.12);
      playTone(1046.50, 'sine', 0.35, 0.18, 0.15);
    } else if (type === 'success') {
      playTone(659.25, 'sine', 0.12, 0);
      playTone(987.77, 'sine', 0.18, 0.08);
    } else if (type === 'warning' || type === 'error') {
      playTone(220, 'sawtooth', 0.15, 0, 0.1);
      playTone(164.81, 'sawtooth', 0.25, 0.1, 0.1);
    } else {
      playTone(440.00, 'sine', 0.12, 0);
    }
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
};

export const playErrorSound = () => playNotificationSound('error');
export const playCelebrationSound = () => playNotificationSound('celebration');

/**
 * ✨ RADIANT SPARKLES & CONFETTI CELEBRATION
 * Launches celebratory fireworks with audio chime!
 */
export const triggerSparklesExplosion = (x = 0.5, y = 0.5) => {
  playAddTransactionSound();

  try {
    // Center Burst
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { x, y },
      colors: ['#10b981', '#34d399', '#fbbf24', '#38bdf8', '#a855f7'],
      zIndex: 999999
    });

    // Delayed shimmering sparkles
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 120,
        origin: { x, y: Math.max(0.2, y - 0.1) },
        ticks: 200,
        gravity: 0.8,
        colors: ['#34d399', '#fbbf24', '#ffffff'],
        zIndex: 999999
      });
    }, 150);
  } catch (e) {
    console.warn('Sparkles confetti error:', e);
  }
};

export const triggerFireworksCelebration = () => {
  playNotificationSound('celebration');

  try {
    const duration = 2.0 * 1000;
    const animationEnd = Date.now() + duration;
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 40 * (timeLeft / duration);

      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 70,
        zIndex: 999999,
        particleCount,
        origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 }
      });

      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 70,
        zIndex: 999999,
        particleCount,
        origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 }
      });
    }, 220);
  } catch (e) {
    console.warn('Fireworks trigger warning:', e);
  }
};

/**
 * 🔊 GLOBAL DYNAMIC SFX DELEGATION
 * Automatically triggers distinct sound effects based on button identity & context!
 */
if (typeof window !== 'undefined') {
  let lastTouchTime = 0;

  const handleGlobalInteraction = (e: Event) => {
    try {
      const now = Date.now();
      if (now - lastTouchTime < 30) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickableEl = target.closest('button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], summary');
      if (!clickableEl) return;

      lastTouchTime = now;
      const elText = (clickableEl.textContent || '').toLowerCase();
      const elClass = (clickableEl.className || '').toString().toLowerCase();
      const elAria = (clickableEl.getAttribute('aria-label') || '').toLowerCase();
      const combined = `${elText} ${elClass} ${elAria}`;

      // Differentiate sound effect based on button action
      if (/\b(delete|trash|remove|cancel|close|clear)\b/.test(combined)) {
        playDeleteSound();
      } else if (/\b(save|add|log|submit|confirm|quick log|record|pay)\b/.test(combined)) {
        playAddTransactionSound();
      } else if (/\b(tab|filter|view|sort|nav|switch)\b/.test(combined) || clickableEl.getAttribute('role') === 'tab') {
        playTabSound();
      } else {
        playClickSound();
      }
    } catch (err) {}
  };

  window.addEventListener('pointerdown', handleGlobalInteraction, { capture: true, passive: true });
}
