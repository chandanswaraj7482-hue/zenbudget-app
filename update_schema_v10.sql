-- Migration to add dob and monthly_salary to profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC DEFAULT 0;

-- Optionally, add comments for documentation
COMMENT ON COLUMN public.profiles.dob IS 'Date of Birth in YYYY-MM-DD format';
COMMENT ON COLUMN public.profiles.monthly_salary IS 'Users monthly salary/income';
