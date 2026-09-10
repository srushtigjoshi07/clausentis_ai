-- Migration: 00007_cross_document_intelligence.sql
-- Description: Add cross-document intelligence findings table and tenders summary column

-- ========================================
-- CROSS-DOCUMENT FINDINGS TABLE
-- ========================================
-- Stores individual cross-document comparison findings per tender.
-- Each finding represents a specific fact-type comparison result
-- with full traceability to source documents and values.

CREATE TABLE IF NOT EXISTS public.cross_document_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  fact_type TEXT NOT NULL,           -- 'identity', 'registration', 'financial', 'experience', 'certification', 'date'
  fact_label TEXT NOT NULL,          -- 'Legal Entity Name', 'PAN', 'Turnover (2023-24)', etc.
  documents JSONB NOT NULL,          -- Array of {document_id, document_name, original_value, normalized_value, page_number, source_excerpt}
  result TEXT NOT NULL,              -- 'MATCH', 'PARTIAL_MATCH', 'POTENTIAL_MISMATCH', 'CONFIRMED_MISMATCH', 'NOT_FOUND', 'REQUIRES_MANUAL_REVIEW'
  severity TEXT NOT NULL,            -- 'HIGH', 'MEDIUM', 'LOW'
  severity_reason TEXT,
  explanation TEXT,
  recommended_action TEXT,
  comparison_method TEXT NOT NULL DEFAULT 'deterministic',  -- 'deterministic', 'normalization', 'ai_semantic'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_doc_findings_tender_id ON public.cross_document_findings(tender_id);
CREATE INDEX IF NOT EXISTS idx_cross_doc_findings_severity ON public.cross_document_findings(severity);

-- ========================================
-- CROSS-DOCUMENT SUMMARY ON TENDERS
-- ========================================
-- JSON summary of cross-document analysis results stored on the tender record.

ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS cross_document_summary JSONB DEFAULT NULL;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.cross_document_findings ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only view findings for tenders they own
DROP POLICY IF EXISTS "Users can view own cross-document findings" ON public.cross_document_findings;
CREATE POLICY "Users can view own cross-document findings"
  ON public.cross_document_findings
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()
  ));

-- INSERT: users can only insert findings for tenders they own
DROP POLICY IF EXISTS "Users can insert own cross-document findings" ON public.cross_document_findings;
CREATE POLICY "Users can insert own cross-document findings"
  ON public.cross_document_findings
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()
  ));

-- DELETE: users can only delete findings for tenders they own
DROP POLICY IF EXISTS "Users can delete own cross-document findings" ON public.cross_document_findings;
CREATE POLICY "Users can delete own cross-document findings"
  ON public.cross_document_findings
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()
  ));

-- ========================================
-- TABLE GRANTS
-- ========================================
GRANT SELECT, INSERT, DELETE ON TABLE public.cross_document_findings TO authenticated;
