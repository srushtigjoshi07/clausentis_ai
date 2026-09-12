// scratch/audit_routes.mjs
async function test() {
  const routes = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/terms',
    '/privacy',
    '/dashboard',
    '/authority/dashboard',
    '/authority/tenders',
    '/authority/bids',
    '/authority/compliance',
    '/authority/documents',
    '/authority/reports',
    '/authority/audit',
    '/authority/assistant',
    '/authority/settings',
    '/bidder/dashboard',
    '/bidder/tenders',
    '/bidder/bids',
    '/bidder/documents',
    '/bidder/compliance',
    '/bidder/reports',
    '/bidder/assistant',
    '/bidder/settings',
    '/tenders',
    '/documents',
    '/reports',
    '/settings',
  ];

  console.log('Testing unauthenticated requests:');
  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r}`, {
        redirect: 'manual'
      });
      const location = res.headers.get('location') || '';
      console.log(`${r.padEnd(28)} -> status ${res.status} ${location ? `(Location: ${location})` : ''}`);
    } catch (e) {
      console.log(`${r.padEnd(28)} -> ERROR: ${e.message}`);
    }
  }
}

test();
