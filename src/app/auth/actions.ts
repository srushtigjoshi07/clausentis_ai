'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { classifyAuthError, type AuthErrorCode } from '@/lib/auth/errors';
import type { UserRole, UserProfile } from '@/types/auth-roles';

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
  const supabase = await createClient();
  const email = (formData.get('email') as string)?.trim() || '';
  const password = (formData.get('password') as string) || '';
  const selectedRole = (formData.get('role') as UserRole) || 'bidder';

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

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes('email not confirmed') || lower.includes('unconfirmed')) {
      return {
        error: 'Please verify your email address before signing in. Check your inbox for the confirmation link.',
        errorCode: 'SUPABASE_ERROR',
        details: error.message,
      };
    }

    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return {
        error: 'Invalid email or password. Please verify your credentials and try again.',
        errorCode: 'SUPABASE_ERROR',
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

  const user = authData.user;
  let role: UserRole = selectedRole;

  if (user) {
    // Attempt reading authoritative persisted role from profiles table
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_name, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        // Enforce the securely persisted database role
        role = profile.role as UserRole;
      } else {
        // If profile row doesn't have a role, update it with selectedRole
        await supabase
          .from('profiles')
          .update({
            role: selectedRole,
            company_name: selectedRole === 'tender_authority'
              ? 'Chennai Petroleum Corporation Limited'
              : 'Apex Heavy Engineering Pvt Ltd',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
    } catch (err) {
      console.warn('Profile read warning on login:', err);
      // Fallback to user_metadata role if present
      if (user.user_metadata?.role) {
        role = user.user_metadata.role as UserRole;
      }
    }

    // Set secure cookies for middleware route guarding
    const cookieStore = await cookies();
    cookieStore.set('clausentis_role', role, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    cookieStore.set('clausentis_user_id', user.id, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  }

  revalidatePath('/', 'layout');

  if (role === 'tender_authority') {
    redirect('/authority/dashboard');
  } else {
    redirect('/bidder/dashboard');
  }
}

export async function signup(formData: FormData): Promise<AuthActionResult | void> {
  const supabase = await createClient();
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

  // Determine site URL for verification callback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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
      message: 'Check your email to verify your account. Once verified, you can sign in.',
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

    const cookieStore = await cookies();
    cookieStore.set('clausentis_role', role, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    cookieStore.set('clausentis_user_id', authData.user.id, { path: '/', maxAge: 60 * 60 * 24 * 30 });

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
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const cookieStore = await cookies();
  const cachedRole = (cookieStore.get('clausentis_role')?.value as UserRole) || 'bidder';

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, role, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      const resolvedRole = (data.role as UserRole) || (user.user_metadata?.role as UserRole) || cachedRole;
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

  const fallbackRole = (user.user_metadata?.role as UserRole) || cachedRole;
  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name || 'Procurement User',
    role: fallbackRole,
    organisationName: user.user_metadata?.organisation_name ||
      (fallbackRole === 'tender_authority' ? 'Chennai Petroleum Corporation Limited' : 'Apex Heavy Engineering Pvt Ltd'),
    createdAt: user.created_at,
    updatedAt: user.created_at,
  };
}

export async function switchRoleFormAction(formData: FormData) {
  const role = (formData.get('role') as UserRole) || 'bidder';
  await switchRole(role);
}

export async function switchRole(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set('clausentis_role', role, { path: '/', maxAge: 60 * 60 * 24 * 30 });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ role }).eq('id', user.id);
      await supabase.auth.updateUser({ data: { role } });
    }
  } catch (err) {
    console.warn('Failed to persist switched role in DB:', err);
  }

  revalidatePath('/', 'layout');

  if (role === 'tender_authority') {
    redirect('/authority/dashboard');
  } else {
    redirect('/bidder/dashboard');
  }
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
