/**
 * Appwrite Configuration Validation
 * Validates environment variables and connection
 */
import { AppwriteException } from 'node-appwrite';

import { getAppwriteAccount, getAppwriteDatabases, initializeAppwrite } from './client';
import { DATABASE_ID } from './schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Appwrite environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  if (!process.env.APPWRITE_ENDPOINT) {
    errors.push('APPWRITE_ENDPOINT is not set');
  } else if (!process.env.APPWRITE_ENDPOINT.startsWith('http')) {
    errors.push('APPWRITE_ENDPOINT must start with http:// or https://');
  }

  if (!process.env.APPWRITE_PROJECT_ID) {
    errors.push('APPWRITE_PROJECT_ID is not set');
  }

  if (!process.env.APPWRITE_API_KEY) {
    errors.push('APPWRITE_API_KEY is not set');
  } else if (process.env.APPWRITE_API_KEY.length < 32) {
    warnings.push('APPWRITE_API_KEY seems too short, verify it is correct');
  }

  if (!process.env.APPWRITE_DATABASE_ID) {
    errors.push('APPWRITE_DATABASE_ID is not set');
  }

  // Public variables (for client-side)
  if (!process.env.APPWRITE_ENDPOINT) {
    warnings.push('APPWRITE_ENDPOINT is not set (needed for client-side)');
  }

  if (!process.env.APPWRITE_PROJECT_ID) {
    warnings.push('APPWRITE_PROJECT_ID is not set (needed for client-side)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test Appwrite connection
 */
export async function testConnection(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Initialize client
    initializeAppwrite();

    // Test Account service
    try {
      const account = getAppwriteAccount();
      // Try to get current session (will fail if no session, but tests connection)
      await account.get();
    } catch (error) {
      if (error instanceof AppwriteException) {
        // 401 is expected if no session, but means connection works
        if (error.code !== 401) {
          errors.push(`Account service error: ${error.message}`);
        }
      } else {
        errors.push(`Account service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Test Database service
    try {
      const databases = getAppwriteDatabases();
      // Try to list documents (will fail if collection doesn't exist, but tests connection)
      await databases.listDocuments(DATABASE_ID, 'users', []);
    } catch (error) {
      if (error instanceof AppwriteException) {
        // 404 is acceptable if collection doesn't exist yet
        if (error.code !== 404) {
          errors.push(`Database service error: ${error.message}`);
        }
      } else {
        errors.push(`Database service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all Appwrite configuration and connection
 */
export async function validateAppwrite(): Promise<ValidationResult> {
  const envResult = validateEnvironment();

  if (!envResult.valid) {
    return envResult;
  }

  const connectionResult = await testConnection();

  return {
    valid: envResult.valid && connectionResult.valid,
    errors: [...envResult.errors, ...connectionResult.errors],
    warnings: [...envResult.warnings, ...connectionResult.warnings],
  };
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
  console.log('\n=== Appwrite Configuration Validation ===\n');

  if (result.valid) {
    console.log('✅ All checks passed!\n');
  } else {
    console.log('❌ Validation failed\n');
  }

  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach((error) => console.log(`  ❌ ${error}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    result.warnings.forEach((warning) => console.log(`  ⚠️  ${warning}`));
    console.log('');
  }

  console.log('=========================================\n');
}
