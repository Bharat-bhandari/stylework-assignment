import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LeadListParams } from '../api/lead.api';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { InboxIcon, SearchIcon } from '../components/icons';
import { LeadFilters } from '../components/LeadFilters';
import { LeadTable } from '../components/LeadTable';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLeadsQuery } from '../hooks/lead.query';
import { useNewLeadIds } from '../hooks/useNewLeadIds';
import { usePageTitle } from '../hooks/usePageTitle';
import { LEAD_STATUSES, type LeadStatus } from '../types/api';

const PAGE_SIZE = 20;

const TableSkeleton = () => (
  <div className="divide-y divide-line">
    {Array.from({ length: 8 }, (_, row) => (
      <div key={row} className="flex items-center gap-4 px-4 py-3.5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-52 max-sm:hidden" />
        <Skeleton className="h-3 w-28 max-lg:hidden" />
        <Skeleton className="ml-auto h-4 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

const LiveIndicator = ({ fetching }: { fetching: boolean }) => (
  <span
    className="hidden items-center gap-1.5 text-xs text-ink-muted sm:inline-flex"
    title="This list refreshes every 10 seconds"
  >
    <span
      className={`size-1.5 rounded-full transition-colors duration-300 ${
        fetching ? 'bg-lead-converted' : 'bg-line-strong'
      }`}
    />
    {fetching ? 'Refreshing' : 'Live'}
  </span>
);

export const LeadsPage = () => {
  usePageTitle('Leads');

  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const status = LEAD_STATUSES.find((value) => value === searchParams.get('status'));
  const includeTest = searchParams.get('includeTest') === 'true';
  const query = searchParams.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebouncedValue(searchInput);

  const applyParams = useCallback(
    (changes: Record<string, string | undefined>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, value);
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (debouncedSearch === query) return;

    applyParams({ q: debouncedSearch, page: undefined });
  }, [debouncedSearch, query, applyParams]);

  const listParams: LeadListParams = {
    page,
    limit: PAGE_SIZE,
    includeTest,
    ...(status === undefined ? {} : { status }),
    ...(query === '' ? {} : { q: query }),
  };

  const leads = useLeadsQuery(listParams);
  const freshIds = useNewLeadIds(leads.data?.leads, `${status ?? 'all'}|${query}|${String(includeTest)}|${page}`);

  const filtered = status !== undefined || query !== '' || includeTest;

  const clearFilters = () => {
    setSearchInput('');
    applyParams({ q: undefined, status: undefined, includeTest: undefined, page: undefined });
  };

  const setStatus = (next: LeadStatus | undefined) => applyParams({ status: next, page: undefined });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.015em]">Leads</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Every lead Meta has delivered, newest first.
          </p>
        </div>
        <LiveIndicator fetching={leads.isFetching} />
      </div>

      <LeadFilters
        status={status}
        onStatusChange={setStatus}
        search={searchInput}
        onSearchChange={setSearchInput}
        includeTest={includeTest}
        onIncludeTestChange={(next) =>
          applyParams({ includeTest: next ? 'true' : undefined, page: undefined })
        }
      />

      <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-panel">
        {leads.isPending ? <TableSkeleton /> : null}

        {leads.isError ? (
          <ErrorState
            title="Could not load leads"
            error={leads.error}
            onRetry={() => void leads.refetch()}
            retrying={leads.isFetching}
          />
        ) : null}

        {leads.data !== undefined && leads.data.leads.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={<SearchIcon className="size-[18px]" />}
              title="No leads match these filters"
              description="Try a different status, clear the search, or include test leads."
              action={
                <Button onClick={clearFilters} size="sm">
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<InboxIcon className="size-[18px]" />}
              title="No leads yet"
              description="Leads appear here as soon as Meta delivers a webhook. Use Simulate Meta lead to send a signed delivery through the real webhook path."
            />
          )
        ) : null}

        {leads.data !== undefined && leads.data.leads.length > 0 ? (
          <>
            <LeadTable leads={leads.data.leads} freshIds={freshIds} />
            <Pagination
              pagination={leads.data.pagination}
              onPageChange={(next) => applyParams({ page: String(next) })}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};
