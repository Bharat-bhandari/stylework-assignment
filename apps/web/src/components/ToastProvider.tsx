import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastInput } from '../hooks/toast.context';
import { AlertIcon, CheckIcon, CloseIcon } from './icons';

const DISMISS_AFTER_MS = 6_000;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId.current;
      nextId.current += 1;

      setToasts((current) => [...current, { ...input, id }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="on-ink pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[23rem]"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="animate-rise-in pointer-events-auto flex items-start gap-2.5 rounded-lg bg-ink px-3.5 py-3 text-ink-invert shadow-pop"
          >
            <span
              className={
                toast.tone === 'error'
                  ? 'mt-px text-signal-negative'
                  : 'mt-px text-signal-positive'
              }
            >
              {toast.tone === 'error' ? <AlertIcon /> : <CheckIcon />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.detail === undefined ? null : (
                <p className="mt-0.5 text-xs text-ink-invert-muted">{toast.detail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-mt-0.5 -mr-1 rounded-sm p-1 text-ink-invert-muted transition-colors duration-150 hover:bg-white/10 hover:text-ink-invert"
            >
              <CloseIcon className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
