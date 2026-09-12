const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grmmvfuxttofpjaqhweq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_P98ZK4mehVdQnZB2iZBZLQ_KPiSViGx';

async function checkPaths() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const spec = await res.json();
  console.log('Definitions keys:', Object.keys(spec.definitions || {}));
  console.log('Paths keys:', Object.keys(spec.paths || {}));
}

checkPaths();
