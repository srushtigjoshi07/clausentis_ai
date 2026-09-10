-- Migration: 00009_multi_role_authority_and_bidder.sql
-- Description: Multi-Role Procurement Platform Upgrade
-- Supports: Tender Authority & Bidder / Vendor distinct roles, RLS policies, notifications, and corrigendums

-- ========================================
-- 1. EXTEND PROFILES WITH ROLES
-- ========================================

-- Add role column if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN 
    ALTER TABLE public.profiles 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'bidder' 
    CHECK (role IN ('tender_authority', 'bidder'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'organisation_name'
  ) THEN 
    ALTER TABLE public.profiles 
    ADD COLUMN organisation_name TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ========================================
-- 2. EXTEND TENDERS WITH AUTHORITY LINK
-- ========================================
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenders' AND column_name = 'authority_id'
  ) THEN 
    ALTER TABLE public.tenders 
    ADD COLUMN authority_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenders' AND column_name = 'issuing_organisation'
  ) THEN 
    ALTER TABLE public.tenders 
    ADD COLUMN issuing_organisation TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenders_authority ON public.tenders(authority_id);

-- ========================================
-- 3. EXTEND BID SUBMISSIONS WITH AUTHORITY LINK
-- ========================================
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bid_submissions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bid_submissions' AND column_name = 'authority_id'
    ) THEN 
      ALTER TABLE public.bid_submissions 
      ADD COLUMN authority_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_submissions_authority ON public.bid_submissions(authority_id);

-- ========================================
-- 4. NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'bidder' CHECK (role IN ('tender_authority', 'bidder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'info', 'success', 'warning')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- ========================================
-- 5. TENDER CORRIGENDUMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.tender_corrigendums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id TEXT NOT NULL,
  corrigendum_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  affected_clauses TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corrigendums_tender ON public.tender_corrigendums(tender_id);

-- ========================================
-- 6. STRICT ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_corrigendums ENABLE ROW LEVEL SECURITY;

-- Notifications Policy: Users can only view & update their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Corrigendums Policy: Public read
DROP POLICY IF EXISTS "Anyone can view corrigendums" ON public.tender_corrigendums;
CREATE POLICY "Anyone can view corrigendums" ON public.tender_corrigendums
  FOR SELECT USING (true);

-- Bid Submissions Policy: Bidders view own, Authority views managed
DROP POLICY IF EXISTS "Bidder and Authority access submissions" ON public.bid_submissions;
CREATE POLICY "Bidder and Authority access submissions" ON public.bid_submissions
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = authority_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'tender_authority'
    )
  );
