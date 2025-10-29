import { Query } from 'node-appwrite';

import { getAppwriteDatabases } from './client';
import { DATABASE_ID } from './schema';

/**
 * Database helper functions for common operations
 */

/**
 * List documents with pagination and filtering
 */
export async function listDocuments<T = any>(
  collectionId: string,
  queries: string[] = [],
): Promise<{ documents: T[]; total: number }> {
  const databases = getAppwriteDatabases();
  const result = await databases.listDocuments(DATABASE_ID, collectionId, queries);

  return {
    documents: (result.documents || []) as T[],
    total: result.total || result.documents?.length || 0,
  };
}

/**
 * Get a single document by ID
 */
export async function getDocument<T = any>(collectionId: string, documentId: string): Promise<T> {
  const databases = getAppwriteDatabases();
  return (await databases.getDocument(DATABASE_ID, collectionId, documentId)) as T;
}

/**
 * Create a new document
 */
export async function createDocument<T = any>(
  collectionId: string,
  documentId: string,
  data: any,
  permissions?: string[],
): Promise<T> {
  const databases = getAppwriteDatabases();
  return (await databases.createDocument(DATABASE_ID, collectionId, documentId, data, permissions)) as T;
}

/**
 * Update an existing document
 */
export async function updateDocument<T = any>(collectionId: string, documentId: string, data: any): Promise<T> {
  const databases = getAppwriteDatabases();
  return (await databases.updateDocument(DATABASE_ID, collectionId, documentId, data)) as T;
}

/**
 * Delete a document
 */
export async function deleteDocument(collectionId: string, documentId: string): Promise<void> {
  const databases = getAppwriteDatabases();
  await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
}

/**
 * Query builder helpers
 */
export const QueryBuilder = {
  equal: (attribute: string, value: any) => Query.equal(attribute, value),
  notEqual: (attribute: string, value: any) => Query.notEqual(attribute, value),
  lessThan: (attribute: string, value: any) => Query.lessThan(attribute, value),
  lessThanEqual: (attribute: string, value: any) => Query.lessThanEqual(attribute, value),
  greaterThan: (attribute: string, value: any) => Query.greaterThan(attribute, value),
  greaterThanEqual: (attribute: string, value: any) => Query.greaterThanEqual(attribute, value),
  search: (attribute: string, value: string) => Query.search(attribute, value),
  isNull: (attribute: string) => Query.isNull(attribute),
  isNotNull: (attribute: string) => Query.isNotNull(attribute),
  between: (attribute: string, start: any, end: any) => Query.between(attribute, start, end),
  startsWith: (attribute: string, value: string) => Query.startsWith(attribute, value),
  endsWith: (attribute: string, value: string) => Query.endsWith(attribute, value),
  select: (attributes: string[]) => Query.select(attributes),
  orderAsc: (attribute: string) => Query.orderAsc(attribute),
  orderDesc: (attribute: string) => Query.orderDesc(attribute),
  limit: (limit: number) => Query.limit(limit),
  offset: (offset: number) => Query.offset(offset),
  cursorAfter: (documentId: string) => Query.cursorAfter(documentId),
  cursorBefore: (documentId: string) => Query.cursorBefore(documentId),
};

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export function buildPaginationQueries(options: PaginationOptions = {}): string[] {
  const { page = 1, limit = 25 } = options;
  const offset = (page - 1) * limit;

  return [Query.limit(limit), Query.offset(offset)];
}

/**
 * Parse JSON field safely
 */
export function parseJSONField<T = any>(jsonString?: string, defaultValue: T | null = null): T | null {
  if (!jsonString) return defaultValue;

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON field:', error);
    return defaultValue;
  }
}

/**
 * Stringify data for JSON field
 */
export function stringifyJSONField(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify JSON field:', error);
    return '{}';
  }
}

export { Query };
