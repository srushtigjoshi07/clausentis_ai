-- Migration: 00006_fix_write_rls_policies.sql
-- Description: Add missing INSERT, UPDATE, DELETE RLS policies for compliance_results,
--              evidence_items, and audit_events so the authenticated user can write data
--              during tender analysis.

-- ========================================
-- COMPLIANCE RESULTS - INSERT/UPDATE/DELETE
-- ========================================
DROP POLICY IF EXISTS "Users can insert own compliance results" ON public.compliance_results;
CREATE POLICY "Users can insert own compliance results"
  ON public.compliance_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own compliance results" ON public.compliance_results;
CREATE POLICY "Users can update own compliance results"
  ON public.compliance_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own compliance results" ON public.compliance_results;
CREATE POLICY "Users can delete own compliance results"
  ON public.compliance_results
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid())
  );

-- ========================================
-- EVIDENCE ITEMS - INSERT/UPDATE/DELETE
-- ========================================
DROP POLICY IF EXISTS "Users can insert own evidence" ON public.evidence_items;
CREATE POLICY "Users can insert own evidence"
  ON public.evidence_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compliance_results cr
      JOIN public.tenders t ON t.id = cr.tender_id
      WHERE cr.id = compliance_result_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own evidence" ON public.evidence_items;
CREATE POLICY "Users can update own evidence"
  ON public.evidence_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compliance_results cr
      JOIN public.tenders t ON t.id = cr.tender_id
      WHERE cr.id = compliance_result_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own evidence" ON public.evidence_items;
CREATE POLICY "Users can delete own evidence"
  ON public.evidence_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compliance_results cr
      JOIN public.tenders t ON t.id = cr.tender_id
      WHERE cr.id = compliance_result_id AND t.user_id = auth.uid()
    )
  );

-- ========================================
-- AUDIT EVENTS - INSERT
-- ========================================
DROP POLICY IF EXISTS "Users can insert own audit events" ON public.audit_events;
CREATE POLICY "Users can insert own audit events"
  ON public.audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
