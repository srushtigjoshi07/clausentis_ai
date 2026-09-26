'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { classifyAuthError, type AuthErrorCode } from '@/lib/auth/errors';
import type { UserRole, UserProfile } from '@/types/auth-roles';

export async function getSiteUrl(): Promise<string> {
  // 1. Explicit production site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  // 2. Vercel deployment URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/+$/, '')}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}`;
  }
  // 3. Dynamic header detection
  try {
    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') || headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // fallback
  }
  return 'http://localhost:3000';
}

export interface AuthActionResult {
  success?: boolean;
  error?: string;
  errorCode?: AuthErrorCode;
  details?: string;
  requiresEmailVerification?: boolean;
  email?: string;
  message?: string;
}

export async function login(formData: FormData): Promise<AuthActionResult | void> {
  const email = (formData.get('email') as string)?.trim() || '';
  const password = (formData.get('password') as string) || '';

  if (!email) {
    return {
      error: 'Please enter your email address.',
      errorCode: 'INVALID_EMAIL',
    };
  }

  if (!password) {
    return {
      error: 'Please enter your password.',
      errorCode: 'WEAK_PASSWORD',
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === 'your_supabase_project_url' ||
    supabaseKey === 'your_supabase_anon_key'
  ) {
    return {
      error: 'Authentication configuration is unavailable.',
      errorCode: 'MISSING_CONFIGURATION',
      details: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    };
  }

  try {
    const supabase = await createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const lower = (error.message || '').toLowerCase();
      if (lower.includes('email not confirmed') || lower.includes('unconfirmed')) {
        return {
          error: 'Please verify your email address before signing in. Check your inbox for the confirmation link.',
          errorCode: 'SUPABASE_ERROR',
          details: error.message,
        };
      }

      if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
        return {
          error: 'Invalid email or password.',
          errorCode: 'INVALID_CREDENTIALS',
          details: error.message,
        };
      }

      const classified = classifyAuthError(error);
      return {
        error: classified.message,
        errorCode: classified.code,
        details: classified.technicalDetails,
      };
    }

    if (!authData?.user) {
      return {
        error: 'Sign-in failed. Please try again.',
        errorCode: 'UNKNOWN_AUTH_ERROR',
      };
    }

    const user = authData.user;

    // The persisted profile role is the only source of truth. The role picked on
    // the login form is ignored so a bidder cannot sign in "as" an authority.
    let role: UserRole = 'bidder';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role === 'tender_authority') role = 'tender_authority';
    } catch (err) {
      console.warn('Profile read warning on login:', err);
    }

    revalidatePath('/', 'layout');

    if (role === 'tender_authority') {
      redirect('/authority/dashboard');
    } else {
      redirect('/bidder/dashboard');
    }
  } catch (err: unknown) {
    unstable_rethrow(err);

    const classified = classifyAuthError(err);
    return {
      error: classified.message,
      errorCode: classified.code,
      details: classified.technicalDetails,
    };
  }
}

export async function signup(formData: FormData): Promise<AuthActionResult | void> {
  const email = (formData.get('email') as string)?.trim() || '';
  const password = (formData.get('password') as string) || '';
  const confirmPassword = (formData.get('confirm_password') as string) || '';
  const fullName = (formData.get('full_name') as string)?.trim() || 'Procurement Specialist';
  const role = (formData.get('role') as UserRole) || 'bidder';
  const organisationName = (formData.get('organisation_name') as string)?.trim() ||
    (role === 'tender_authority' ? 'Government Procurement Department' : 'Vendor Enterprise');

  // 1. Client & Server Validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      error: 'Please enter a valid official email address (e.g. officer@organisation.gov.in).',
      errorCode: 'INVALID_EMAIL',
    };
  }

  if (password.length < 6) {
    return {
      error: 'Password must be at least 6 characters.',
      errorCode: 'WEAK_PASSWORD',
    };
  }

  if (confirmPassword && password !== confirmPassword) {
    return {
      error: 'Passwords do not match. Please ensure both entered passwords are identical.',
      errorCode: 'PASSWORD_MISMATCH',
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === 'your_supabase_project_url' ||
    supabaseKey === 'your_supabase_anon_key'
  ) {
    return {
      error: 'Authentication configuration is unavailable.',
      errorCode: 'MISSING_CONFIGURATION',
      details: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    };
  }

  try {
    const supabase = await createClient();

    // Determine site URL for verification callback dynamically
    const siteUrl = await getSiteUrl();
    const emailRedirectTo = `${siteUrl}/auth/callback`;

    // 2. Call Supabase Auth signUp
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          organisation_name: organisationName,
          company_name: organisationName,
        },
        emailRedirectTo,
      },
    });

    // 3. Handle Supabase Auth Errors
    if (error) {
      const classified = classifyAuthError(error);
      return {
        error: classified.message,
        errorCode: classified.code,
        details: classified.technicalDetails,
      };
    }

    // 4. Handle Case: Existing User Detection (Supabase returns empty identities array when user already exists)
    if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      return {
        error: 'An account with this email address already exists. Please sign in instead or reset your password.',
        errorCode: 'EMAIL_ALREADY_REGISTERED',
      };
    }

    // 5. Handle Case: Email Confirmation Required (session is null)
    if (authData?.user && !authData.session) {
      return {
        success: true,
        requiresEmailVerification: true,
        email: authData.user.email || email,
        message: 'Account created. Please check your email to verify your account.',
      };
    }

    // 6. Handle Case: Autoconfirm enabled or session is active immediately
    if (authData?.user && authData.session) {
      try {
        // Safely update profile with role and organization info
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            role,
            company_name: organisationName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authData.user.id);
      } catch (dbErr) {
        console.warn('Profile update fallback on signup:', dbErr);
      }

      revalidatePath('/', 'layout');

      if (role === 'tender_authority') {
        redirect('/authority/dashboard');
      } else {
        redirect('/bidder/dashboard');
      }
    }

    return {
      success: true,
      message: 'Registration completed successfully.',
    };
  } catch (err: unknown) {
    unstable_rethrow(err);

    const classified = classifyAuthError(err);
    return {
      error: classified.message,
      errorCode: classified.code,
      details: classified.technicalDetails,
    };
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, role, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      const resolvedRole: UserRole = data.role === 'tender_authority' ? 'tender_authority' : 'bidder';
      return {
        id: data.id,
        email: user.email || '',
        fullName: data.full_name || user.user_metadata?.full_name || 'Procurement Specialist',
        role: resolvedRole,
        organisationName: data.company_name || user.user_metadata?.organisation_name ||
          (resolvedRole === 'tender_authority' ? 'Chennai Petroleum Corporation Limited' : 'Apex Heavy Engineering Pvt Ltd'),
        createdAt: data.created_at || user.created_at,
        updatedAt: data.updated_at || user.updated_at || data.created_at,
      };
    }
  } catch (err) {
    console.warn('Failed to load profile from DB, using fallback:', err);
  }

  // Without a readable profile row we cannot confirm an elevated role.
  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name || 'Procurement User',
    role: 'bidder',
    organisationName: user.user_metadata?.organisation_name || 'Apex Heavy Engineering Pvt Ltd',
    createdAt: user.created_at,
    updatedAt: user.created_at,
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete('clausentis_role');
  cookieStore.delete('clausentis_user_id');
  revalidatePath('/', 'layout');
  redirect('/login');
}
