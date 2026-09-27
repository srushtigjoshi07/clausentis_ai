import { getUserProfile, logout } from '@/app/auth/actions';
import { PageBody, PageHeader } from '@/components/v2/ui';

export const metadata = { title: 'Settings · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

export default async function OfficerSettingsPage() {
  const profile = await getUserProfile();
  const fields: Array<[string, string, string]> = [
    ['s-name', 'Full name', profile?.fullName ?? ''],
    ['s-email', 'Official email', profile?.email ?? ''],
    ['s-org', 'Organisation', profile?.organisationName ?? ''],
    ['s-since', 'Account created', profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''],
  ];

  return (
    <PageBody className="max-w-[900px]">
      <PageHeader eyebrow="Settings" title="Your account" />

      <section aria-label="Profile" className="card flex flex-col gap-3.5 p-5">
        <h2 className="h2">Profile</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {fields.map(([id, label, value]) => (
            <div key={id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="label">{label}</label>
              <input id={id} className="input" value={value} readOnly />
            </div>
          ))}
        </div>
        <span className="text-xs text-fg-3">Profile details come from your organisation&apos;s account record. Ask your administrator to change them.</span>
      </section>

      <section aria-label="Role" className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="h2">Role</h2>
          <span className="text-[13px] text-fg-2">Tender Authority. Roles are assigned by your administrator and can&apos;t be changed here.</span>
        </div>
        <span className="pill pill-ink">Tender Authority</span>
      </section>

      <section aria-label="Session" className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="h2">Sign out</h2>
          <span className="text-[13px] text-fg-2">Ends this session on this device.</span>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-secondary">Sign out</button>
        </form>
      </section>
    </PageBody>
  );
}
