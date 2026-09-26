import type { FieldData } from '../schema/metaWebhook.schema.js';

export type MappedLeadFields = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, string>;
  isTest: boolean;
};

const TEST_LEAD_EMAIL = 'test@meta.com';
const TEST_LEAD_VALUE_PREFIX = '<test lead';

const flattenFieldData = (fieldData: FieldData): Record<string, string> => {
  const answers: Record<string, string> = {};

  for (const field of fieldData) {
    const key = field.name.trim().toLowerCase();
    const value = field.values[0]?.trim();

    if (key && value) {
      answers[key] = value;
    }
  }

  return answers;
};

const composeFullName = (answers: Record<string, string>): string | null => {
  const fullName = answers['full_name'];
  if (fullName) return fullName;

  const parts = [answers['first_name'], answers['last_name']].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
};

const isTestLead = (answers: Record<string, string>): boolean =>
  answers['email']?.toLowerCase() === TEST_LEAD_EMAIL ||
  Object.values(answers).some((value) => value.toLowerCase().startsWith(TEST_LEAD_VALUE_PREFIX));

export const mapLeadFields = (fieldData: FieldData): MappedLeadFields => {
  const answers = flattenFieldData(fieldData);

  return {
    fullName: composeFullName(answers),
    email: answers['email'] ?? null,
    phone: answers['phone_number'] ?? answers['phone'] ?? null,
    answers,
    isTest: isTestLead(answers),
  };
};
