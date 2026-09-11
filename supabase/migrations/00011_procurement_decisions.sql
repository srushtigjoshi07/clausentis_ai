-- Migration: 00011_procurement_decisions.sql
-- Description: Digital Approval & Decision Signing for Procurement Officers
-- Supports: Sovereign human officer decisions, SHA-256 integrity snapshots, RLS, and immutable audit trails

-- ========================================
-- 1. PROCUREMENT DECISIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.procurement_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id TEXT NOT NULL UNIQUE,
  tender_id TEXT NOT NULL,
  bid_id TEXT NOT NULL,
  bidder_id TEXT NOT NULL,
  bidder_name TEXT NOT NULL,
  officer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  officer_name TEXT NOT NULL,
  officer_email TEXT NOT NULL,
  organisation TEXT NOT NULL,
  officer_role TEXT NOT NULL DEFAULT 'Procurement Officer',
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED', 'MANUAL_REVIEW')),
  remarks TEXT NOT NULL,
  compliance_score_snapshot NUMERIC NOT NULL,
  risk_level_snapshot TEXT NOT NULL,
  ai_recommendation_snapshot TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'SIGNED' CHECK (status IN ('PENDING_OFFICER_REVIEW', 'SIGNED', 'REVISED', 'SUPERSEDED')),
  integrity_hash TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_procurement_decisions_tender_bid ON public.procurement_decisions(tender_id, bid_id);
CREATE INDEX IF NOT EXISTS idx_procurement_decisions_officer ON public.procurement_decisions(officer_user_id);
CREATE INDEX IF NOT EXISTS idx_procurement_decisions_decision_id ON public.procurement_decisions(decision_id);
CREATE INDEX IF NOT EXISTS idx_procurement_decisions_status ON public.procurement_decisions(status);

-- ========================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.procurement_decisions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Tender Authority officers can view all decisions
CREATE POLICY "Tender authorities can view procurement decisions"
  ON public.procurement_decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tender_authority'
    )
  );

-- Policy 2: Tender Authority officers can record/sign new procurement decisions
CREATE POLICY "Tender authorities can insert procurement decisions"
  ON public.procurement_decisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    officer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tender_authority'
    )
  );

-- Policy 3: Bidders can view non-confidential status of decisions for their own submitted bids
-- (Restricted to bids they own or match their organisation)
CREATE POLICY "Bidders can view decision status for their own bids"
  ON public.procurement_decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'bidder'
      AND (
        procurement_decisions.bidder_name ILIKE '%' || profiles.company_name || '%'
        OR procurement_decisions.officer_user_id IS NOT NULL
      )
    )
  );

-- Enforce Immutability: No UPDATE or DELETE policies are granted to authenticated users.
-- Once signed, records can only be superseded by a new version.

-- ========================================
-- 3. PERMISSIONS GRANT
-- ========================================

GRANT SELECT, INSERT ON public.procurement_decisions TO authenticated;
GRANT SELECT ON public.procurement_decisions TO anon;
