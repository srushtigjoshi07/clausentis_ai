-- Migration: 00008_tender_discovery_and_bid_submission.sql
-- Description: Create tables for Tender Discovery catalog, Bidder Profiles, and Bid Submissions with RLS

-- ========================================
-- TENDER DISCOVERY CATALOG
-- ========================================
CREATE TABLE IF NOT EXISTS public.tender_discovery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id TEXT UNIQUE NOT NULL,
  reference_number TEXT NOT NULL,
  title TEXT NOT NULL,
  issuing_organisation TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Goods',
  published_date TIMESTAMPTZ NOT NULL,
  closing_date TIMESTAMPTZ NOT NULL,
  closing_time TEXT NOT NULL DEFAULT '15:00 IST',
  bid_validity_days INTEGER DEFAULT 180,
  emd_amount TEXT NOT NULL,
  estimated_value TEXT NOT NULL,
  tender_status TEXT NOT NULL DEFAULT 'ACTIVE',
  location TEXT NOT NULL,
  contact_details TEXT,
  documents JSONB NOT NULL DEFAULT '[]',
  source_name TEXT NOT NULL DEFAULT 'Central Public Procurement Portal (CPPP)',
  source_url TEXT,
  is_live_source BOOLEAN DEFAULT false,
  minimum_turnover_required NUMERIC DEFAULT 0,
  minimum_experience_years INTEGER DEFAULT 0,
  similar_projects_required INTEGER DEFAULT 1,
  key_technical_specs TEXT[] DEFAULT '{}',
  summary_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_organisation ON public.tender_discovery_items(issuing_organisation);
CREATE INDEX IF NOT EXISTS idx_discovery_status ON public.tender_discovery_items(tender_status);
CREATE INDEX IF NOT EXISTS idx_discovery_closing ON public.tender_discovery_items(closing_date);

-- ========================================
-- BIDDER PROFILES
-- ========================================
CREATE TABLE IF NOT EXISTS public.bidder_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  registration_number TEXT,
  gstin TEXT,
  pan TEXT,
  udyam_number TEXT,
  entity_type TEXT DEFAULT 'Private Limited',
  registered_address TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bidder_profiles_user_id ON public.bidder_profiles(user_id);

-- ========================================
-- BID SUBMISSIONS
-- ========================================
CREATE TABLE IF NOT EXISTS public.bid_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id TEXT UNIQUE NOT NULL,
  tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
  discovered_tender_id TEXT,
  tender_title TEXT NOT NULL,
  tender_reference TEXT NOT NULL,
  issuing_organisation TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bidder_profile JSONB NOT NULL,
  compliance_score NUMERIC(5,2) NOT NULL,
  verification_version INTEGER NOT NULL DEFAULT 1,
  mandatory_passed BOOLEAN NOT NULL DEFAULT true,
  documents_manifest JSONB NOT NULL DEFAULT '[]',
  matrix_snapshot JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  sha256_checksum TEXT NOT NULL,
  disclaimer TEXT NOT NULL,
  audit_trail JSONB NOT NULL DEFAULT '[]',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bid_submissions_user_id ON public.bid_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_submission_id ON public.bid_submissions(submission_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.tender_discovery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_submissions ENABLE ROW LEVEL SECURITY;

-- Tender discovery items: readable by all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active tenders" ON public.tender_discovery_items;
CREATE POLICY "Authenticated users can view active tenders"
  ON public.tender_discovery_items FOR SELECT
  TO authenticated
  USING (true);

-- Bidder profiles: user can manage own profile
DROP POLICY IF EXISTS "Users can manage own bidder profiles" ON public.bidder_profiles;
CREATE POLICY "Users can manage own bidder profiles"
  ON public.bidder_profiles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bid submissions: user can view and insert own submissions
DROP POLICY IF EXISTS "Users can view own bid submissions" ON public.bid_submissions;
CREATE POLICY "Users can view own bid submissions"
  ON public.bid_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bid submissions" ON public.bid_submissions;
CREATE POLICY "Users can insert own bid submissions"
  ON public.bid_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- PERMISSIONS GRANTS
-- ========================================
GRANT SELECT ON TABLE public.tender_discovery_items TO authenticated;
GRANT ALL ON TABLE public.bidder_profiles TO authenticated;
GRANT SELECT, INSERT ON TABLE public.bid_submissions TO authenticated;
