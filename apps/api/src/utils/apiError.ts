class ApiError extends Error {
  statusCode: number;
  errors: unknown[];
  data: unknown;
  success = false;

  constructor(
    statusCode: number,
    message = 'Something went wrong',
    errors: unknown[] = [],
    data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
  }
}

export default ApiError;
