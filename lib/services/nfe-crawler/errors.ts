/**
 * NFe Web Crawler with AI Extraction - Error Classes
 *
 * Custom error classes for the NFe web crawler system with structured
 * error codes and details for better error handling and debugging.
 */
import { ErrorDetails, InvoiceParserErrorCode } from './types';

/**
 * Base error class for invoice parsing operations
 */
export class InvoiceParserError extends Error {
  public readonly code: InvoiceParserErrorCode;
  public readonly details?: ErrorDetails;

  constructor(message: string, code: InvoiceParserErrorCode, details?: ErrorDetails) {
    super(message);
    this.name = 'InvoiceParserError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvoiceParserError);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Error thrown when invoice key cannot be extracted from URL
 */
export class InvoiceKeyNotFoundError extends InvoiceParserError {
  constructor(url: string, additionalDetails?: Record<string, any>) {
    super('Could not extract invoice key from URL', InvoiceParserErrorCode.INVOICE_KEY_NOT_FOUND, {
      url,
      step: 'key_extraction',
      ...additionalDetails,
    });
    this.name = 'InvoiceKeyNotFoundError';
  }
}

/**
 * Error thrown when HTML fetch fails
 */
export class HTMLFetchError extends InvoiceParserError {
  constructor(url: string, reason: string, additionalDetails?: Record<string, any>) {
    super(`Failed to fetch HTML from URL: ${reason}`, InvoiceParserErrorCode.HTML_FETCH_ERROR, {
      url,
      step: 'html_fetch',
      reason,
      ...additionalDetails,
    });
    this.name = 'HTMLFetchError';
  }
}

/**
 * Error thrown when AI parsing fails
 */
export class AIParseError extends InvoiceParserError {
  constructor(reason: string, additionalDetails?: Record<string, any>) {
    super(`AI parsing failed: ${reason}`, InvoiceParserErrorCode.AI_PARSE_ERROR, {
      step: 'ai_parse',
      reason,
      ...additionalDetails,
    });
    this.name = 'AIParseError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends InvoiceParserError {
  constructor(validationErrors: string[], additionalDetails?: Record<string, any>) {
    super(`Validation failed: ${validationErrors.join(', ')}`, InvoiceParserErrorCode.VALIDATION_ERROR, {
      step: 'validation',
      validationErrors,
      ...additionalDetails,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends InvoiceParserError {
  constructor(url: string, reason: string, additionalDetails?: Record<string, any>) {
    super(`Network error: ${reason}`, InvoiceParserErrorCode.NETWORK_ERROR, {
      url,
      reason,
      ...additionalDetails,
    });
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when request times out
 */
export class TimeoutError extends InvoiceParserError {
  constructor(url: string, timeout: number, additionalDetails?: Record<string, any>) {
    super(`Request timeout after ${timeout}ms`, InvoiceParserErrorCode.TIMEOUT_ERROR, {
      url,
      timeout,
      ...additionalDetails,
    });
    this.name = 'TimeoutError';
  }
}

/**
 * Error thrown when input format is invalid
 */
export class InvalidFormatError extends InvoiceParserError {
  constructor(input: string, expectedFormat: string, additionalDetails?: Record<string, any>) {
    super(`Invalid format: expected ${expectedFormat}`, InvoiceParserErrorCode.INVALID_FORMAT, {
      input,
      expectedFormat,
      ...additionalDetails,
    });
    this.name = 'InvalidFormatError';
  }
}

/**
 * Helper function to check if an error is an InvoiceParserError
 */
export function isInvoiceParserError(error: unknown): error is InvoiceParserError {
  return error instanceof InvoiceParserError;
}

/**
 * Helper function to convert any error to InvoiceParserError
 */
export function toInvoiceParserError(error: unknown, defaultCode: InvoiceParserErrorCode): InvoiceParserError {
  if (isInvoiceParserError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InvoiceParserError(error.message, defaultCode, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new InvoiceParserError(String(error), defaultCode, {
    originalError: typeof error,
  });
}
