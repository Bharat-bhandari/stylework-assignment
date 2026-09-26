import type { ReactNode } from 'react';
import type { Lead } from '../types/api';
import { MailIcon, PhoneIcon, UserIcon } from './icons';
import { Panel } from './Panel';

type LeadContactCardProps = {
  lead: Lead;
};

const Row = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <div className="flex items-center gap-2.5 text-sm">
    <span className="shrink-0 text-ink-soft">{icon}</span>
    <span className="min-w-0 truncate">{children}</span>
  </div>
);

const Missing = ({ label }: { label: string }) => <span className="text-ink-soft">{label}</span>;

export const LeadContactCard = ({ lead }: LeadContactCardProps) => (
  <Panel title="Contact">
    <div className="flex flex-col gap-2.5">
      <Row icon={<UserIcon />}>
        {lead.fullName ?? <Missing label="No name submitted" />}
      </Row>
      <Row icon={<MailIcon />}>
        {lead.email === null ? (
          <Missing label="No email submitted" />
        ) : (
          <a href={`mailto:${lead.email}`} className="underline-offset-2 hover:underline">
            {lead.email}
          </a>
        )}
      </Row>
      <Row icon={<PhoneIcon />}>
        {lead.phone === null ? (
          <Missing label="No phone submitted" />
        ) : (
          <a
            href={`tel:${lead.phone}`}
            className="underline-offset-2 tabular-nums hover:underline"
          >
            {lead.phone}
          </a>
        )}
      </Row>
    </div>
  </Panel>
);
