/**
 * Appwrite Migration Runner
 * Manages database schema migrations
 * Using TablesDB (new API) instead of deprecated Databases
 */
import fs from 'fs';
import { Client, ID, Query, TablesDB } from 'node-appwrite';
import path from 'path';

import { migrations } from './index';
import { Migration, MigrationContext, MigrationRecord } from './migration.interface';

export class MigrationRunner {
  private databases: TablesDB;
  private databaseId: string;

  constructor(
    private client: Client,
    databaseId: string,
  ) {
    this.databases = new TablesDB(client);
    this.databaseId = databaseId;
  }

  /**
   * Get list of already applied migrations
   */
  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const response = await this.databases.listRows({
        databaseId: this.databaseId,
        tableId: 'migrations',
        queries: [Query.orderAsc('appliedAt')],
      });

      return response.rows.map((doc: any) => (doc as unknown as MigrationRecord).migrationId);
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      // If migrations table doesn't exist yet, return empty array
      if (err.code === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Record a migration as applied
   */
  private async recordMigration(migration: Migration): Promise<void> {
    await this.databases.createRow({
      databaseId: this.databaseId,
      tableId: 'migrations',
      rowId: ID.unique(),
      data: {
        migrationId: migration.id,
        description: migration.description,
        appliedAt: new Date().toISOString(),
      },
    });

    // Update local applied-migrations.json (append if missing)
    try {
      const filePath = path.resolve(__dirname, 'applied-migrations.json');
      const existing: string[] = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : [];
      if (!existing.includes(migration.id)) {
        existing.push(migration.id);
        fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
      }
    } catch (err) {
      console.warn('Warning: failed to update applied-migrations.json');
    }
  }

  /**
   * Remove a migration record
   */
  private async removeMigrationRecord(migrationId: string): Promise<void> {
    const response = await this.databases.listRows({
      databaseId: this.databaseId,
      tableId: 'migrations',
      queries: [Query.equal('migrationId', migrationId)],
    });

    if (response.rows.length > 0) {
      await this.databases.deleteRow({
        databaseId: this.databaseId,
        tableId: 'migrations',
        rowId: response.rows[0].$id,
      });
    }

    // Remove from local applied-migrations.json
    try {
      const filePath = path.resolve(__dirname, 'applied-migrations.json');
      if (fs.existsSync(filePath)) {
        const existing: string[] = JSON.parse(fs.readFileSync(filePath, 'utf-8')) || [];
        const updated = existing.filter((id) => id !== migrationId);
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
      }
    } catch (err) {
      console.warn('Warning: failed to update applied-migrations.json during removal');
    }
  }

  /**
   * Run all pending migrations
   */
  async up(): Promise<void> {
    console.log('🚀 Starting migrations...\n');

    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = migrations.filter((m) => !appliedMigrations.includes(m.id));

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)\n`);

    const context: MigrationContext = {
      databases: this.databases,
      databaseId: this.databaseId,
    };

    for (const migration of pendingMigrations) {
      try {
        console.log(`⏳ Running: ${migration.id}`);
        console.log(`   ${migration.description}`);

        await migration.up(context);
        await this.recordMigration(migration);

        console.log(`✅ Completed: ${migration.id}\n`);
      } catch (error) {
        console.error(`❌ Failed: ${migration.id}`);
        console.error(error);
        throw new Error(`Migration failed: ${migration.id}. Stopping migration process.`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
  }

  /**
   * Rollback the last migration
   */
  async down(): Promise<void> {
    console.log('🔄 Rolling back last migration...\n');

    const appliedMigrations = await this.getAppliedMigrations();

    if (appliedMigrations.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return;
    }

    const lastMigrationId = appliedMigrations[appliedMigrations.length - 1];
    const migration = migrations.find((m) => m.id === lastMigrationId);

    if (!migration) {
      throw new Error(`Migration not found: ${lastMigrationId}`);
    }

    const context: MigrationContext = {
      databases: this.databases,
      databaseId: this.databaseId,
    };

    try {
      console.log(`⏳ Rolling back: ${migration.id}`);
      console.log(`   ${migration.description}`);

      await migration.down(context);
      await this.removeMigrationRecord(migration.id);

      console.log(`✅ Rolled back: ${migration.id}\n`);
      console.log('🎉 Rollback completed successfully!');
    } catch (error) {
      console.error(`❌ Rollback failed: ${migration.id}`);
      console.error(error);
      throw error;
    }
  }

  /**
   * Show migration status
   */
  async status(): Promise<void> {
    console.log('📊 Migration Status\n');

    const appliedMigrations = await this.getAppliedMigrations();

    console.log(`Applied Migrations: ${appliedMigrations.length}`);
    console.log(`Total Migrations: ${migrations.length}`);
    console.log(`Pending Migrations: ${migrations.length - appliedMigrations.length}\n`);

    if (appliedMigrations.length > 0) {
      console.log('✅ Applied:');
      for (const migrationId of appliedMigrations) {
        const migration = migrations.find((m) => m.id === migrationId);
        if (migration) {
          console.log(`   - ${migration.id}: ${migration.description}`);
        }
      }
      console.log('');
    }

    const pendingMigrations = migrations.filter((m) => !appliedMigrations.includes(m.id));

    if (pendingMigrations.length > 0) {
      console.log('⏳ Pending:');
      for (const migration of pendingMigrations) {
        console.log(`   - ${migration.id}: ${migration.description}`);
      }
    }
  }

  /**
   * Reset database (rollback all migrations)
   * USE WITH CAUTION - This will delete all collections!
   */
  async reset(): Promise<void> {
    console.log('⚠️  WARNING: This will rollback ALL migrations!\n');

    const appliedMigrations = await this.getAppliedMigrations();

    if (appliedMigrations.length === 0) {
      console.log('ℹ️  No migrations to reset');
      return;
    }

    console.log(`🗑️  Rolling back ${appliedMigrations.length} migration(s)...\n`);

    const context: MigrationContext = {
      databases: this.databases,
      databaseId: this.databaseId,
    };

    // Rollback in reverse order
    const migrationsToRollback = [...migrations].reverse().filter((m) => appliedMigrations.includes(m.id));

    for (const migration of migrationsToRollback) {
      try {
        console.log(`⏳ Rolling back: ${migration.id}`);
        await migration.down(context);
        await this.removeMigrationRecord(migration.id);
        console.log(`✅ Rolled back: ${migration.id}`);
      } catch (error) {
        console.error(`❌ Failed to rollback: ${migration.id}`);
        console.error(error);
        // Continue with other migrations even if one fails
      }
    }

    console.log('\n🎉 Database reset completed!');
  }
}
