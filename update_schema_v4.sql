-- ============================================================================
-- ZENBUDGET SUPABASE MIGRATION (V4.0 - ADMIN, BROADCAST & RATINGS SYSTEM)
-- Run this in your Supabase SQL Editor to enable Admin Panel, Broadcasts & Ratings.
-- ============================================================================

-- STEP 1: Add is_suspended column to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- STEP 2: Create broadcast_notifications table
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'update')),
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for broadcast_notifications
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read broadcast notifications" ON public.broadcast_notifications;
CREATE POLICY "Allow users to read broadcast notifications" 
  ON public.broadcast_notifications FOR SELECT 
  USING (target_user_id IS NULL OR target_user_id = auth.uid());

DROP POLICY IF EXISTS "Allow insert broadcast notifications" ON public.broadcast_notifications;
CREATE POLICY "Allow insert broadcast notifications" 
  ON public.broadcast_notifications FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete broadcast notifications" ON public.broadcast_notifications;
CREATE POLICY "Allow delete broadcast notifications" 
  ON public.broadcast_notifications FOR DELETE 
  USING (true);

-- STEP 3: Create app_settings table for global announcements & feature toggles
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read app_settings" ON public.app_settings;
CREATE POLICY "Allow anyone to read app_settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert update app_settings" ON public.app_settings;
CREATE POLICY "Allow insert update app_settings" ON public.app_settings FOR ALL USING (true);

-- STEP 4: Create promo_coupons table for custom discount codes
CREATE TABLE IF NOT EXISTS public.promo_coupons (
  code TEXT PRIMARY KEY,
  discount_percent INTEGER DEFAULT 50 CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER DEFAULT 100,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.promo_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read promo_coupons" ON public.promo_coupons;
CREATE POLICY "Allow anyone to read promo_coupons" ON public.promo_coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow modify promo_coupons" ON public.promo_coupons;
CREATE POLICY "Allow modify promo_coupons" ON public.promo_coupons FOR ALL USING (true);

-- STEP 5: Create app_ratings table for user feedback and ratings
CREATE TABLE IF NOT EXISTS public.app_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  user_email TEXT,
  rating_stars INTEGER DEFAULT 5 CHECK (rating_stars >= 1 AND rating_stars <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to insert app_ratings" ON public.app_ratings;
CREATE POLICY "Allow anyone to insert app_ratings" ON public.app_ratings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anyone to read app_ratings" ON public.app_ratings;
CREATE POLICY "Allow anyone to read app_ratings" ON public.app_ratings FOR SELECT USING (true);
