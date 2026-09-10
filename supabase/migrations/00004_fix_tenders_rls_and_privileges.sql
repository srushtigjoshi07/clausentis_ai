-- Migration: 00004_fix_tenders_rls_and_privileges.sql
-- Description: Ensure explicit table privileges and strict RLS policies for authenticated users on public.tenders

-- 1. Ensure table grants for authenticated role on public.tenders
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenders TO authenticated;

-- 2. Ensure RLS is enabled on public.tenders
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- 3. Strict RLS Policies for public.tenders
DROP POLICY IF EXISTS "Users can insert own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Users can create their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tenders;

CREATE POLICY "Users can insert own tenders"
  ON public.tenders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own tenders" ON public.tenders;
CREATE POLICY "Users can view own tenders"
  ON public.tenders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tenders" ON public.tenders;
CREATE POLICY "Users can update own tenders"
  ON public.tenders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tenders" ON public.tenders;
CREATE POLICY "Users can delete own tenders"
  ON public.tenders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
