import type { ReactNode } from 'react';

type IconProps = { className?: string };

type GlyphProps = { className: string | undefined; children: ReactNode };

const Glyph = ({ className = 'size-4', children }: GlyphProps) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const LogoMark = ({ className = 'size-[22px]' }: IconProps) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
    <rect width="32" height="32" rx="7" fill="currentColor" opacity="0.16" />
    <path
      d="M9 9.5v13M9 22.5h7.5"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="22" cy="11" r="3.25" fill="#2f6fcb" />
  </svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="M10.3 10.3 13.75 13.75" />
  </Glyph>
);

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M9.75 3.5 5.25 8l4.5 4.5" />
  </Glyph>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M6.25 3.5 10.75 8l-4.5 4.5" />
  </Glyph>
);

export const ArrowLeftIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M13 8H3.25M7.5 3.75 3.25 8l4.25 4.25" />
  </Glyph>
);

export const ArrowRightIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M3 8h9.75M8.5 3.75 12.75 8 8.5 12.25" />
  </Glyph>
);

export const InboxIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.25 8.75h3l.9 1.75h3.7l.9-1.75h3" />
    <path d="M3.9 3.25h8.2l1.65 5.5v3.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-3.5z" />
  </Glyph>
);

export const InboxArrowIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 1.75v5.5M5.75 5.25 8 7.5l2.25-2.25" />
    <path d="M2.25 9.25h3l.9 1.75h3.7l.9-1.75h3v3a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5z" />
  </Glyph>
);

export const PencilIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M11.15 2.6a1.63 1.63 0 0 1 2.3 2.3L6.1 12.25l-3.1.65.65-3.1z" />
    <path d="M10.1 3.65 12.4 5.95" />
  </Glyph>
);

export const SwapIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.75 5.5h9.5M9.5 2.75 12.25 5.5 9.5 8.25" />
    <path d="M13.25 10.5h-9.5M6.5 7.75 3.75 10.5l2.75 2.75" />
  </Glyph>
);

export const CheckIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M3 8.4 6.35 11.75 13 5.1" />
  </Glyph>
);

export const AlertIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M7.13 2.6a1 1 0 0 1 1.74 0l5.05 9.15a1 1 0 0 1-.87 1.5H2.95a1 1 0 0 1-.87-1.5z" />
    <path d="M8 6.25v3M8 11.6h.01" />
  </Glyph>
);

export const CloseIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M4.25 4.25 11.75 11.75M11.75 4.25 4.25 11.75" />
  </Glyph>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 3.25v9.5M3.25 8h9.5" />
  </Glyph>
);

export const RefreshIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M13.25 8a5.25 5.25 0 1 1-1.54-3.71" />
    <path d="M13.5 1.9v3.35h-3.35" />
  </Glyph>
);

export const MailIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <rect x="1.75" y="3.5" width="12.5" height="9" rx="1.5" />
    <path d="m2.5 5 5.5 4 5.5-4" />
  </Glyph>
);

export const PhoneIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M5.4 2.25H3.6a1.6 1.6 0 0 0-1.6 1.7c0 5.35 4.7 10.05 10.05 10.05a1.6 1.6 0 0 0 1.7-1.6v-1.8l-3.1-1.1-1.3 1.3a11.4 11.4 0 0 1-3.85-3.85l1.3-1.3z" />
  </Glyph>
);

export const UserIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <circle cx="8" cy="5.25" r="2.75" />
    <path d="M2.75 13.75a5.25 5.25 0 0 1 10.5 0" />
  </Glyph>
);

export const NoteIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.5 3.5h11v7.25H6.75L4.25 13.5v-2.75H2.5z" />
    <path d="M5.25 6.25h5.5M5.25 8.4h3.5" />
  </Glyph>
);
