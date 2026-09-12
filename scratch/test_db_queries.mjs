import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grmmvfuxttofpjaqhweq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_P98ZK4mehVdQnZB2iZBZLQ_KPiSViGx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'tester@tenderai.com',
    password: 'password123'
  });

  console.log('Auth login:', authError ? authError.message : `Logged in as ${authData.user.id}`);

  const tables = ['profiles', 'tenders', 'tender_requirements', 'compliance_results', 'bidder_documents', 'audit_events'];
  for (const t of tables) {
    const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${t.padEnd(20)} -> Error: ${error.message} (${error.code})`);
    } else {
      console.log(`Table ${t.padEnd(20)} -> OK, count: ${count}`);
    }
  }
}

testTables();
