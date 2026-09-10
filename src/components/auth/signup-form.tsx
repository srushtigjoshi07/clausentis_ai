'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Briefcase } from 'lucide-react';
import { GoogleAuthButton } from './google-auth-button';
import type { UserRole } from '@/types/auth-roles';

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('bidder');

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    formData.set('role', selectedRole);
    
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  const inputClass = "flex h-10 w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

  return (
    <div className="grid gap-6">
      {/* Role Selection Tabs */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-mono tracking-widest text-[#777777]">
          Register As:
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedRole('tender_authority')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedRole === 'tender_authority'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tender Authority</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('bidder')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedRole === 'bidder'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Bidder / Vendor</span>
          </button>
        </div>
      </div>

      <form action={onSubmit}>
        <input type="hidden" name="role" value={selectedRole} />

        <div className="grid gap-4">
          
          {/* Full Name */}
          <div className="grid gap-2">
            <label htmlFor="full_name" className="text-sm font-medium text-[#111111]">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Dr. Rajesh Kumar"
              required
              className={inputClass}
            />
          </div>

          {/* Organisation / Company Name */}
          <div className="grid gap-2">
            <label htmlFor="organisation_name" className="text-sm font-medium text-[#111111]">
              {selectedRole === 'tender_authority' ? 'Authority / PSU Name' : 'Company / Enterprise Name'}
            </label>
            <input
              id="organisation_name"
              name="organisation_name"
              type="text"
              placeholder={selectedRole === 'tender_authority' ? 'Chennai Petroleum Corporation Limited' : 'Apex Heavy Engineering Pvt Ltd'}
              required
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#111111]">
              Official Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="officer@cpcl.gov.in"
              required
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-medium text-[#111111]">
              Password
            </label>
            <input 
              id="password" 
              name="password"
              type="password" 
              placeholder="••••••••"
              required 
              className={inputClass}
            />
          </div>

          {/* Confirm Password */}
          <div className="grid gap-2">
            <label htmlFor="confirm_password" className="text-sm font-medium text-[#111111]">
              Confirm Password
            </label>
            <input 
              id="confirm_password" 
              name="confirm_password"
              type="password" 
              placeholder="••••••••"
              required 
              className={inputClass}
            />
          </div>

          {error && <div className="text-sm text-[#111111] font-medium border border-[#E5E5E5] bg-[#F7F7F7] p-2 rounded-md">{error}</div>}

          {/* Create Account Button */}
          <Button 
            type="submit" 
            className="w-full h-10 bg-[#111111] hover:bg-[#222222] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating account...' : `Register as ${selectedRole === 'tender_authority' ? 'Tender Authority' : 'Bidder / Vendor'}`}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E5E5E5]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-[#777777] font-medium tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleAuthButton />

      {/* Sign In Link */}
      <div className="text-center text-sm text-[#555555]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#111111] font-semibold hover:underline underline-offset-4 transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
