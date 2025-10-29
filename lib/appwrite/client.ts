import { Account, Client, Databases, ID, TablesDB, Users } from 'node-appwrite';

import AppwriteDBAdapter from './adapter';

// Appwrite client instance
let client: Client | null = null;
let account: Account | null = null;
let databases: Databases | TablesDB | null = null;
let tables: TablesDB | null = null;
let dbAdapter: AppwriteDBAdapter | null = null;
let users: Users | null = null;

/**
 * Initialize Appwrite client
 * Must be called after environment variables are loaded
 */
export function initializeAppwrite() {
  // Skip if already initialized
  if (client && account && dbAdapter && users) {
    return { client, account, databases: dbAdapter, users };
  }

  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      'Appwrite configuration missing. Required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY',
    );
  }

  client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  account = new Account(client);
  users = new Users(client);

  // Use TablesDB (new API) instead of deprecated Databases
  tables = new TablesDB(client);
  databases = tables;

  // Wrap with adapter so legacy call sites keep working
  dbAdapter = new AppwriteDBAdapter(databases);

  console.log('✅ Appwrite client initialized successfully');
  console.log('   Endpoint:', endpoint);
  console.log('   Project ID:', projectId);

  // Return databases adapter under `databases` so existing injected consumers work
  return { client, account, databases: dbAdapter, users };
}

/**
 * Get Appwrite client instance
 */
export function getAppwriteClient(): Client {
  if (!client) {
    initializeAppwrite();
  }
  if (!client) {
    throw new Error('Appwrite client not initialized. Call initializeAppwrite() first.');
  }
  return client;
}

/**
 * Get Appwrite Account service
 */
export function getAppwriteAccount(): Account {
  if (!account) {
    initializeAppwrite();
  }
  if (!account) {
    throw new Error('Appwrite client not initialized. Call initializeAppwrite() first.');
  }
  return account;
}

/**
 * Get Appwrite Databases service
 */
export function getAppwriteDatabases(): AppwriteDBAdapter {
  if (!dbAdapter) {
    initializeAppwrite();
  }
  if (!dbAdapter) {
    throw new Error('Appwrite client not initialized. Call initializeAppwrite() first.');
  }
  return dbAdapter;
}

/**
 * Get raw TablesDB instance when available. Throws if TablesDB is not supported.
 */
export function getAppwriteTables(): TablesDB {
  if (!tables) {
    throw new Error('TablesDB is not available in the current Appwrite SDK instance.');
  }
  return tables;
}

/**
 * Get Appwrite Users service (for server-side user management)
 */
export function getAppwriteUsers(): Users {
  if (!users) {
    initializeAppwrite();
  }
  if (!users) {
    throw new Error('Appwrite client not initialized. Call initializeAppwrite() first.');
  }
  return users;
}

/**
 * Generate unique ID for Appwrite
 */
export function generateId(): string {
  return ID.unique();
}

export { Client, Account, Databases, ID, Users };
