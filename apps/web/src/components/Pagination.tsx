import type { Pagination as PaginationMeta } from '../types/api';
import { Button } from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

type PaginationProps = {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
};

export const Pagination = ({ pagination, onPageChange }: PaginationProps) => {
  const { page, limit, total, totalPages } = pagination;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
      <p className="text-xs text-ink-muted tabular-nums">
        Showing <span className="font-medium text-ink">{first}</span>–
        <span className="font-medium text-ink">{last}</span> of{' '}
        <span className="font-medium text-ink">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeftIcon className="size-3.5" />}
        >
          Previous
        </Button>
        <span className="px-1.5 text-xs text-ink-muted tabular-nums">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
};
