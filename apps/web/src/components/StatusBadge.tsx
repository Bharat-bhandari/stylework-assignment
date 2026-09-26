import { STATUS_LABEL, STATUS_TONE } from '../helper/leadStatus';
import type { LeadStatus } from '../types/api';

type StatusBadgeProps = {
  status: LeadStatus;
  className?: string;
};

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const tone = STATUS_TONE[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-2xs font-semibold tracking-[0.07em] uppercase ${tone.badge} ${className}`}
    >
      <span className={`size-[5px] rounded-full ${tone.dot}`} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
};
