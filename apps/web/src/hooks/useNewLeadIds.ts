import { useState } from 'react';
import type { Lead } from '../types/api';

const EMPTY: ReadonlySet<string> = new Set();

type Seen = {
  key: string;
  source: Lead[] | undefined;
  ids: ReadonlySet<string>;
  fresh: ReadonlySet<string>;
};

// Rows that arrived on a poll are worth pointing at; the first page of a filter is not, so the
// ids already on screen are recorded silently and only later arrivals are reported.
export const useNewLeadIds = (leads: Lead[] | undefined, resetKey: string): ReadonlySet<string> => {
  const [seen, setSeen] = useState<Seen>({
    key: resetKey,
    source: undefined,
    ids: EMPTY,
    fresh: EMPTY,
  });

  if (leads !== undefined && leads !== seen.source) {
    if (seen.source === undefined || seen.key !== resetKey) {
      setSeen({
        key: resetKey,
        source: leads,
        ids: new Set(leads.map((lead) => lead.id)),
        fresh: EMPTY,
      });
    } else {
      const added = leads.filter((lead) => !seen.ids.has(lead.id)).map((lead) => lead.id);

      setSeen({
        key: resetKey,
        source: leads,
        ids: new Set([...seen.ids, ...added]),
        fresh: added.length === 0 ? seen.fresh : new Set(added),
      });
    }
  }

  return seen.fresh;
};
