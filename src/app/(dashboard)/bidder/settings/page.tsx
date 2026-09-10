import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import { LanguageSelector } from '@/components/layout/language-selector';
import { User, Mail, Globe, Lock, LogOut, Cpu, CheckCircle2, AlertCircle, Building2, Briefcase } from 'lucide-react';

export const metadata = {
  title: 'Settings - Clausentis Bidder Portal',
  description: 'Manage bidder workspace configuration, company identity, and security.',
};

export default async function BidderSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || 'Apex Procurement Officer';
  const email = user?.email || 'bidder@apexheavy.in';
  const userId = user?.id || '---';
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
            BIDDER WORKSPACE CONFIGURATION
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">System Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
          Settings &amp; Company Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1">
          Manage your verified enterprise credentials, regional language preferences, AI engine credentials, and security.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Registered Bidder Enterprise Profile */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#111111]" /> Registered Bidder Enterprise
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] font-medium">
              VERIFIED VENDOR
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Enterprise Legal Name</label>
              <div className="px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-medium">
                Apex Heavy Engineering Pvt Ltd
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">GSTIN Number</label>
              <div className="px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-mono">
                33AABCA1234F1Z8
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">PAN</label>
              <div className="px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-mono">
                AABCA1234F
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">MSME / Udyam Number</label>
              <div className="px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-mono">
                UDYAM-TN-02-0041289 (Exempted)
              </div>
            </div>
          </div>
        </div>

        {/* 2. Authenticated User Profile */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <User className="h-4 w-4 text-[#111111]" /> Active User Session
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] font-medium">
              ACTIVE
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Contact Person</label>
              <div className="px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111]">
                {fullName}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-wider flex items-center gap-1">
                <Mail className="h-3 w-3 text-[#555555]" /> Email Address
              </label>
              <div className="px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] truncate font-mono">
                {email}
              </div>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-[#777777]">
            <span className="font-medium text-[#555555]">User ID:</span> {userId}
          </div>
        </div>

        {/* 3. AI Intelligence Engine Card */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#111111]" /> Groq AI Compliance Intelligence
            </h3>
            {hasGroqKey ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] font-medium">
                <CheckCircle2 className="h-3 w-3" /> ENGINE CONFIGURED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F7F7F7] text-[#555555] border border-[#E5E5E5] font-medium">
                <AlertCircle className="h-3 w-3" /> KEY REQUIRED
              </span>
            )}
          </div>

          <p className="text-xs text-[#555555] leading-relaxed">
            Inference engine: <span className="text-[#111111] font-mono font-medium">llama-3.3-70b-versatile</span> via Groq API.
          </p>
        </div>

        {/* 4. Language & Regional Settings */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-3 shadow-2xs">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#111111]" /> Interface Localization
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Select your primary regional language for tender summaries, alerts, and report translation.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#111111] font-medium">Language</span>
            <LanguageSelector />
          </div>
        </div>

        {/* 5. Security & Sign Out Card */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4 shadow-2xs">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111] flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#111111]" /> Security &amp; Session
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Protected by Supabase Row-Level Security (RLS) and end-to-end token encryption.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="text-xs text-[#555555]">
              End your active bidder session securely.
            </div>
            <form action={logout}>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] text-xs font-medium h-8 px-3.5 gap-2 cursor-pointer"
                type="submit"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out of Workspace
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
