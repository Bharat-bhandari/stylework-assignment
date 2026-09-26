import { ApiRequestError } from '../api/client';

export const describeError = (error: unknown): string => {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;

  return 'Something went wrong.';
};
