import { Databases, ID, TablesDB } from 'node-appwrite';

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Check if error is retryable (network errors)
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  const errorCode = error.code || error.cause?.code;
  const errorMessage = error.message || '';

  // Retry on connection reset, timeout, and other network errors
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];
  const retryableMessages = ['fetch failed', 'network error', 'socket hang up'];

  return (
    retryableCodes.includes(errorCode) || retryableMessages.some((msg) => errorMessage.toLowerCase().includes(msg))
  );
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retries = RETRY_CONFIG.maxRetries,
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's not a network error or if we're out of retries
      if (!isRetryableError(error) || attempt === retries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelayMs,
      );

      console.warn(
        `[AppwriteAdapter] ${operationName} failed (attempt ${attempt + 1}/${retries + 1}), ` +
          `retrying in ${delay}ms... Error: ${error.message}`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * A lightweight adapter that exposes the legacy Databases method names
 * (createDocument, listDocuments, getDocument, updateDocument, deleteDocument)
 * but delegates to TablesDB's object-parameter API when available.
 */
export class AppwriteDBAdapter {
  private databases: TablesDB;

  constructor(databases: TablesDB) {
    this.databases = databases;
  }

  /**
   * Check if TablesDB is being used
   */
  public usingTablesDB(): boolean {
    return true;
  }

  // listDocuments -> listRows
  async listDocuments(databaseId: string, collectionId: string, queries?: any) {
    try {
      return await withRetry(async () => {
        const res = await this.databases.listRows({
          databaseId,
          tableId: collectionId,
          queries,
        });
        return { documents: res.rows, total: res.total };
      }, `listDocuments(${collectionId})`);
    } catch (error: any) {
      // Gracefully handle billing limit exceeded
      if (error?.code === 402 || error?.type === 'billing_limit_exceeded') {
        console.warn(`[AppwriteAdapter] Billing limit exceeded for ${collectionId}. Returning empty list.`);
        return { documents: [], total: 0 };
      }

      console.error(`Error listing documents from ${collectionId}:`, error);
      throw error;
    }
  }

  // getDocument -> getRow
  async getDocument(databaseId: string, collectionId: string, documentId: string) {
    try {
      return await withRetry(async () => {
        const res = await this.databases.getRow({
          databaseId,
          tableId: collectionId,
          rowId: documentId,
        });
        return res;
      }, `getDocument(${documentId})`);
    } catch (error: any) {
      // Gracefully handle billing limit exceeded
      if (error?.code === 402 || error?.type === 'billing_limit_exceeded') {
        console.warn(`[AppwriteAdapter] Billing limit exceeded for getDocument ${documentId}. Returning null.`);
        return null;
      }

      console.error(`Error getting document ${documentId} from ${collectionId}:`, error);
      throw error;
    }
  }

  // createDocument -> createRow
  async createDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any,
    permissions?: string[],
  ) {
    try {
      const rowId = documentId || ID.unique();
      return await withRetry(async () => {
        const res = await this.databases.createRow({
          databaseId,
          tableId: collectionId,
          rowId,
          data,
          permissions,
        });
        return res;
      }, `createDocument(${collectionId})`);
    } catch (error) {
      console.error(`Error creating document in ${collectionId}:`, error);
      throw error;
    }
  }

  // updateDocument -> updateRow
  async updateDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any,
    permissions?: string[],
  ) {
    try {
      return await withRetry(async () => {
        const res = await this.databases.updateRow({
          databaseId,
          tableId: collectionId,
          rowId: documentId,
          data,
          permissions,
        });
        return res;
      }, `updateDocument(${documentId})`);
    } catch (error) {
      console.error(`Error updating document ${documentId} in ${collectionId}:`, error);
      throw error;
    }
  }

  // deleteDocument -> deleteRow
  async deleteDocument(databaseId: string, collectionId: string, documentId: string) {
    try {
      return await withRetry(async () => {
        const res = await this.databases.deleteRow({
          databaseId,
          tableId: collectionId,
          rowId: documentId,
        });
        return res;
      }, `deleteDocument(${documentId})`);
    } catch (error) {
      console.error(`Error deleting document ${documentId} from ${collectionId}:`, error);
      throw error;
    }
  }
}

export default AppwriteDBAdapter;
