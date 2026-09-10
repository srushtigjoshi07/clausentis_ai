import { FileText, Percent, AlertTriangle, Files } from 'lucide-react';

interface KpiStats {
  tendersAnalyzed?: number | string | null;
  averageCompliance?: number | string | null;
  criticalIssues?: number | string | null;
  documentsVerified?: number | string | null;
}

interface KpiScrollSectionProps {
  stats: KpiStats | null;
}

export function KpiScrollSection({ stats }: KpiScrollSectionProps) {
  const tendersVal = stats?.tendersAnalyzed !== undefined && stats?.tendersAnalyzed !== null
    ? stats.tendersAnalyzed.toString()
    : '0';

  const complianceVal = stats?.averageCompliance !== null && stats?.averageCompliance !== undefined
    ? `${stats.averageCompliance}%`
    : '—';

  const issuesVal = stats?.criticalIssues !== undefined && stats?.criticalIssues !== null
    ? stats.criticalIssues.toString()
    : '0';

  const docsVal = stats?.documentsVerified !== undefined && stats?.documentsVerified !== null
    ? stats.documentsVerified.toString()
    : '0';

  const items = [
    {
      title: 'Tenders Analyzed',
      value: tendersVal,
      desc: 'Total tenders in workspace',
      icon: FileText,
    },
    {
      title: 'Average Compliance',
      value: complianceVal,
      desc: 'Across evaluated criteria',
      icon: Percent,
    },
    {
      title: 'Critical Issues',
      value: issuesVal,
      desc: 'High risk eligibility alerts',
      icon: AlertTriangle,
    },
    {
      title: 'Documents Verified',
      value: docsVal,
      desc: 'Company credentials in vault',
      icon: Files,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {item.title}
                  </h3>
                  <div className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 stroke-[1.5]" />
                  </div>
                </div>

                <div className="text-4xl sm:text-5xl font-medium tracking-[-0.04em] text-foreground my-1 font-mono">
                  {item.value}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-xs font-light text-muted-foreground leading-[1.5]">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
