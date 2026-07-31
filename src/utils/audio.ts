/**
 * WEALTHGENZ SYNTHESIZED NOTIFICATION AUDIO CHIMES
 * Uses Web Audio API to play responsive chimes without downloading sound files.
 */

export const playNotificationSound = (type: 'success' | 'warning' | 'info' | 'income') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // Play a single oscillator tone helper
    const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      // Configure volume profile (fade out cleanly)
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    if (type === 'income') {
      // Cash Register double-clink "cha-ching" effect
      playTone(587.33, 'sine', 0.1, 0); // D5
      playTone(880.00, 'sine', 0.12, 0.06); // A5
      playTone(1174.66, 'sine', 0.25, 0.12); // D6
    } else if (type === 'success') {
      // Sweet confirmation ping
      playTone(659.25, 'sine', 0.12, 0); // E5
      playTone(987.77, 'sine', 0.18, 0.08); // B5
    } else if (type === 'warning') {
      // Deeper double alarm tone
      playTone(196.00, 'triangle', 0.14, 0); // G3
      playTone(196.00, 'triangle', 0.14, 0.2); // G3 repeat
    } else {
      // Standard information notification sound
      playTone(440.00, 'sine', 0.12, 0); // A4
    }
  } catch (err) {
    console.warn('Notification audio playback failed or was blocked by browser autoplay rules:', err);
  }
};
