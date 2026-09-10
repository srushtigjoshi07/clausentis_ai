import { getTenderReport } from '@/lib/actions/reports';
import { notFound } from 'next/navigation';
import { ReportView } from '@/components/reports/report-view';

export default async function TenderReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reportData = await getTenderReport(id);

  if (!reportData || !reportData.tender) {
    notFound();
  }

  return (
    <ReportView reportData={reportData} />
  );
}
