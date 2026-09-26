import { useState, type FormEvent } from 'react';
import { isTerminalStatus, STATUS_ACTION_LABEL, STATUS_LABEL } from '../helper/leadStatus';
import type { LeadStatus } from '../types/api';
import { Button } from './Button';
import { AlertIcon, ArrowRightIcon } from './icons';
import { Panel } from './Panel';
import { StatusBadge } from './StatusBadge';

type LeadStatusControlProps = {
  status: LeadStatus;
  allowedNextStatuses: LeadStatus[];
  onApply: (status: LeadStatus, note: string | undefined) => void;
  pending: boolean;
};

export const LeadStatusControl = ({
  status,
  allowedNextStatuses,
  onApply,
  pending,
}: LeadStatusControlProps) => {
  const [target, setTarget] = useState<LeadStatus | null>(null);
  const [note, setNote] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (target === null) return;

    onApply(target, note.trim() === '' ? undefined : note.trim());
  };

  if (allowedNextStatuses.length === 0) {
    return (
      <Panel title="Status">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge status={status} />
          <p className="text-sm text-ink-muted">
            {STATUS_LABEL[status]} is a final status, so this lead cannot move again.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Status">
      {target === null ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge status={status} />
          <ArrowRightIcon className="size-3.5 text-ink-soft" />
          <div className="flex flex-wrap gap-2">
            {allowedNextStatuses.map((next) => (
              <Button key={next} size="sm" onClick={() => setTarget(next)}>
                {STATUS_ACTION_LABEL[next]}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <ArrowRightIcon className="size-3.5 text-ink-soft" />
            <StatusBadge status={target} />
          </div>

          {isTerminalStatus(target) ? (
            <p className="flex gap-2 rounded-md bg-lead-contacted-soft px-3 py-2 text-xs text-lead-contacted-ink">
              <AlertIcon className="mt-px size-3.5 shrink-0" />
              <span>
                {STATUS_LABEL[target]} is final. Once applied, this lead cannot change status
                again.
              </span>
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status-note" className="text-xs font-medium text-ink-muted">
              Note <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea
              id="status-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Recorded in the activity trail alongside this change."
              className="w-full resize-y rounded-md border border-line-strong bg-panel px-2.5 py-2 text-sm transition-colors duration-150 hover:border-ink-soft focus:border-ink"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" loading={pending}>
              {isTerminalStatus(target)
                ? `Yes, mark as ${STATUS_LABEL[target]}`
                : `Mark as ${STATUS_LABEL[target]}`}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              disabled={pending}
              onClick={() => {
                setTarget(null);
                setNote('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
};
