import type { NextConfig } from 'next';

/**
 * Routes retired by the v2 redesign (docs/redesign-v2/README.md). Redirects run
 * before the proxy, so shared routes go to /dashboard, which the proxy (and the
 * /dashboard page) then sends to the user's own portal based on profiles.role.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Shared (pre-portal) routes → role portal
      { source: '/tenders/discover', destination: '/bidder/tenders', permanent: false },
      { source: '/tenders/:path*', destination: '/dashboard', permanent: false },
      { source: '/documents/:path*', destination: '/dashboard', permanent: false },
      { source: '/reports/:path*', destination: '/dashboard', permanent: false },
      { source: '/settings/:path*', destination: '/dashboard', permanent: false },
      { source: '/dashboard/:path+', destination: '/dashboard', permanent: false },

      // Officer portal
      { source: '/authority/compliance', destination: '/authority/tenders', permanent: false },
      { source: '/authority/matched-requirements', destination: '/authority/tenders', permanent: false },
      { source: '/authority/documents', destination: '/authority/bids', permanent: false },
      { source: '/authority/tenders/:id/compare-bids', destination: '/authority/tenders/:id', permanent: false },
      { source: '/authority/sih-coverage', destination: '/authority/integrations', permanent: false },

      // Bidder portal
      { source: '/bidder/compliance', destination: '/bidder/bids', permanent: false },
      { source: '/bidder/government-verification', destination: '/bidder/settings', permanent: false },
      { source: '/bidder/eligibility', destination: '/bidder/tenders', permanent: false },
      { source: '/bidder/reports', destination: '/bidder/bids', permanent: false },
      { source: '/bidder/tenders/:id/compare', destination: '/bidder/tenders/:id/prepare', permanent: false },
      { source: '/bidder/tenders/:id/eligibility', destination: '/bidder/tenders/:id', permanent: false },
    ];
  },
};

export default nextConfig;
