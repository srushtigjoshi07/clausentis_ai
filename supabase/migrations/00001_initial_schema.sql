-- TenderAI Initial Schema
-- Migration: 00001_initial_schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PROFILES
-- ========================================
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  company_name    TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- ENUMS
-- ========================================
CREATE TYPE public.tender_status AS ENUM (
  'uploaded', 'processing', 'analyzed', 'failed'
);

CREATE TYPE public.risk_level AS ENUM (
  'low', 'medium', 'high', 'critical'
);

CREATE TYPE public.requirement_category AS ENUM (
  'legal', 'financial', 'experience', 'technical', 'documentation', 'other'
);

CREATE TYPE public.requirement_status AS ENUM (
  'passed', 'review', 'failed', 'missing'
);

CREATE TYPE public.requirement_priority AS ENUM (
  'mandatory', 'optional', 'desirable'
);

CREATE TYPE public.document_type AS ENUM (
  'financial_statement', 'registration_certificate', 'experience_certificate',
  'tax_document', 'bank_guarantee', 'technical_specification',
  'quality_certification', 'insurance', 'power_of_attorney',
  'affidavit', 'other'
);

CREATE TYPE public.document_processing_status AS ENUM (
  'uploaded', 'processing', 'processed', 'failed'
);

CREATE TYPE public.evaluation_method AS ENUM (
  'rules_engine', 'ai_extraction', 'ai_explanation', 'manual'
);

-- ========================================
-- TENDERS
-- ========================================
CREATE TABLE public.tenders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  issuing_authority TEXT,
  tender_reference  TEXT,
  submission_deadline TIMESTAMPTZ,
  file_path         TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_size_bytes   BIGINT,
  status            public.tender_status NOT NULL DEFAULT 'uploaded',
  readiness_score   NUMERIC(5,2),
  risk_level        public.risk_level,
  total_requirements INTEGER DEFAULT 0,
  passed_count      INTEGER DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  failed_count      INTEGER DEFAULT 0,
  missing_count     INTEGER DEFAULT 0,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenders_user_id ON public.tenders(user_id);
CREATE INDEX idx_tenders_status ON public.tenders(status);

-- ========================================
-- TENDER REQUIREMENTS
-- ========================================
CREATE TABLE public.tender_requirements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id         UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  category          public.requirement_category NOT NULL DEFAULT 'other',
  title             TEXT NOT NULL,
  description       TEXT,
  structured_requirement JSONB,
  priority          public.requirement_priority NOT NULL DEFAULT 'mandatory',
  status            public.requirement_status,
  confidence        NUMERIC(5,2),
  explanation       TEXT,
  recommendation    TEXT,
  source_page       INTEGER,
  source_section    TEXT,
  sort_order        INTEGER DEFAULT 0,
  requirement_type  TEXT,
  numeric_threshold NUMERIC,
  threshold_unit    TEXT,
  threshold_operator TEXT,
  date_requirement  TIMESTAMPTZ,
  time_period_months INTEGER,
  required_documents TEXT[],
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requirements_tender_id ON public.tender_requirements(tender_id);
CREATE INDEX idx_requirements_category ON public.tender_requirements(category);
CREATE INDEX idx_requirements_status ON public.tender_requirements(status);

-- ========================================
-- BIDDER DOCUMENTS
-- ========================================
CREATE TABLE public.bidder_documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id         UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type     public.document_type NOT NULL DEFAULT 'other',
  file_path         TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_size_bytes   BIGINT,
  processing_status public.document_processing_status NOT NULL DEFAULT 'uploaded',
  extracted_data    JSONB,
  page_count        INTEGER,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bidder_docs_tender_id ON public.bidder_documents(tender_id);

-- ========================================
-- COMPLIANCE RESULTS
-- ========================================
CREATE TABLE public.compliance_results (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id    UUID NOT NULL REFERENCES public.tender_requirements(id) ON DELETE CASCADE,
  tender_id         UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  status            public.requirement_status NOT NULL,
  confidence        NUMERIC(5,2),
  explanation       TEXT,
  recommendation    TEXT,
  evaluation_method public.evaluation_method NOT NULL DEFAULT 'ai_extraction',
  rule_id           TEXT,
  evaluated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_requirement_id ON public.compliance_results(requirement_id);
CREATE INDEX idx_compliance_tender_id ON public.compliance_results(tender_id);

-- ========================================
-- EVIDENCE ITEMS
-- ========================================
CREATE TABLE public.evidence_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compliance_result_id UUID NOT NULL REFERENCES public.compliance_results(id) ON DELETE CASCADE,
  document_id       UUID REFERENCES public.bidder_documents(id) ON DELETE SET NULL,
  source_type       TEXT NOT NULL,
  content           TEXT,
  page_number       INTEGER,
  section_reference TEXT,
  bounding_box      JSONB,
  confidence        NUMERIC(5,2),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_result_id ON public.evidence_items(compliance_result_id);

-- ========================================
-- AUDIT EVENTS
-- ========================================
CREATE TABLE public.audit_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tender_id         UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
  event_type        TEXT NOT NULL,
  event_data        JSONB DEFAULT '{}',
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON public.audit_events(user_id);
CREATE INDEX idx_audit_tender_id ON public.audit_events(tender_id);
CREATE INDEX idx_audit_event_type ON public.audit_events(event_type);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own tenders"
  ON public.tenders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tenders"
  ON public.tenders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tenders"
  ON public.tenders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tenders"
  ON public.tenders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tender requirements"
  ON public.tender_requirements FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can manage own documents"
  ON public.bidder_documents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own compliance results"
  ON public.compliance_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can view own evidence"
  ON public.evidence_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.compliance_results cr
    JOIN public.tenders t ON t.id = cr.tender_id
    WHERE cr.id = compliance_result_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own audit events"
  ON public.audit_events FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_tenders_updated_at
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_requirements_updated_at
  BEFORE UPDATE ON public.tender_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_bidder_docs_updated_at
  BEFORE UPDATE ON public.bidder_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
