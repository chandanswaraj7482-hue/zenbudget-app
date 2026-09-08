-- STEP 1: Add fcm_token column to public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
