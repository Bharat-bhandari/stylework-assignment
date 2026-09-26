import { Link, useParams } from 'react-router-dom';
import { ApiRequestError } from '../api/client';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ArrowLeftIcon, InboxIcon, SearchIcon } from '../components/icons';
import { LeadAnswers } from '../components/LeadAnswers';
import { LeadAttribution } from '../components/LeadAttribution';
import { LeadContactCard } from '../components/LeadContactCard';
import { LeadStatusControl } from '../components/LeadStatusControl';
import { Panel } from '../components/Panel';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import { TestChip } from '../components/TestChip';
import { describeError } from '../helper/apiError';
import { STATUS_LABEL } from '../helper/leadStatus';
import { absoluteTime, relativeTime } from '../helper/time';
import { useLeadQuery, useLeadStatusMutation } from '../hooks/lead.query';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../hooks/toast.context';
import type { LeadStatus } from '../types/api';

const BackLink = () => (
  <Link
    to="/leads"
    className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors duration-150 hover:text-ink"
  >
    <ArrowLeftIcon className="size-3.5" />
    Leads
  </Link>
);

const DetailSkeleton = () => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-3 w-72" />
    </div>
    <Skeleton className="h-24 w-full rounded-lg" />
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  </div>
);

export const LeadDetailPage = () => {
  const { id = '' } = useParams();
  const detail = useLeadQuery(id);
  const mutation = useLeadStatusMutation(id);
  const pushToast = useToast();

  usePageTitle(detail.data?.lead.fullName ?? 'Lead');

  const applyStatus = (status: LeadStatus, note: string | undefined) => {
    mutation.mutate(
      { status, ...(note === undefined ? {} : { note }) },
      {
        onSuccess: (result) => {
          pushToast({
            tone: 'success',
            title: `Status changed to ${STATUS_LABEL[result.lead.status]}`,
          });
        },
        onError: (error) => {
          pushToast({
            tone: 'error',
            title: 'Status not changed',
            detail: describeError(error),
          });

          // A 409 means the lead moved underneath us, so the allowed transitions are stale.
          if (error instanceof ApiRequestError && error.statusCode === 409) {
            void detail.refetch();
          }
        },
      },
    );
  };

  const notFound = detail.error instanceof ApiRequestError && detail.error.statusCode === 404;

  return (
    <div className="flex flex-col gap-5">
      <BackLink />

      {detail.isPending ? <DetailSkeleton /> : null}

      {detail.isError ? (
        <div className="rounded-lg border border-line bg-panel shadow-panel">
          {notFound ? (
            <EmptyState
              icon={<SearchIcon className="size-[18px]" />}
              title="Lead not found"
              description="This lead does not exist, or it has been removed since the link was created."
              action={
                <Link
                  to="/leads"
                  className="text-sm font-medium underline underline-offset-2 hover:text-ink-muted"
                >
                  Back to leads
                </Link>
              }
            />
          ) : (
            <ErrorState
              title="Could not load this lead"
              error={detail.error}
              onRetry={() => void detail.refetch()}
              retrying={detail.isFetching}
            />
          )}
        </div>
      ) : null}

      {detail.data === undefined ? null : (
        <>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <h1 className="text-xl font-semibold tracking-[-0.015em]">
                {detail.data.lead.fullName ?? 'Unnamed lead'}
              </h1>
              {detail.data.lead.isTest ? <TestChip /> : null}
              <StatusBadge status={detail.data.lead.status} />
            </div>
            <p className="mt-1 text-xs text-ink-muted tabular-nums">
              Received {absoluteTime(detail.data.lead.createdAt)} ·{' '}
              {relativeTime(detail.data.lead.createdAt)}
            </p>
          </div>

          <LeadStatusControl
            key={detail.data.lead.status}
            status={detail.data.lead.status}
            allowedNextStatuses={detail.data.allowedNextStatuses}
            onApply={applyStatus}
            pending={mutation.isPending}
          />

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <LeadContactCard lead={detail.data.lead} />
              <LeadAttribution lead={detail.data.lead} />
              <LeadAnswers lead={detail.data.lead} />
            </div>

            <Panel
              title="Activity"
              action={
                <span className="text-2xs text-ink-soft tabular-nums">
                  {detail.data.activities.length}{' '}
                  {detail.data.activities.length === 1 ? 'entry' : 'entries'}
                </span>
              }
              bodyClassName="px-4 py-4"
            >
              {detail.data.activities.length === 0 ? (
                <EmptyState
                  icon={<InboxIcon className="size-[18px]" />}
                  title="No activity recorded"
                  description="Every change to this lead is appended here as it happens."
                />
              ) : (
                <>
                  <ActivityTimeline activities={detail.data.activities} />
                  <p className="mt-4 border-t border-line pt-3 text-2xs text-ink-soft">
                    This trail is append-only. Entries are never edited or removed.
                  </p>
                </>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};
