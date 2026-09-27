import { getSavedBidderProfileAction, searchActiveTendersAction } from '@/lib/actions/tender-discovery';
import { listMySubmissions } from '@/lib/views/bidder';
import { AssistantChat } from '@/components/v2/AssistantChat';

export const metadata = { title: 'Assistant · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

export default async function BidderAssistantPage() {
  const [profile, subs, search] = await Promise.all([getSavedBidderProfileAction(), listMySubmissions(), searchActiveTendersAction({})]);
  const latest = subs[0]?.record;
  const nextTender = search.tenders[0];

  const suggestions = [
    nextTender ? `Am I eligible for ${nextTender.referenceNumber}?` : 'How do I check my eligibility for a tender?',
    'Which documents do I need for a typical PSU tender?',
    'Explain the EMD exemption for Udyam-registered MSEs',
  ];
  const context = [
    profile
      ? `Bidder ${profile.companyName} (GSTIN ${profile.gstin || 'not given'}). Declared turnover ${profile.annualTurnoverInCr ?? 'not declared'} Cr, experience ${profile.relevantExperienceYears ?? 'not declared'} years.`
      : 'Bidder has not saved a company profile.',
    latest ? `Latest submitted bid ${latest.submissionId} on ${latest.tenderReference}, readiness ${latest.complianceScore}/100.` : 'No bids submitted yet.',
    `Open tenders: ${search.tenders.map((t) => `${t.referenceNumber} (min turnover ₹${t.minimumTurnoverRequired} Cr, ${t.minimumExperienceYears} yrs, closes ${t.closingDate})`).join('; ')}`,
  ].join(' ');

  return (
    <AssistantChat
      eyebrow={latest ? `Assistant · your ${latest.tenderReference.split('/')[0]} bid` : 'Assistant'}
      title="Ask what's blocking your bid"
      placeholder="Ask about a clause, document or deadline"
      suggestions={suggestions}
      scopeNote="The assistant sees your profile, your bids and the open tenders. It can't see other bidders or officer notes."
      context={{ tenderTitle: latest?.tenderTitle ?? nextTender?.title, pageContext: `Bidder assistant. ${context}` }}
    />
  );
}
