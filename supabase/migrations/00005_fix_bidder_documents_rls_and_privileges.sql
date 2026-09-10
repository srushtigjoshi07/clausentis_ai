-- Migration: 00005_fix_bidder_documents_rls_and_privileges.sql
-- Description: Grant table privileges and enforce strict RLS policies on public.bidder_documents and supporting tables

-- 1. Table Grants for authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bidder_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tender_requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.compliance_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_events TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- 2. Ensure RLS is enabled
ALTER TABLE public.bidder_documents ENABLE ROW LEVEL SECURITY;

-- 3. Strict RLS Policies for public.bidder_documents
DROP POLICY IF EXISTS "Users can manage own documents" ON public.bidder_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.bidder_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.bidder_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.bidder_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.bidder_documents;

CREATE POLICY "Users can insert own documents"
  ON public.bidder_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents"
  ON public.bidder_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.bidder_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.bidder_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
