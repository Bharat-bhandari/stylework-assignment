import type { LeadFieldChange } from '../types/api';

const ACTOR_LABEL: Record<string, string> = {
  'meta-webhook': 'Meta webhook',
  dashboard: 'Dashboard',
  system: 'System',
};

export const actorLabel = (actor: string): string => ACTOR_LABEL[actor] ?? actor;

const isFieldChange = (value: unknown): value is LeadFieldChange =>
  typeof value === 'object' && value !== null && 'from' in value && 'to' in value;

export const fieldChanges = (
  changes: Record<string, unknown> | null,
): [string, LeadFieldChange][] =>
  Object.entries(changes ?? {}).filter((entry): entry is [string, LeadFieldChange] =>
    isFieldChange(entry[1]),
  );

export const changeNote = (changes: Record<string, unknown> | null): string | undefined =>
  typeof changes?.note === 'string' ? changes.note : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export type DiffRow = { field: string; from: unknown; to: unknown };

// The webhook diffs `answers` as one object, which is unreadable as a raw before/after pair, so
// an object change is reported as the individual answers that actually moved.
export const diffRows = (field: string, change: LeadFieldChange): DiffRow[] => {
  const { from, to } = change;

  if (!isRecord(from) || !isRecord(to)) return [{ field, from, to }];

  const rows = [...new Set([...Object.keys(from), ...Object.keys(to)])]
    .filter((key) => JSON.stringify(from[key]) !== JSON.stringify(to[key]))
    .map((key) => ({ field: key, from: from[key], to: to[key] }));

  return rows.length === 0 ? [{ field, from, to }] : rows;
};
