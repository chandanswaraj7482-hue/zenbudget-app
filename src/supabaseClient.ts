import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqnttkiwucvscydfehof.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnR0a2l3dWN2c2N5ZGZlaG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTQ5NDIsImV4cCI6MjA5OTI3MDk0Mn0.QKcdsK6mFhxFa2AkW084Paj53qv5qO0GerWzXBP5cQU';

// Bootstrap function to restore session synchronously from native Preferences into localStorage on startup
export const bootstrapSession = async () => {
  try {
    const key = 'sb-oqnttkiwucvscydfehof-auth-token';
    const localSession = localStorage.getItem(key);
    if (!localSession) {
      const { value } = await Preferences.get({ key });
      if (value) {
        localStorage.setItem(key, value);
        console.log('supabaseClient: Successfully restored session from Preferences.');
      }
    }
  } catch (e) {
    console.warn('supabaseClient: Failed to bootstrap session:', e);
  }
};

// Custom hybrid storage adapter to ensure auth sessions persist in native SharedPreferences on Android/iOS
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null) return value;
    } catch (e) {
      console.warn('Capacitor Preferences get error, falling back to localStorage:', e);
    }
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await Preferences.set({ key, value });
    } catch (e) {
      console.warn('Capacitor Preferences set error, falling back to localStorage:', e);
    }
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await Preferences.remove({ key });
    } catch (e) {
      console.warn('Capacitor Preferences remove error, falling back to localStorage:', e);
    }
    localStorage.removeItem(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
