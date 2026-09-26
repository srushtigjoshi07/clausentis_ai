This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open (https://clausentis-ai.vercel.app/) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase project |
| `GROQ_API_KEY` | For AI features | Tender requirement extraction and assistant |
| `EVIDENCE_SIGNING_SECRET` | Yes in production | HMAC key that seals facts extracted from uploaded bid documents so a bidder cannot edit them in the browser before submission. Without it, sealing is skipped (dev only). |

### Roles

A user's role comes only from `profiles.role` in the database. Users cannot change it themselves (migration `00012_security_hardening.sql`). The login page's demo buttons use two accounts: `tester@tenderai.com` (Tender Authority) and `bidder@tenderai.com` (Bidder). Set a role from the Supabase SQL editor:

```sql
update public.profiles set role = 'tender_authority'
where id = (select id from auth.users where email = 'tester@tenderai.com');
```

### Verification sources

All government connectors (Udyam, GST, MCA, PAN, EPFO/ESIC, NSIC, BIS, debarment, DigiLocker) read the synthetic records in `src/data/government`. No live government API is wired up yet. In "Production API" mode, connectors report *not configured* rather than presenting sandbox data as live.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
