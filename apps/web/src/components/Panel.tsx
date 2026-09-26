import type { ReactNode } from 'react';

type PanelProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export const Panel = ({
  title,
  action,
  children,
  className = '',
  bodyClassName = 'px-4 py-3.5',
}: PanelProps) => (
  <section className={`rounded-lg border border-line bg-panel shadow-panel ${className}`}>
    {title === undefined ? null : (
      <header className="flex h-10 items-center justify-between gap-3 border-b border-line px-4">
        <h2 className="text-2xs font-semibold tracking-[0.09em] text-ink-muted uppercase">
          {title}
        </h2>
        {action}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);
