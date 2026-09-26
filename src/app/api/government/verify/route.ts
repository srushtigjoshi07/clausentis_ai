import { NextRequest, NextResponse } from 'next/server';
import { runGovernmentVerification } from '@/lib/verification/engine';
import { createClient } from '@/lib/supabase/server';
import type { BidderExtractedIdentity, GovVerificationEnvironment } from '@/lib/verification/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      bidderId = 'demo-bidder',
      bidderName = 'Demo Bidder',
      identity,
      environment = 'DEMO',
    } = body as {
      bidderId?: string;
      bidderName?: string;
      identity: BidderExtractedIdentity;
      environment?: GovVerificationEnvironment;
    };

    if (!identity) {
      return NextResponse.json(
        { error: 'Missing required field: identity' },
        { status: 400 }
      );
    }

    const report = runGovernmentVerification(bidderId, bidderName, identity, environment);

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
