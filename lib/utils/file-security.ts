/**
 * File Security Utilities
 * Provides validation and security checks for uploaded files
 */
import { ImportError, ImportErrorCode } from '@/lib/types';

/**
 * Allowed MIME types for import files
 */
const ALLOWED_MIME_TYPES = {
  ofx: ['application/x-ofx', 'application/vnd.intu.qfx', 'text/plain', 'application/octet-stream'],
  csv: ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel'],
  pdf: ['application/pdf'],
};

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Malicious content patterns to detect
 */
const MALICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
  /<iframe[^>]*>/gi, // Iframe tags
  /<object[^>]*>/gi, // Object tags
  /<embed[^>]*>/gi, // Embed tags
  /eval\s*\(/gi, // Eval function
  /expression\s*\(/gi, // CSS expressions
];

/**
 * Validate file extension
 */
export function validateFileExtension(fileName: string): boolean {
  const extension = fileName.toLowerCase().split('.').pop();
  return extension === 'ofx' || extension === 'csv' || extension === 'pdf';
}

/**
 * Validate file MIME type
 */
export function validateMimeType(file: File): boolean {
  const extension = file.name.toLowerCase().split('.').pop();

  if (!extension || !['ofx', 'csv', 'pdf'].includes(extension)) {
    return false;
  }

  const allowedTypes = ALLOWED_MIME_TYPES[extension as keyof typeof ALLOWED_MIME_TYPES];
  return allowedTypes.includes(file.type) || file.type === '';
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
}

/**
 * Detect malicious content in file
 * Performs basic pattern matching to detect potentially malicious content
 */
export function detectMaliciousContent(content: string): boolean {
  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Check for excessive null bytes (potential binary exploit)
  const nullByteCount = (content.match(/\0/g) || []).length;
  if (nullByteCount > 10) {
    return true;
  }

  return false;
}

/**
 * Comprehensive file validation
 * Validates extension, MIME type, size, and checks for malicious content
 */
export async function validateFile(file: File): Promise<void> {
  // Validate file extension
  if (!validateFileExtension(file.name)) {
    throw new ImportError('Invalid file extension', ImportErrorCode.INVALID_FILE_FORMAT, { fileName: file.name });
  }

  // Validate MIME type
  if (!validateMimeType(file)) {
    throw new ImportError('Invalid file MIME type', ImportErrorCode.INVALID_FILE_FORMAT, {
      fileName: file.name,
      mimeType: file.type,
    });
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    throw new ImportError('Invalid file size', ImportErrorCode.FILE_TOO_LARGE, {
      fileSize: file.size,
      maxSize: MAX_FILE_SIZE,
    });
  }

  // For text-based files (OFX, CSV), check for malicious content
  if (file.name.toLowerCase().endsWith('.ofx') || file.name.toLowerCase().endsWith('.csv')) {
    try {
      const content = await readFileAsText(file);

      if (detectMaliciousContent(content)) {
        throw new ImportError('Potentially malicious content detected', ImportErrorCode.MALFORMED_FILE, {
          fileName: file.name,
        });
      }
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }
      // If we can't read the file, let the parser handle it
      console.warn('Could not read file for security check:', error);
    }
  }
}

/**
 * Read file as text
 */
async function readFileAsText(file: File): Promise<string> {
  // Check if we're in a browser environment
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  } else {
    // Server-side: use arrayBuffer and TextDecoder
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  }
}

/**
 * Sanitize file name to prevent path traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and special characters
  return fileName
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .substring(0, 255); // Limit length
}

/**
 * Generate unique file name with timestamp and random string
 */
export function generateUniqueFileName(originalFileName: string): string {
  const sanitized = sanitizeFileName(originalFileName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = sanitized.split('.').pop();
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));

  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
}
