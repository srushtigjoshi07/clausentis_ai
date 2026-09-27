import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { getDossier } from '@/lib/views/officer';
import { AssistantChat } from '@/components/v2/AssistantChat';
import { toOutcome } from '@/components/v2/status';

export const metadata = { title: 'Assistant · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

export default async function OfficerAssistantPage({ searchParams }: { searchParams: Promise<{ bidId?: string }> }) {
  const { bidId } = await searchParams;
  const focus = bidId ? getDossier(bidId) : null;
  const dossiers = getAllBidderDossiers(focus?.tenderId);
  const tenderId = focus?.tenderId ?? dossiers[0]?.tenderId;
  const onTender = dossiers.filter((d) => d.tenderId === tenderId);
  const ref = onTender[0]?.tenderReference;

  // Grounding summary passed to the assistant as page context (server-derived, plain text).
  const lines = onTender.map((d) => {
    const issues = d.requirementResults
      .filter((r) => toOutcome(r.status) && toOutcome(r.status) !== 'pass')
      .map((r) => `${r.clauseCode} ${r.title}: ${r.status} (${r.verifiedValue})`)
      .join('; ');
    return `${d.bidderName} [${d.submissionId}] score ${d.complianceScore}/100, risk ${d.riskLevel}, AI ${d.aiRecommendation.recommendation}${issues ? `. Issues: ${issues}` : ''}`;
  });

  const riskiest = [...onTender].sort((a, b) => a.complianceScore - b.complianceScore)[0];
  const suggestions = [
    'Which clauses do most bids fail?',
    focus ? `Summarise the evidence gaps in ${focus.bidderName}'s bid` : riskiest ? `Summarise ${riskiest.bidderName}'s contradictions for the committee` : 'What should I check before signing a decision?',
    riskiest ? `Draft a clarification request to ${riskiest.bidderName}` : 'Draft a clarification request template',
  ];

  return (
    <AssistantChat
      eyebrow={ref ? `Assistant · grounded in ${ref}` : 'Assistant'}
      title={focus ? `Ask about ${focus.bidderName}'s bid` : 'Ask about bids, clauses or evidence'}
      placeholder="Ask about a bid, clause or document"
      suggestions={suggestions}
      scopeNote={
        onTender.length
          ? `This tender's clauses, the ${onTender.length} bid${onTender.length === 1 ? '' : 's'}, their extracted evidence and portal results. It cites records and never invents documents.`
          : 'No bids have been submitted yet, so answers are general guidance only.'
      }
      context={{
        tenderId,
        tenderTitle: onTender[0]?.tenderTitle,
        bidId: focus?.bidId,
        pageContext: lines.length ? `Officer assistant. Bids on ${ref}: ${lines.join(' | ')}` : 'Officer assistant. No bids submitted yet.',
      }}
    />
  );
}
