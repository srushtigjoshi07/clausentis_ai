import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grmmvfuxttofpjaqhweq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_P98ZK4mehVdQnZB2iZBZLQ_KPiSViGx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  await supabase.auth.signInWithPassword({
    email: 'tester@tenderai.com',
    password: 'password123'
  });

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.log('List buckets error:', error);
  } else {
    console.log('Buckets:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));
  }

  // Check bidder-documents bucket
  const { data: bidderFiles, error: bidderErr } = await supabase.storage.from('bidder-documents').list();
  console.log('bidder-documents list:', bidderErr ? bidderErr.message : bidderFiles?.length);

  // Check tenders bucket
  const { data: tenderFiles, error: tenderErr } = await supabase.storage.from('tenders').list();
  console.log('tenders list:', tenderErr ? tenderErr.message : tenderFiles?.length);
}

testStorage();
