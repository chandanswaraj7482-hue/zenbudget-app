/**
 * Anti-Inspect & DevTools Security Shield
 * Protects ZenBudget web app and Capacitor APK from inspect element, source viewing,
 * right-click context menu, and keyboard shortcuts safely without freezing execution.
 */

export function initAntiInspect() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Disable Right-Click Context Menu globally
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, false);

  // 2. Disable DevTools & Inspect Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    const key = e.key ? e.key.toLowerCase() : '';
    const keyCode = e.keyCode;

    // Block F12 (DevTools)
    if (key === 'f12' || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || keyCode === 73)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+J / Cmd+Option+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'j' || keyCode === 74)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+C / Cmd+Option+C (Inspect Element Selector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'c' || keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+U / Cmd+Option+U (View Page Source)
    if ((e.ctrlKey || e.metaKey) && (key === 'u' || keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+S / Cmd+S (Save Page HTML)
    if ((e.ctrlKey || e.metaKey) && (key === 's' || keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 3. Prevent image dragging
  document.addEventListener('dragstart', (e) => {
    if (e.target instanceof HTMLImageElement) {
      e.preventDefault();
    }
  }, false);
}
