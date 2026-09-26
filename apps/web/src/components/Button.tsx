import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'invert';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-ink-invert hover:bg-ink-hover active:bg-ink-press disabled:bg-line-strong disabled:text-ink-muted',
  secondary:
    'border border-line-strong bg-panel text-ink hover:bg-sunk active:bg-line disabled:bg-sunk disabled:text-ink-soft',
  subtle:
    'text-ink-muted hover:bg-sunk hover:text-ink active:bg-line disabled:text-ink-soft disabled:hover:bg-transparent',
  invert:
    'bg-ink-invert text-ink hover:bg-white active:bg-line disabled:bg-white/40 disabled:text-ink-muted',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-sm px-2.5 text-xs',
  md: 'h-9 gap-2 rounded-md px-3.5 text-sm',
};

const Spinner = () => (
  <svg viewBox="0 0 16 16" className="size-3.5 animate-spin" aria-hidden="true" fill="none">
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <path
      d="M14.25 8A6.25 6.25 0 0 0 8 1.75"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const Button = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled === true || loading}
    className={`inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {loading ? <Spinner /> : icon}
    {children}
  </button>
);
