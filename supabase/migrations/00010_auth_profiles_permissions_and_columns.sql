-- Migration: 00010_auth_profiles_permissions_and_columns.sql
-- Description: Align public.profiles columns, grant INSERT privilege to authenticated, and enhance handle_new_user trigger

-- 1. Ensure required columns exist on public.profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN 
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'organisation_name'
  ) THEN 
    ALTER TABLE public.profiles ADD COLUMN organisation_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN 
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'bidder';
  END IF;
END $$;

-- 2. Grant permissions to authenticated role for profile management
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- 3. Enhance handle_new_user trigger to populate email, role, and organisation_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company_name,
    role,
    organisation_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Procurement User'),
    COALESCE(NEW.raw_user_meta_data->>'organisation_name', NEW.raw_user_meta_data->>'company_name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'bidder'),
    COALESCE(NEW.raw_user_meta_data->>'organisation_name', NEW.raw_user_meta_data->>'company_name'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    organisation_name = EXCLUDED.organisation_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
