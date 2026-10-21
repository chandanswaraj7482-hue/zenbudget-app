/**
 * Tactile Haptic Feedback Utility for ZenBudget
 * Provides subtle, native-feeling vibration feedback on Android / mobile devices.
 */

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }
  try {
    switch (style) {
      case 'light':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(16);
        break;
      case 'heavy':
        navigator.vibrate(28);
        break;
      case 'success':
        navigator.vibrate([12, 50, 16]);
        break;
      case 'warning':
        navigator.vibrate([20, 60, 20]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Ignore any browser permission or policy errors
  }
};
