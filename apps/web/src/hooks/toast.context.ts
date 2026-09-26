import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error';

export type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
};

export type ToastInput = Omit<Toast, 'id'>;

export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export const useToast = (): ((toast: ToastInput) => void) => {
  const push = useContext(ToastContext);

  if (push === null) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return push;
};
