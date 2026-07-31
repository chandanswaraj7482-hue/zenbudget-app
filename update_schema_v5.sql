-- STEP 1: Add target_email and target_plan columns to public.promo_coupons to support targeted user and plan-specific coupons
ALTER TABLE public.promo_coupons ADD COLUMN IF NOT EXISTS target_email TEXT;
ALTER TABLE public.promo_coupons ADD COLUMN IF NOT EXISTS target_plan TEXT;

-- STEP 2: Allow Admin Dashboard and users to update profile subscription tiers without RLS block
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;

CREATE POLICY "Allow update profiles" 
  ON public.profiles FOR UPDATE 
  USING (true)
  WITH CHECK (true);
