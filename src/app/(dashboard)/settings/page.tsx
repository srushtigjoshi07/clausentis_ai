import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import { LanguageSelector } from '@/components/layout/language-selector';
import { User, Mail, Globe, Lock, LogOut, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || 'Command Officer';
  const email = user?.email || 'officer@clausentis.com';
  const userId = user?.id || '---';
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">
            SYSTEM CONFIGURATION
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#111111]">
          Account &amp; Preferences
        </h1>
        <p className="text-sm text-[#555555] mt-1.5">
          Manage your authenticated identity, regional language preferences, AI engine credentials, and security.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        {/* 1. Profile Details Card */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-sm sm:text-base font-semibold text-[#111111] uppercase tracking-wide flex items-center gap-2">
              <User className="h-4 w-4 text-[#555555] stroke-[1.5]" /> Authenticated Profile
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] font-medium">
              ACTIVE SESSION
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-widest">Full Name</label>
              <div className="px-3.5 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-sm">
                {fullName}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#777777] uppercase tracking-widest flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[#555555] stroke-[1.5]" /> Email Address
              </label>
              <div className="px-3.5 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-sm truncate">
                {email}
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-[#777777]">
            <span className="font-medium text-[#555555]">User ID:</span> {userId}
          </div>
        </div>

        {/* 2. AI Intelligence Engine Card */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h3 className="text-sm sm:text-base font-semibold text-[#111111] uppercase tracking-wide flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#555555] stroke-[1.5]" /> Groq AI Compliance Intelligence
            </h3>
            {hasGroqKey ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] font-medium">
                <CheckCircle2 className="h-3 w-3" /> ENGINE CONFIGURED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#F7F7F7] text-[#555555] border border-[#E5E5E5] font-medium">
                <AlertCircle className="h-3 w-3" /> KEY REQUIRED
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            Clausentis utilizes the Groq <span className="text-[#111111] font-mono">llama-3.3-70b-versatile</span> inference
            engine to parse large RFPs, extract eligibility clauses, and verify evidence with ultra-low latency.
          </p>

          <div className="bg-[#F7F7F7] p-4 rounded-xl border border-[#E5E5E5] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#555555] font-medium">Environment Variable:</span>
              <span className="font-mono text-[#111111]">GROQ_API_KEY</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#555555] font-medium">Model Architecture:</span>
              <span className="font-mono text-[#111111]">llama-3.3-70b-versatile</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#555555] font-medium">Status:</span>
              <span className={hasGroqKey ? 'text-[#111111] font-medium' : 'text-[#555555] font-medium'}>
                {hasGroqKey ? 'Live Inference Ready' : 'Set GROQ_API_KEY in .env.local to enable'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Language & Regional Settings */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 space-y-4">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h3 className="text-sm sm:text-base font-semibold text-[#111111] uppercase tracking-wide flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#555555] stroke-[1.5]" /> Regional Localization
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Select your primary regional language for tender summaries, alerts, and report translation.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#111111]">Interface Language</span>
            <LanguageSelector />
          </div>
        </div>

        {/* 4. Security & Sign Out Card */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 space-y-4">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h3 className="text-sm sm:text-base font-semibold text-[#111111] uppercase tracking-wide flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#555555] stroke-[1.5]" /> Security &amp; Session
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Protected by Supabase Row-Level Security (RLS) and end-to-end token encryption.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-[#555555]">
              End your active session securely across all devices.
            </div>
            <form action={logout}>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] hover:text-[#111111] text-xs sm:text-sm font-medium h-9 px-4 gap-2"
                type="submit"
              >
                <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
                Sign Out of Workspace
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
