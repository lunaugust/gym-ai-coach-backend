/**
 * Custom error class for API-related errors.
 */
class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  details: Array<string>;
  success: false;

  constructor(statusCode: number, message: string, errorCode = "API_ERROR", details: Array<string> = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.success = false as const;
  }
}

export default ApiError;

// CommonJS compatibility for tests using require()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(module as any).exports = ApiError as any;


