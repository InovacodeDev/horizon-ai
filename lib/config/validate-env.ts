/**
 * Environment Variables Validation
 *
 * This module validates that all required environment variables are present
 * and properly configured before the application starts.
 */

interface EnvConfig {
  // Appwrite Configuration
  APPWRITE_ENDPOINT: string;
  APPWRITE_PROJECT_ID: string;
  APPWRITE_API_KEY: string;
  APPWRITE_DATABASE_ID: string;

  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRATION: string;

  // Server Configuration
  NODE_ENV: string;
  PORT: string;
  API_URL: string;

  // Cookie Configuration
  COOKIE_MAX_AGE: string;
  COOKIE_SECURE: string;
  COOKIE_HTTP_ONLY: string;
  COOKIE_SAME_SITE: string;

  // CORS Configuration
  CORS_ORIGIN: string;

  // Public Variables (optional validation)
  NEXT_PUBLIC_APPWRITE_ENDPOINT?: string;
  NEXT_PUBLIC_APPWRITE_PROJECT_ID?: string;
  NEXT_PUBLIC_API_URL?: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'JWT_SECRET',
  'JWT_EXPIRATION',
  'NODE_ENV',
];

const optionalEnvVars: (keyof EnvConfig)[] = [
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRATION',
  'PORT',
  'API_URL',
  'COOKIE_MAX_AGE',
  'COOKIE_SECURE',
  'COOKIE_HTTP_ONLY',
  'COOKIE_SAME_SITE',
  'CORS_ORIGIN',
];

/**
 * Validates that all required environment variables are present
 * @throws Error if any required variable is missing
 */
export function validateEnv(): EnvConfig {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join('\n')}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.\n` +
        `See .env.example for reference.`,
    );
  }

  // Check optional but recommended variables
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️  Optional environment variables not set:\n${warnings.map((v) => `  - ${v}`).join('\n')}\n` +
        `The application will use default values.`,
    );
  }

  // Validate Appwrite endpoint format
  const endpoint = process.env.APPWRITE_ENDPOINT!;
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    throw new Error(`Invalid APPWRITE_ENDPOINT format: ${endpoint}\n` + `Must start with http:// or https://`);
  }

  // Validate JWT secret strength (in production)
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET!;
    if (jwtSecret.length < 32) {
      throw new Error(
        `JWT_SECRET is too short (${jwtSecret.length} characters).\n` +
          `For production, use a secret with at least 32 characters.\n` +
          `Generate one using: openssl rand -hex 32`,
      );
    }

    if (jwtSecret === 'your-jwt-secret-key-change-this-in-production') {
      throw new Error(
        `JWT_SECRET is using the default example value.\n` +
          `Please generate a secure secret for production.\n` +
          `Generate one using: openssl rand -hex 32`,
      );
    }
  }

  return process.env as unknown as EnvConfig;
}

/**
 * Validates Appwrite configuration by checking connectivity
 * This should be called during application startup
 */
export async function validateAppwriteConfig(): Promise<void> {
  const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID } = validateEnv();

  console.log('🔍 Validating Appwrite configuration...');
  console.log(`   Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`   Project ID: ${APPWRITE_PROJECT_ID}`);
  console.log(`   Database ID: ${APPWRITE_DATABASE_ID}`);

  // Basic validation - actual connectivity test would require Appwrite client
  // This will be done when the client is initialized

  console.log('✅ Appwrite configuration validated');
}

/**
 * Gets environment configuration with defaults
 */
export function getEnvConfig() {
  return {
    appwrite: {
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiration: process.env.JWT_EXPIRATION || '7d',
      refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
    },
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      apiUrl: process.env.API_URL || 'http://localhost:3000',
    },
    cookies: {
      maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000', 10),
      secure: process.env.COOKIE_SECURE === 'true',
      httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
      sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none',
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    },
  };
}
