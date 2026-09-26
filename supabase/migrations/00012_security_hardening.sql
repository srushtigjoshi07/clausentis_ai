-- Migration: 00012_security_hardening.sql
-- Description: Close privilege-escalation and data-exposure gaps found in audit.
--   1. Users can no longer change their own profiles.role (bidder -> tender_authority).
--   2. Bidders can only read procurement decisions for bids they actually submitted.
--   3. Anonymous (logged-out) clients can no longer read procurement decisions.

-- ========================================
-- 1. LOCK profiles.role AGAINST SELF-SERVICE CHANGES
-- ========================================
-- "Users can update own profile" (00001) lets a user UPDATE any column of their own
-- row, including role. Only privileged database roles (service_role, postgres via
-- SECURITY DEFINER functions such as handle_new_user) may change it.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'profiles.role can only be changed by an administrator'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_role_guard ON public.profiles;
CREATE TRIGGER profiles_role_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- A user must not be able to INSERT a profile row with an elevated role either.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'bidder');

-- ========================================
-- 2. BIDDER ACCESS TO PROCUREMENT DECISIONS
-- ========================================
-- The previous policy allowed any bidder to read every decision because of
-- "OR officer_user_id IS NOT NULL", and the ILIKE on company_name matched
-- everything when company_name was set to an empty string.
DROP POLICY IF EXISTS "Bidders can view decision status for their own bids" ON public.procurement_decisions;
CREATE POLICY "Bidders can view decision status for their own bids"
  ON public.procurement_decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bid_submissions bs
      WHERE lower(bs.submission_id) = lower(procurement_decisions.bid_id)
        AND bs.user_id = auth.uid()
    )
  );

-- ========================================
-- 3. NO ANONYMOUS READS OF DECISIONS
-- ========================================
REVOKE SELECT ON public.procurement_decisions FROM anon;
