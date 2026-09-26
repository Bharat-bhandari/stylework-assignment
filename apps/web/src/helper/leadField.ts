const FIELD_LABEL: Record<string, string> = {
  fullName: 'Name',
  email: 'Email',
  phone: 'Phone',
  answers: 'Form answers',
  isTest: 'Test lead',
  adId: 'Ad',
  campaignId: 'Campaign',
  formId: 'Form',
  pageId: 'Page',
  platform: 'Platform',
};

export const fieldLabel = (field: string): string =>
  FIELD_LABEL[field] ??
  field
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());

export const formatFieldValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'empty';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'number') return String(value);

  return JSON.stringify(value);
};
