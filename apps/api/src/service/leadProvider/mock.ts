import type { LeadgenChangeValue } from '../../schema/metaWebhook.schema.js';
import type { LeadDetails, LeadDetailsProvider } from './index.js';

const FIRST_NAMES = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sana', 'Vikram', 'Ananya'];
const LAST_NAMES = ['Sharma', 'Iyer', 'Kapoor', 'Nair', 'Bose', 'Mehta', 'Reddy', 'Gill'];
const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Chennai'];
const TEAM_SIZES = ['1-5', '6-15', '16-40', '40+'];
const PLATFORMS = ['fb', 'ig'];

const seedOf = (value: string): number => {
  let seed = 0;

  for (let index = 0; index < value.length; index += 1) {
    seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  }

  return seed;
};

const pick = (options: readonly string[], seed: number): string =>
  options[seed % options.length] ?? '';

const buildMockLead = (leadgenId: string, hint?: LeadgenChangeValue): LeadDetails => {
  const seed = seedOf(leadgenId);
  const firstName = pick(FIRST_NAMES, seed);
  const lastName = pick(LAST_NAMES, seed >>> 3);
  const handle = `${firstName}.${lastName}`.toLowerCase();

  const fieldData = [
    { name: 'full_name', values: [`${firstName} ${lastName}`] },
    { name: 'email', values: [`${handle}.${seed % 997}@example.com`] },
    { name: 'phone_number', values: [`+9198${String(10_000_000 + (seed % 89_999_999))}`] },
    { name: 'city', values: [pick(CITIES, seed >>> 6)] },
    { name: 'team_size', values: [pick(TEAM_SIZES, seed >>> 9)] },
  ];

  return {
    leadgenId,
    formId: hint?.form_id ?? null,
    adId: hint?.ad_id ?? null,
    campaignId: `mock-campaign-${seed % 50}`,
    platform: pick(PLATFORMS, seed >>> 12),
    createdTime: new Date(),
    fieldData,
    raw: { source: 'mock', leadgen_id: leadgenId, field_data: fieldData },
  };
};

export const mockLeadProvider: LeadDetailsProvider = {
  fetchLead: (leadgenId, hint) => Promise.resolve(buildMockLead(leadgenId, hint)),
};
