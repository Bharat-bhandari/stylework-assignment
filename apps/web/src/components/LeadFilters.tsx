import { STATUS_LABEL } from '../helper/leadStatus';
import { LEAD_STATUSES, type LeadStatus } from '../types/api';
import { CloseIcon, SearchIcon } from './icons';

type LeadFiltersProps = {
  status: LeadStatus | undefined;
  onStatusChange: (status: LeadStatus | undefined) => void;
  search: string;
  onSearchChange: (search: string) => void;
  includeTest: boolean;
  onIncludeTestChange: (includeTest: boolean) => void;
};

const OPTIONS: { value: LeadStatus | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  ...LEAD_STATUSES.map((status) => ({ value: status, label: STATUS_LABEL[status] })),
];

export const LeadFilters = ({
  status,
  onStatusChange,
  search,
  onSearchChange,
  includeTest,
  onIncludeTestChange,
}: LeadFiltersProps) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
    <div className="-mx-1 max-w-full overflow-x-auto px-1 py-0.5">
      <div
        role="group"
        aria-label="Filter leads by status"
        className="flex w-max items-center gap-0.5 rounded-md bg-sunk p-0.5"
      >
        {OPTIONS.map((option) => {
          const selected = option.value === status;

          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onStatusChange(option.value)}
              className={`rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                selected
                  ? 'bg-panel text-ink shadow-panel'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>

    <div className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-3">
      <div className="relative min-w-[13rem] flex-1 sm:max-w-xs">
        <label htmlFor="lead-search" className="sr-only">
          Search leads by name, email or phone
        </label>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted" />
        <input
          id="lead-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, email or phone"
          className="h-9 w-full rounded-md border border-line-strong bg-panel pr-8 pl-8 text-sm transition-colors duration-150 hover:border-ink-soft focus:border-ink [&::-webkit-search-cancel-button]:hidden"
        />
        {search === '' ? null : (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-sm p-1 text-ink-muted transition-colors duration-150 hover:bg-sunk hover:text-ink"
          >
            <CloseIcon className="size-3.5" />
          </button>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted select-none">
        <input
          type="checkbox"
          checked={includeTest}
          onChange={(event) => onIncludeTestChange(event.target.checked)}
          className="size-3.5 rounded-xs border-line-strong accent-ink"
        />
        Show test leads
      </label>
    </div>
  </div>
);
