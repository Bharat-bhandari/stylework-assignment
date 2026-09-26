import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { absoluteTime, relativeTime } from '../helper/time';
import type { Lead } from '../types/api';
import { ChevronRightIcon } from './icons';
import { StatusBadge } from './StatusBadge';
import { TestChip } from './TestChip';

type LeadTableProps = {
  leads: Lead[];
  freshIds: ReadonlySet<string>;
};

const HEAD_CELL = 'px-3 py-2 text-2xs font-semibold tracking-[0.08em] text-ink-muted uppercase';
const BODY_CELL = 'px-3 py-2.5 align-middle';

const leadName = (lead: Lead): string => lead.fullName ?? 'Unnamed lead';

const Blank = () => <span className="text-ink-soft">—</span>;

export const LeadTable = ({ leads, freshIds }: LeadTableProps) => {
  const navigate = useNavigate();

  const openLead = (event: MouseEvent<HTMLTableRowElement>, id: string) => {
    if (event.target instanceof HTMLElement && event.target.closest('a, button') !== null) return;

    void navigate(`/leads/${id}`);
  };

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left">
              <th className={`${HEAD_CELL} pl-4`} scope="col">
                Lead
              </th>
              <th className={HEAD_CELL} scope="col">
                Email
              </th>
              <th className={HEAD_CELL} scope="col">
                Phone
              </th>
              <th className={HEAD_CELL} scope="col">
                Status
              </th>
              <th className={HEAD_CELL} scope="col">
                Form / campaign
              </th>
              <th className={HEAD_CELL} scope="col">
                Received
              </th>
              <th className="w-9" scope="col">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={(event) => openLead(event, lead.id)}
                className={`group cursor-pointer border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-sunk ${
                  freshIds.has(lead.id) ? 'animate-flash-in' : ''
                }`}
              >
                <td className={`${BODY_CELL} pl-4`}>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {leadName(lead)}
                    </Link>
                    {lead.isTest ? <TestChip /> : null}
                  </div>
                </td>
                <td className={`${BODY_CELL} max-w-[16rem] truncate text-ink-muted`}>
                  {lead.email ?? <Blank />}
                </td>
                <td className={`${BODY_CELL} text-ink-muted tabular-nums`}>
                  {lead.phone ?? <Blank />}
                </td>
                <td className={BODY_CELL}>
                  <StatusBadge status={lead.status} />
                </td>
                <td className={BODY_CELL}>
                  <div className="max-w-[11rem] truncate font-mono text-2xs" title={lead.formId}>
                    {lead.formId}
                  </div>
                  <div
                    className="max-w-[11rem] truncate font-mono text-2xs text-ink-soft"
                    title={lead.campaignId ?? undefined}
                  >
                    {lead.campaignId ?? 'no campaign'}
                  </div>
                </td>
                <td
                  className={`${BODY_CELL} whitespace-nowrap text-ink-muted tabular-nums`}
                  title={absoluteTime(lead.createdAt)}
                >
                  {relativeTime(lead.createdAt)}
                </td>
                <td className="pr-3 text-right">
                  <ChevronRightIcon className="size-4 text-ink-soft opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line lg:hidden">
        {leads.map((lead) => (
          <li key={lead.id} className={freshIds.has(lead.id) ? 'animate-flash-in' : ''}>
            <Link to={`/leads/${lead.id}`} className="flex flex-col gap-1.5 px-4 py-3 active:bg-sunk">
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  {leadName(lead)}
                  {lead.isTest ? <TestChip /> : null}
                </span>
                <StatusBadge status={lead.status} />
              </div>
              <span className="truncate text-sm text-ink-muted">{lead.email ?? <Blank />}</span>
              <div className="flex items-center justify-between gap-3 text-xs text-ink-soft tabular-nums">
                <span>{lead.phone ?? <Blank />}</span>
                <span title={absoluteTime(lead.createdAt)}>{relativeTime(lead.createdAt)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};
