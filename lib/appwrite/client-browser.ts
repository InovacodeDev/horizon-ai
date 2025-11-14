import { Client, Databases, TablesDB } from 'appwrite';

let client: Client | null = null;
let databases: TablesDB | null = null;

/**
 * Initialize Appwrite client for browser (client-side)
 */
export function initializeAppwriteBrowser() {
  if (client && databases) {
    return { client, databases };
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error(
      'Appwrite configuration missing. Required: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    );
  }

  client = new Client();
  client.setEndpoint(endpoint).setProject(projectId);

  databases = new TablesDB(client);

  return { client, databases };
}

/**
 * Get Appwrite client instance for browser
 */
export function getAppwriteBrowserClient(): Client {
  if (!client) {
    initializeAppwriteBrowser();
  }
  if (!client) {
    throw new Error('Appwrite browser client not initialized');
  }
  return client;
}

/**
 * Get Appwrite Databases service for browser
 */
export function getAppwriteBrowserDatabases(): TablesDB {
  if (!databases) {
    initializeAppwriteBrowser();
  }
  if (!databases) {
    throw new Error('Appwrite browser databases not initialized');
  }
  return databases;
}
