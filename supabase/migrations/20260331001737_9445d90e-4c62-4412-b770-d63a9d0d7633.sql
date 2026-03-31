
-- Add department column to profiles for role selection during signup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;

-- Add assigned_presales_id to opportunities (references profiles.user_id)
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS assigned_presales_id uuid;
