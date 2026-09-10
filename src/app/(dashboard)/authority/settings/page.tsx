import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { logout, switchRoleFormAction } from '@/app/auth/actions';
import { 
  Building2, 
  ShieldCheck, 
  Cpu, 
  LogOut, 
  ArrowRightLeft, 
  FileText, 
  Lock, 
  User, 
  Mail,
  CheckCircle2
} from 'lucide-react';

export const metadata = {
  title: 'Settings - Clausentis Authority Portal',
  description: 'Manage departmental authority settings, officer profile, and CVC audit configuration.',
};

export default async function AuthoritySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || 'R. K. Sharma';
  const email = user?.email || 'officer@cpcl.co.in';
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
            Procurement Authority Configuration
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
          Settings &amp; Department Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1">
          Manage procurement officer credentials, statutory audit preferences, and Central Public Procurement compliance settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Authority Department Profile */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#111111]" /> Procurement Entity &amp; Department
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5] font-medium">
              CENTRAL PSU ENTITY
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Organisation Name</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111] font-medium">
                Chennai Petroleum Corporation Limited (CPCL)
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Division / Operating Location</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111]">
                Manali Refinery, Chennai, Tamil Nadu 600068
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Tender Authority Reference</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] font-mono text-[#111111]">
                CPCL/ENG/CONTRACTS-DEPT
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Primary Category</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111]">
                Goods, Turnkey Works &amp; Engineering EPC
              </div>
            </div>
          </div>
        </div>

        {/* 2. Officer Identity & CVC Audit Credentials */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <User className="h-4 w-4 text-[#111111]" /> Designated Procurement Officer
            </h3>
            <span className="text-[10px] font-mono text-[#777777]">
              CVC Defensible Signature
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Officer Full Name</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111] font-medium">
                {fullName}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Official Email</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] font-mono text-[#111111]">
                {email}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Designation / Role</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111]">
                Superintending Engineer (Contracts &amp; Procurement)
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Statutory Clearance</label>
              <div className="px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111] flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" />
                <span>CVC Audit Authorised</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. AI & Verification Engine Status */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#111111]" /> AI Extraction &amp; Verification Backend
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
              hasGroqKey ? 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]' : 'bg-[#FAFAFA] text-[#777777] border-[#E5E5E5]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasGroqKey ? 'bg-[#111111]' : 'bg-[#777777]'}`} />
              {hasGroqKey ? 'Groq LLaMA 3.3 Active' : 'Deterministic Engine Only'}
            </span>
          </div>

          <div className="space-y-2 text-xs text-[#555555]">
            <p>
              Clausentis combines <strong>Groq LLaMA 3.3 70B</strong> semantic clause parsing with a <strong>deterministic mathematical engine</strong> for turnover, experience, and date checks.
            </p>
            <div className="p-3 bg-[#FAFAFA] rounded-md border border-[#E5E5E5] font-mono text-[11px] text-[#333333] space-y-1">
              <div>&bull; Mathematical Threshold Engine: DETERMINISTIC (Active)</div>
              <div>&bull; Cross-Document Reconciliation: DETERMINISTIC (Active)</div>
              <div>&bull; Statutory Registry Connectors: 16 SOURCES (Grounded)</div>
            </div>
          </div>
        </div>

        {/* 4. SIH26100 Architecture & Requirement Mapping */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#111111]" /> SIH26100 Requirement &amp; Provider Mapping
            </h3>
            <span className="text-[10px] font-mono text-[#777777]">
              Internal System Architecture
            </span>
          </div>
          <p className="text-xs text-[#555555] leading-relaxed">
            Technical mapping of the 16 government statutory sources, algorithmic rule definitions, and CVC digital defensibility specifications.
          </p>
          <div>
            <Link
              href="/authority/sih-coverage"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111111] bg-[#F7F7F7] border border-[#E5E5E5] hover:bg-[#EAEAEA] px-3 py-1.5 rounded-md transition-colors font-mono"
            >
              <span>View Statutory Provider Architecture (16 Sources) &rarr;</span>
            </Link>
          </div>
        </div>

        {/* 5. Session & Role Controls */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <Lock className="h-4 w-4 text-[#111111]" /> Session &amp; Portal Controls
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <form action={switchRoleFormAction}>
              <input type="hidden" name="role" value="bidder" />
              <Button 
                type="submit" 
                variant="outline" 
                className="h-9 px-4 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] gap-1.5 font-medium cursor-pointer rounded-md"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Switch to Bidder Portal</span>
              </Button>
            </form>

            <form action={logout}>
              <Button 
                type="submit" 
                variant="outline" 
                className="h-9 px-4 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] gap-1.5 font-medium cursor-pointer rounded-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Authority Session</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
