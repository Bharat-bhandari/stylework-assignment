import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <span className="flex size-10 items-center justify-center rounded-full bg-sunk text-ink-muted">
      {icon}
    </span>
    <p className="mt-3.5 text-md font-semibold">{title}</p>
    <p className="mt-1 max-w-[46ch] text-sm text-ink-muted">{description}</p>
    {action === undefined ? null : <div className="mt-4">{action}</div>}
  </div>
);
