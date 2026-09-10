'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { UserRole, UserProfile } from '@/types/auth-roles';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const selectedRole = (formData.get('role') as UserRole) || 'bidder';

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const user = authData.user;
  let role: UserRole = selectedRole;

  if (user) {
    // Attempt reading from profiles table
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organisation_name')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        // If profile already has a role and user didn't explicitly select an alternate demo role, keep profile role
        role = profile.role as UserRole;
      } else {
        // Otherwise update profile with selected role
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email!,
          role: selectedRole,
          organisation_name: selectedRole === 'tender_authority' 
            ? 'Chennai Petroleum Corporation Limited' 
            : 'Apex Heavy Engineering Pvt Ltd',
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Non-fatal, use selectedRole
      role = selectedRole;
    }

    // Set cookie for ultra-fast middleware route guarding
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

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const role = (formData.get('role') as UserRole) || 'bidder';
  const organisationName = (formData.get('organisation_name') as string) || 
    (role === 'tender_authority' ? 'Government Procurement Department' : 'Vendor Enterprise');

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        organisation_name: organisationName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (authData.user) {
    try {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        organisation_name: organisationName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Profile creation fallback:', dbErr);
    }

    const cookieStore = await cookies();
    cookieStore.set('clausentis_role', role, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  }

  revalidatePath('/', 'layout');

  if (role === 'tender_authority') {
    redirect('/authority/dashboard');
  } else {
    redirect('/bidder/dashboard');
  }
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
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name || user.user_metadata?.full_name || 'Procurement Specialist',
        role: (data.role as UserRole) || cachedRole,
        organisationName: data.organisation_name || 
          (data.role === 'tender_authority' ? 'Chennai Petroleum Corporation Limited' : 'Apex Heavy Engineering Pvt Ltd'),
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (err) {
    console.warn('Failed to load profile from DB, using fallback:', err);
  }

  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name || 'Procurement User',
    role: cachedRole,
    organisationName: cachedRole === 'tender_authority' ? 'Chennai Petroleum Corporation Limited' : 'Apex Heavy Engineering Pvt Ltd',
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
