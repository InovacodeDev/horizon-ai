/**
 * Interface for Appwrite Database Migrations
 * Similar to traditional SQL migrations but for Appwrite tables
 * Using TablesDB (new API) instead of deprecated Databases
 */
import { TablesDB } from 'node-appwrite';

export interface MigrationContext {
  databases: TablesDB;
  databaseId: string;
}

export interface Migration {
  /**
   * Unique identifier for this migration
   * Format: timestamp_description (e.g., "20250123_create_users_table")
   */
  id: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Apply the migration (create tables, columns, indexes)
   */
  up(context: MigrationContext): Promise<void>;

  /**
   * Rollback the migration (delete tables, columns, indexes)
   */
  down(context: MigrationContext): Promise<void>;
}

export interface MigrationRecord {
  id: string;
  migrationId: string;
  appliedAt: string;
  description: string;
}
