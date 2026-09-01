-- Run this SQL in the Supabase SQL Editor to ensure the new permissions column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS partner_permissions JSONB DEFAULT '{"syncTransactions":true,"syncBudgets":true,"syncGoals":true,"syncAccounts":true,"syncLoans":true,"syncWishlist":true,"memberPerms":{}}'::jsonb;

-- Ensure family_group_id exists for the multi-member group sync (in case it wasn't added)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS family_group_id UUID;
