import { Capacitor } from '@capacitor/core';

export interface NotificationSlotVariation {
  title: string;
  body: string;
}

export interface DailySlotConfig {
  slotId: number;
  hour: number;
  minute: number;
  name: string;
  variations: NotificationSlotVariation[];
}

export const DYNAMIC_DAILY_SLOTS: DailySlotConfig[] = [
  // ☀️ Slot 1: 09:00 AM (Morning Mindset & Safe Limit)
  {
    slotId: 1,
    hour: 9,
    minute: 0,
    name: 'Morning Safe Limit',
    variations: [
      {
        title: '☀️ Good Morning! Your Daily Budget is Ready',
        body: 'Start your day with financial clarity. Check your safe-to-spend limit on ZenBudget before spending today! 🎯',
      },
      {
        title: "🌅 Today's Safe-to-Spend Allowance is Live",
        body: 'A 10-second check now protects your entire monthly savings goal. Open ZenBudget before starting your day! 🚀',
      },
      {
        title: '💰 Pay Yourself First Mindset ☀️',
        body: 'Before spending on anything else today, check your budget health on ZenBudget. Keep the compounding alive! 📈',
      },
      {
        title: '🎯 Win Today’s Budget Challenge!',
        body: 'Can you stay comfortably under today’s safe spending limit? Tap to view your daily allowance on ZenBudget! 🛡️',
      },
      {
        title: '🌿 Morning Financial Clarity',
        body: 'Small daily awareness creates massive long-term wealth. Check your daily safe limit on ZenBudget! ✨',
      },
      {
        title: '☀️ New Day, Zero Overspending Anxiety!',
        body: 'Zen AI has calibrated today’s safe allowance for maximum peace of mind. Tap to review your target! 💡',
      },
      {
        title: '☕ Start Today with 100% Control',
        body: 'Check your real-time wallet balance and daily safe limit before heading out. Make every rupee count! 💎',
      },
    ],
  },

  // ☕ Slot 2: 01:30 PM (Lunch, Chai & Snack Tracker)
  {
    slotId: 2,
    hour: 13,
    minute: 30,
    name: 'Midday Chai & Lunch Tracker',
    variations: [
      {
        title: '☕ Lunch or Chai expenses today?',
        body: 'Log it in 3 seconds with AI Quick Capture! Untracked small spends leak ₹4,000+ monthly. Keep your streak alive! ⚡',
      },
      {
        title: '🥪 Did you grab lunch or snacks today?',
        body: 'Take 3 seconds to log your meal on ZenBudget. Don’t let micro-spends break your daily streak! 🥗',
      },
      {
        title: '⚡ Midday Expense Checkpoint ☕',
        body: 'Log your morning coffee, commute, or lunch in seconds. Instant tracking = zero month-end regret! 🎯',
      },
      {
        title: '🥤 Small Spends Reality Check',
        body: 'Daily ₹50–₹200 snacks quietly drain thousands. Log them right now with Zen Quick Capture! 💸',
      },
      {
        title: '🍽️ Quick Lunchtime Hisab-Kitab',
        body: 'Protect your daily budget! Just type "Paid 180 for lunch" in Quick Capture & AI handles the rest! 🤖',
      },
      {
        title: '🔥 Keep Your Daily Savings Streak Blazing!',
        body: 'Logging even 1 transaction keeps your streak alive and builds unshakeable money discipline! 🚀',
      },
      {
        title: '☕ Afternoon Coffee or Commute Check',
        body: 'Check your remaining safe allowance for the afternoon. Stay disciplined and save extra today! 🌿',
      },
    ],
  },

  // 🛍️ Slot 3: 06:30 PM (Evening Commute & Impulse Blocker)
  {
    slotId: 3,
    hour: 18,
    minute: 30,
    name: 'Evening Impulse Guard',
    variations: [
      {
        title: '🛍️ Evening Out? Check your Safe Limit!',
        body: 'Before dining or impulse shopping, open ZenBudget. Protect your monthly savings goal with 1 quick check! 🛡️',
      },
      {
        title: '🛑 Shopping or Dining out tonight?',
        body: 'Activate Zen 48-Hour Impulse Blocker before checkout. Save ₹3,000+ on things you don’t truly need! ⏳',
      },
      {
        title: '🚕 Heading Home? Log your commute!',
        body: 'Quickly log your cab, metro, or fuel expense to keep today’s budget 100% accurate and on track! ⛽',
      },
      {
        title: '🛒 Cart Full? Take the 48-Hour Pause!',
        body: 'Wait 48 hours before purchasing non-essentials. Your wallet and future wealth will thank you! 🧘',
      },
      {
        title: '🌆 Evening Financial Safety Check',
        body: 'How much safe allowance is left for tonight? Open ZenBudget in 2 seconds and spend worry-free! 🍕',
      },
      {
        title: '🍕 Ordering dinner online tonight?',
        body: 'Check your Food category budget limit first. Keep your monthly savings goal firmly on track! 📊',
      },
      {
        title: '🛡️ Shield Your Monthly Savings Goal',
        body: 'Don’t let evening impulse buys erase your hard work. 1 quick check on ZenBudget keeps you safe! 💎',
      },
    ],
  },

  // 🌙 Slot 4: 09:30 PM (Night Hisab-Kitab & Daily Streak Keeper)
  {
    slotId: 4,
    hour: 21,
    minute: 30,
    name: 'Night Hisab-Kitab Streak',
    variations: [
      {
        title: "🌙 Don't forget your Daily Expense Tracker!",
        body: 'Complete your 60-second Hisab-Kitab before bed. Keep your ZenBudget streak blazing and save ₹5,000+ this month! 🔥',
      },
      {
        title: '🔥 Keep Your Zen Streak Blazing Tonight!',
        body: '1 minute of nighttime expense logging creates true financial freedom. Close out today’s ledger! 🏆',
      },
      {
        title: '✨ 60-Second Bedtime Money Check',
        body: 'Log any pending spends from today so tomorrow starts with a 100% clean financial slate! 🌙',
      },
      {
        title: '🛌 Sleep with Zero Financial Stress',
        body: 'All today’s expenses tracked? Close your Zen daily ring and watch your financial health score rise! 🌿',
      },
      {
        title: '🏆 Daily Budget Victory! 🌙',
        body: 'Review today’s wins and lock in your savings streak on ZenBudget before going to sleep. 🎯',
      },
      {
        title: '📊 Today’s Spending Reflection is Ready',
        body: 'Did you stay under your safe daily limit today? Check your nighttime financial wrap on ZenBudget! 📈',
      },
      {
        title: '🌙 Final Hisab-Kitab Before Bed',
        body: 'Zero untracked rupees today! 60 seconds on ZenBudget keeps you in the top 5% of disciplined savers. 👑',
      },
    ],
  },
];

/**
 * Returns dynamic notification for a given day offset and slot
 */
export function getDynamicNotification(slotIndex: number, dayOffset: number = 0): { title: string; body: string } {
  const slot = DYNAMIC_DAILY_SLOTS[slotIndex];
  if (!slot) return { title: 'ZenBudget Daily Reminder', body: 'Track your daily expenses on ZenBudget!' };

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const variationIndex = (dayOfYear + dayOffset) % slot.variations.length;
  return slot.variations[variationIndex];
}

/**
 * Calculates the next Date object for a given hour, minute and day offset
 */
function getTriggerDateForDay(hour: number, minute: number, dayOffset: number = 0): Date {
  const target = new Date();
  target.setDate(target.getDate() + dayOffset);
  target.setHours(hour, minute, 0, 0);

  const now = new Date();
  if (dayOffset === 0 && target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Schedules 7 days in advance of dynamic rotating daily notifications (28 distinct notifications)
 */
export async function scheduleDailyReminderNotifications(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      let permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        permStatus = await LocalNotifications.requestPermissions();
      }

      if (permStatus.display !== 'granted') {
        console.warn('ZenBudget Notifications: Permission not granted by user.');
        return false;
      }

      // Generate notification IDs for the next 7 days across all 4 slots
      const notificationsToSchedule: any[] = [];
      const cancelIds: { id: number }[] = [];

      for (let day = 0; day < 7; day++) {
        DYNAMIC_DAILY_SLOTS.forEach((slot, slotIdx) => {
          const notifId = 10000 + (day * 10) + slot.slotId;
          cancelIds.push({ id: notifId });

          const dynamicContent = getDynamicNotification(slotIdx, day);
          const triggerDate = getTriggerDateForDay(slot.hour, slot.minute, day);

          notificationsToSchedule.push({
            id: notifId,
            title: dynamicContent.title,
            body: dynamicContent.body,
            schedule: {
              at: triggerDate,
              allowWhileIdle: true,
            },
            smallIcon: 'ic_launcher',
            iconColor: '#10b981',
            sound: undefined,
            actionTypeId: '',
            extra: {
              type: 'daily_reminder',
              slot: slot.name,
              dayOffset: day,
            },
          });
        });
      }

      // Cancel old batch to prevent duplicate stacking
      try {
        await LocalNotifications.cancel({ notifications: cancelIds });
      } catch (e) {}

      // Schedule the 7-day dynamic rotating schedule
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });

      console.log(`✅ ZenBudget: ${notificationsToSchedule.length} Dynamic Rotating Daily Notifications scheduled for the next 7 days!`);
      return true;
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      localStorage.setItem('zb_daily_reminders_active', 'true');
      return Notification.permission === 'granted';
    }
  } catch (err) {
    console.warn('ZenBudget: Error scheduling dynamic notifications:', err);
  }
  return false;
}

/**
 * Checks in web/browser mode if any scheduled dynamic notification matches current time
 */
export function checkAndTriggerWebDailyNotification(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const curHour = now.getHours();
  const curMin = now.getMinutes();

  DYNAMIC_DAILY_SLOTS.forEach((slot, slotIdx) => {
    if (slot.hour === curHour && Math.abs(slot.minute - curMin) <= 1) {
      const lastKey = `zb_web_notif_dynamic_${slot.slotId}_${now.toDateString()}`;
      if (!localStorage.getItem(lastKey)) {
        try {
          const dynamicMsg = getDynamicNotification(slotIdx, 0);
          new Notification(dynamicMsg.title, {
            body: dynamicMsg.body,
            icon: '/favicon.png',
            badge: '/favicon.png',
          });
          localStorage.setItem(lastKey, 'true');
        } catch (e) {
          console.warn('Web notification dispatch error:', e);
        }
      }
    }
  });
}
