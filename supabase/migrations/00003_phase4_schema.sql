-- Migration: 00003_phase4_schema.sql
-- Description: Add RLS write policies for tender_requirements and optional snapshot columns

-- Add snapshot column to tenders if not exists
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS snapshot JSONB DEFAULT '{}'::jsonb;

-- Add confidence column to tender_requirements if not exists
ALTER TABLE public.tender_requirements ADD COLUMN IF NOT EXISTS confidence NUMERIC;

-- RLS Write Policies for Tender Requirements
DROP POLICY IF EXISTS "Users can insert own tender requirements" ON public.tender_requirements;
CREATE POLICY "Users can insert own tender requirements"
  ON public.tender_requirements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own tender requirements" ON public.tender_requirements;
CREATE POLICY "Users can update own tender requirements"
  ON public.tender_requirements FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own tender requirements" ON public.tender_requirements;
CREATE POLICY "Users can delete own tender requirements"
  ON public.tender_requirements FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.user_id = auth.uid()));
