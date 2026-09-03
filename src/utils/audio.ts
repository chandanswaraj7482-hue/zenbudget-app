import confetti from 'canvas-confetti';

/**
 * WEALTHGENZ SYNTHESIZED NOTIFICATION AUDIO CHIMES & SOUND FX
 * Uses Web Audio API to play responsive chimes without downloading sound files.
 */

export const playNotificationSound = (type: 'success' | 'warning' | 'info' | 'income' | 'error' | 'celebration') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
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
    console.warn('Audio playback failed or was blocked by browser autoplay rules:', err);
  }
};

export const playErrorSound = () => playNotificationSound('error');
export const playCelebrationSound = () => playNotificationSound('celebration');

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
