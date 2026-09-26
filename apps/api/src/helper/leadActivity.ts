export type LeadFieldChanges = Record<string, { from: unknown; to: unknown }>;

// Answer keys follow the form's field order, so objects are compared on sorted entries.
const normalise = (value: unknown): string =>
  value !== null && typeof value === 'object'
    ? JSON.stringify(
        Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      )
    : JSON.stringify(value ?? null);

export const diffLeadFields = (
  current: Record<string, unknown>,
  next: Record<string, unknown>,
): LeadFieldChanges => {
  const changes: LeadFieldChanges = {};

  for (const [field, to] of Object.entries(next)) {
    const from = current[field] ?? null;

    if (normalise(from) !== normalise(to)) {
      changes[field] = { from, to: to ?? null };
    }
  }

  return changes;
};
