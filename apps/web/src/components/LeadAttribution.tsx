import type { Lead } from '../types/api';
import { Panel } from './Panel';

type LeadAttributionProps = {
  lead: Lead;
};

export const LeadAttribution = ({ lead }: LeadAttributionProps) => {
  const rows: { label: string; value: string | null }[] = [
    { label: 'Page', value: lead.pageId },
    { label: 'Form', value: lead.formId },
    { label: 'Ad', value: lead.adId },
    { label: 'Campaign', value: lead.campaignId },
    { label: 'Platform', value: lead.platform },
    { label: 'Meta lead', value: lead.metaLeadId },
  ];

  return (
    <Panel title="Attribution">
      <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-2">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-xs text-ink-muted">{row.label}</dt>
            <dd className="font-mono text-xs break-all">
              {row.value ?? <span className="font-sans text-ink-soft">not provided</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
};
