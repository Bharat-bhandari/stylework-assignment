import { describeError } from '../helper/apiError';
import { Button } from './Button';
import { AlertIcon, RefreshIcon } from './icons';

type ErrorStateProps = {
  title: string;
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
};

export const ErrorState = ({ title, error, onRetry, retrying = false }: ErrorStateProps) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <span className="flex size-10 items-center justify-center rounded-full bg-lead-lost-soft text-lead-lost-ink">
      <AlertIcon className="size-[18px]" />
    </span>
    <p className="mt-3.5 text-md font-semibold">{title}</p>
    <p className="mt-1 max-w-[52ch] text-sm text-ink-muted">{describeError(error)}</p>
    <Button className="mt-4" onClick={onRetry} loading={retrying} icon={<RefreshIcon />}>
      Try again
    </Button>
  </div>
);
