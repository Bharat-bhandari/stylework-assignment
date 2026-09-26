import type { ReactNode } from 'react';
import { actorLabel, changeNote, diffRows, fieldChanges } from '../helper/leadActivity';
import { fieldLabel, formatFieldValue } from '../helper/leadField';
import { absoluteTime, relativeTime } from '../helper/time';
import type { ActivityType, LeadActivity } from '../types/api';
import { ArrowRightIcon, InboxArrowIcon, NoteIcon, PencilIcon, SwapIcon } from './icons';
import { StatusBadge } from './StatusBadge';

type ActivityTimelineProps = {
  activities: LeadActivity[];
};

const ACTIVITY: Record<ActivityType, { label: string; icon: ReactNode; tone: string }> = {
  LEAD_CREATED: {
    label: 'Lead created',
    icon: <InboxArrowIcon className="size-[15px]" />,
    tone: 'bg-lead-new-soft text-lead-new-ink',
  },
  LEAD_UPDATED: {
    label: 'Lead details updated',
    icon: <PencilIcon className="size-[15px]" />,
    tone: 'bg-lead-contacted-soft text-lead-contacted-ink',
  },
  STATUS_CHANGED: {
    label: 'Status changed',
    icon: <SwapIcon className="size-[15px]" />,
    tone: 'bg-sunk text-ink',
  },
};

export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => (
  <ol className="flex flex-col">
    {activities.map((activity, index) => {
      const entry = ACTIVITY[activity.type];
      const changes = fieldChanges(activity.changes).flatMap(([field, change]) =>
        diffRows(field, change),
      );
      const note = changeNote(activity.changes);

      return (
        <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < activities.length - 1 ? (
            <span
              className="absolute top-8 bottom-0 left-[13px] w-px bg-line"
              aria-hidden="true"
            />
          ) : null}

          <span
            className={`relative flex size-[27px] shrink-0 items-center justify-center rounded-full ${entry.tone}`}
          >
            {entry.icon}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm font-medium">{entry.label}</span>
              <span className="text-2xs text-ink-soft tabular-nums">
                {absoluteTime(activity.createdAt)} · {relativeTime(activity.createdAt)}
              </span>
            </div>
            <p className="mt-px text-xs text-ink-muted">by {actorLabel(activity.actor)}</p>

            {activity.type === 'STATUS_CHANGED' ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {activity.fromStatus === null ? null : (
                  <>
                    <StatusBadge status={activity.fromStatus} />
                    <ArrowRightIcon className="size-3.5 text-ink-soft" />
                  </>
                )}
                {activity.toStatus === null ? null : <StatusBadge status={activity.toStatus} />}
              </div>
            ) : null}

            {changes.length > 0 ? (
              <dl className="mt-2 divide-y divide-line overflow-hidden rounded-md border border-line">
                {changes.map((change) => (
                  <div
                    key={change.field}
                    className="grid grid-cols-[minmax(0,1fr)] gap-x-3 gap-y-0.5 px-2.5 py-1.5 text-xs sm:grid-cols-[6rem_minmax(0,1fr)]"
                  >
                    <dt className="font-medium wrap-anywhere">{fieldLabel(change.field)}</dt>
                    <dd className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                      <span className="text-ink-soft line-through wrap-anywhere">
                        {formatFieldValue(change.from)}
                      </span>
                      <ArrowRightIcon className="size-3 shrink-0 text-ink-soft" />
                      <span className="wrap-anywhere">{formatFieldValue(change.to)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {note === undefined ? null : (
              <p className="mt-2 flex gap-2 rounded-md bg-sunk px-2.5 py-2 text-xs text-ink-muted">
                <NoteIcon className="mt-px size-3.5 shrink-0" />
                <span className="break-words">{note}</span>
              </p>
            )}
          </div>
        </li>
      );
    })}
  </ol>
);
