import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { SearchIcon } from '../components/icons';
import { usePageTitle } from '../hooks/usePageTitle';

export const NotFoundPage = () => {
  usePageTitle('Page not found');

  return (
    <div className="rounded-lg border border-line bg-panel shadow-panel">
      <EmptyState
        icon={<SearchIcon className="size-[18px]" />}
        title="Page not found"
        description="That address does not exist in this dashboard."
        action={
          <Link
            to="/leads"
            className="text-sm font-medium underline underline-offset-2 hover:text-ink-muted"
          >
            Back to leads
          </Link>
        }
      />
    </div>
  );
};
