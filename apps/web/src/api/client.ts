const API_URL = import.meta.env.VITE_API_URL ?? '/api';

type ApiEnvelope<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

type ApiErrorBody = {
  message?: string;
  errors?: unknown[];
  data?: unknown;
};

export class ApiRequestError extends Error {
  statusCode: number;
  errors: unknown[];
  data: unknown;

  constructor(statusCode: number, message: string, errors: unknown[] = [], data?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
  }
}

const readBody = async (response: Response): Promise<unknown> => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError(0, 'Could not reach the API. Check that the service is running.');
  }

  const body = await readBody(response);

  if (!response.ok) {
    const failure = body as ApiErrorBody | null;

    throw new ApiRequestError(
      response.status,
      failure?.message ?? `The API responded with ${response.status}`,
      failure?.errors ?? [],
      failure?.data,
    );
  }

  return (body as ApiEnvelope<T>).data;
};

export const toQuery = (params: Record<string, string | number | boolean | undefined>): string => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }

  const query = search.toString();

  return query === '' ? '' : `?${query}`;
};
