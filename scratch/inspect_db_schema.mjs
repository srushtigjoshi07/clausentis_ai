const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grmmvfuxttofpjaqhweq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_P98ZK4mehVdQnZB2iZBZLQ_KPiSViGx';

async function inspectSchema() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const spec = await res.json();
  const tables = ['tenders', 'tender_requirements', 'compliance_results', 'bidder_documents', 'audit_events', 'profiles'];
  for (const t of tables) {
    console.log(`=== TABLE: ${t} ===`);
    const def = spec.definitions?.[t];
    if (def) {
      console.log('Properties:', Object.keys(def.properties || {}));
      if (def.properties?.status) {
        console.log('status property:', def.properties.status);
      }
    } else {
      console.log('Not found in OpenAPI definitions');
    }
  }
}

inspectSchema();
