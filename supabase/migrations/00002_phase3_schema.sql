-- Migration: 00002_phase3_schema.sql
-- Description: Complete schema creation for Phase 3 (Fallback for when tables don't exist)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PROFILES (Ensure it exists)
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- ENUMS
-- ========================================
DO $$ BEGIN
    CREATE TYPE public.tender_status AS ENUM ('uploaded', 'processing', 'analyzed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.requirement_category AS ENUM ('legal', 'financial', 'experience', 'technical', 'documentation', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.compliance_status AS ENUM ('pass', 'review', 'fail', 'missing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.document_status AS ENUM ('uploaded', 'processing', 'processed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- TENDERS
-- ========================================
CREATE TABLE IF NOT EXISTS public.tenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.tender_status NOT NULL DEFAULT 'uploaded',
  original_filename TEXT,
  storage_path TEXT,
  file_size BIGINT,
  compliance_score NUMERIC,
  risk_level public.risk_level,
  requirements_count INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  missing_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- TENDER REQUIREMENTS
-- ========================================
CREATE TABLE IF NOT EXISTS public.tender_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES public.tenders(id) ON DELETE CASCADE NOT NULL,
  requirement_code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category public.requirement_category NOT NULL DEFAULT 'other',
  mandatory BOOLEAN DEFAULT true,
  threshold_value NUMERIC,
  threshold_unit TEXT,
  currency TEXT,
  required_count INTEGER,
  time_period TEXT,
  deadline TIMESTAMPTZ,
  source_page INTEGER,
  source_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- BIDDER DOCUMENTS
-- ========================================
CREATE TABLE IF NOT EXISTS public.bidder_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  document_type TEXT,
  storage_path TEXT,
  original_filename TEXT,
  file_size BIGINT,
  status public.document_status DEFAULT 'uploaded',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- COMPLIANCE RESULTS
-- ========================================
CREATE TABLE IF NOT EXISTS public.compliance_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES public.tenders(id) ON DELETE CASCADE NOT NULL,
  requirement_id UUID REFERENCES public.tender_requirements(id) ON DELETE CASCADE NOT NULL,
  bidder_document_id UUID REFERENCES public.bidder_documents(id) ON DELETE SET NULL,
  status public.compliance_status NOT NULL,
  explanation TEXT,
  recommendation TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- EVIDENCE ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS public.evidence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compliance_result_id UUID REFERENCES public.compliance_results(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.bidder_documents(id) ON DELETE CASCADE,
  page_number INTEGER,
  source_text TEXT,
  evidence_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- AUDIT EVENTS
-- ========================================
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tenders
DROP POLICY IF EXISTS "Users can view own tenders" ON public.tenders;
CREATE POLICY "Users can view own tenders" ON public.tenders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tenders" ON public.tenders;
CREATE POLICY "Users can insert own tenders" ON public.tenders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tenders" ON public.tenders;
CREATE POLICY "Users can update own tenders" ON public.tenders FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tenders" ON public.tenders;
CREATE POLICY "Users can delete own tenders" ON public.tenders FOR DELETE USING (auth.uid() = user_id);

-- Tender Requirements
DROP POLICY IF EXISTS "Users can view own tender requirements" ON public.tender_requirements;
CREATE POLICY "Users can view own tender requirements" ON public.tender_requirements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid())
);

-- Bidder Documents
DROP POLICY IF EXISTS "Users can manage own documents" ON public.bidder_documents;
CREATE POLICY "Users can manage own documents" ON public.bidder_documents FOR ALL USING (auth.uid() = user_id);

-- Compliance Results
DROP POLICY IF EXISTS "Users can view own compliance results" ON public.compliance_results;
CREATE POLICY "Users can view own compliance results" ON public.compliance_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid())
);

-- Evidence Items
DROP POLICY IF EXISTS "Users can view own evidence" ON public.evidence_items;
CREATE POLICY "Users can view own evidence" ON public.evidence_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.compliance_results cr
    JOIN public.tenders t ON t.id = cr.tender_id
    WHERE cr.id = compliance_result_id AND t.user_id = auth.uid()
  )
);

-- Audit Events
DROP POLICY IF EXISTS "Users can view own audit events" ON public.audit_events;
CREATE POLICY "Users can view own audit events" ON public.audit_events FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- STORAGE BUCKETS
-- ========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenders', 'tenders', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('bidder-documents', 'bidder-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Tenders Bucket Policies
DROP POLICY IF EXISTS "Users can upload their own tenders" ON storage.objects;
CREATE POLICY "Users can upload their own tenders" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'tenders' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own tenders" ON storage.objects;
CREATE POLICY "Users can view their own tenders" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'tenders' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own tenders" ON storage.objects;
CREATE POLICY "Users can delete their own tenders" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'tenders' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Bidder Documents Bucket Policies
DROP POLICY IF EXISTS "Users can upload their own bidder documents" ON storage.objects;
CREATE POLICY "Users can upload their own bidder documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'bidder-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own bidder documents" ON storage.objects;
CREATE POLICY "Users can view their own bidder documents" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'bidder-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own bidder documents" ON storage.objects;
CREATE POLICY "Users can delete their own bidder documents" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'bidder-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ========================================
-- TRIGGERS (Ensure handle_new_user exists)
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_tenders_updated_at ON public.tenders;
CREATE TRIGGER set_tenders_updated_at BEFORE UPDATE ON public.tenders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_bidder_docs_updated_at ON public.bidder_documents;
CREATE TRIGGER set_bidder_docs_updated_at BEFORE UPDATE ON public.bidder_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_compliance_results_updated_at ON public.compliance_results;
CREATE TRIGGER set_compliance_results_updated_at BEFORE UPDATE ON public.compliance_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
