const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const absoluteFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const YEARS = { limit: Number.POSITIVE_INFINITY, unit: 'year', ms: 31_557_600_000 } as const;

const DIVISIONS = [
  { limit: 60_000, unit: 'second', ms: 1_000 },
  { limit: 3_600_000, unit: 'minute', ms: 60_000 },
  { limit: 86_400_000, unit: 'hour', ms: 3_600_000 },
  { limit: 604_800_000, unit: 'day', ms: 86_400_000 },
  { limit: 2_629_800_000, unit: 'week', ms: 604_800_000 },
  { limit: 31_557_600_000, unit: 'month', ms: 2_629_800_000 },
  YEARS,
] as const;

export const relativeTime = (iso: string, now: number = Date.now()): string => {
  const time = new Date(iso).getTime();

  if (Number.isNaN(time)) return 'unknown';

  const elapsed = time - now;
  const distance = Math.abs(elapsed);

  if (distance < 45_000) return 'just now';

  const division = DIVISIONS.find((entry) => distance < entry.limit) ?? YEARS;

  return relativeFormatter.format(Math.round(elapsed / division.ms), division.unit);
};

export const absoluteTime = (iso: string): string => {
  const time = new Date(iso);

  return Number.isNaN(time.getTime()) ? 'unknown' : absoluteFormatter.format(time);
};
