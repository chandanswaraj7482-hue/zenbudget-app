import confetti from 'canvas-confetti';

/**
 * WEALTHGENZ SYNTHESIZED NOTIFICATION AUDIO CHIMES & SOUND FX
 * Uses Web Audio API to play responsive chimes without downloading sound files.
 */

// Shared AudioContext for zero-latency audio playback
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

export const playNotificationSound = (type: 'success' | 'warning' | 'info' | 'income' | 'error' | 'celebration') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Play a single oscillator tone helper
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
      // Grand celebratory chime melody (C5 -> E5 -> G5 -> C6)
      playTone(523.25, 'sine', 0.12, 0, 0.1);
      playTone(659.25, 'sine', 0.12, 0.06, 0.1);
      playTone(783.99, 'sine', 0.14, 0.12, 0.12);
      playTone(1046.50, 'sine', 0.35, 0.18, 0.15);
    } else if (type === 'success') {
      // Sweet confirmation ping
      playTone(659.25, 'sine', 0.12, 0);
      playTone(987.77, 'sine', 0.18, 0.08);
    } else if (type === 'warning' || type === 'error') {
      // Error / Cancelled buzzer tone
      playTone(220, 'sawtooth', 0.15, 0, 0.1);
      playTone(164.81, 'sawtooth', 0.25, 0.1, 0.1);
    } else {
      // Standard info sound
      playTone(440.00, 'sine', 0.12, 0);
    }
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
};

export const playErrorSound = () => playNotificationSound('error');
export const playCelebrationSound = () => playNotificationSound('celebration');

export const playClickSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.035);
    
    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch (err) {}
};

/**
 * 🎉 MULTI-STAGE FIREWORKS CONFETTI CELEBRATION
 * Fires colorful fireworks cannons + celebratory Audio chime
 */
export const triggerFireworksCelebration = () => {
  playNotificationSound('celebration');

  try {
    const duration = 2.2 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 40 * (timeLeft / duration);

      // Left Fireworks Cannon
      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 70,
        zIndex: 99999,
        particleCount,
        origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 }
      });

      // Right Fireworks Cannon
      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 70,
        zIndex: 99999,
        particleCount,
        origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 }
      });
    }, 220);
  } catch (e) {
    console.warn('Fireworks trigger warning:', e);
  }
};

/**
 * 🔊 GLOBAL AUTOMATIC SFX LISTENER FOR ALL BUTTONS & INTERACTIVE ELEMENTS
 */
if (typeof window !== 'undefined') {
  let lastTouchTime = 0;

  const handleGlobalInteraction = (e: Event) => {
    try {
      const now = Date.now();
      if (now - lastTouchTime < 30) return; // Debounce rapid multi-events

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if target or parent is an interactive button/link/card
      const clickableEl = target.closest('button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], summary, [onclick]');
      
      if (clickableEl) {
        lastTouchTime = now;
        playClickSound();
      }
    } catch (err) {
      // Ignore audio errors silently
    }
  };

  window.addEventListener('pointerdown', handleGlobalInteraction, { capture: true, passive: true });
}
