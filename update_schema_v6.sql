-- STEP 1: Add link_url and button_text columns to public.broadcast_notifications table
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS button_text TEXT;
