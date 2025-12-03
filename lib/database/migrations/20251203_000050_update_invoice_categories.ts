/**
 * Migration: Update invoice categories
 *
 * Adds new categories to the 'category' enum column in the 'invoices' table.
 * New categories: home, electronics, clothing, entertainment, transport, health, education, pets
 */
import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251203_000050',
  description: 'Update invoice categories enum',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Updating invoice categories...');

    // Update the enum column with new elements
    // Note: Appwrite allows updating enum elements via updateEnumAttribute (or similar depending on SDK version)
    // Since node-appwrite SDK might vary, we'll try to update the attribute.
    // If the SDK method is strictly `updateEnumAttribute`, we use that.

    // Based on common Appwrite migration patterns, we often need to fetch the current attribute first
    // or just overwrite the elements list.

    try {
      await databases.updateEnumColumn({
        databaseId,
        tableId: 'invoices',
        key: 'category',
        elements: [
          'pharmacy',
          'groceries',
          'supermarket',
          'restaurant',
          'fuel',
          'retail',
          'services',
          'home',
          'electronics',
          'clothing',
          'entertainment',
          'transport',
          'health',
          'education',
          'pets',
          'other',
        ],
        required: false,
        xdefault: 'other',
      });

      // Wait a bit for the attribute to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('✅ Invoice categories updated successfully');
    } catch (error) {
      console.error('Error updating invoice categories:', error);
      throw error;
    }
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Reverting invoice categories...');

    // Revert to original categories
    // Note: This might fail if there are rows using the new categories
    try {
      await databases.updateEnumColumn({
        databaseId,
        tableId: 'invoices',
        key: 'category',
        elements: ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail', 'services', 'other'],
        required: false,
        xdefault: 'other',
      });

      console.log('✅ Invoice categories reverted successfully');
    } catch (error) {
      console.warn('Warning: Could not revert invoice categories (data might exist with new categories):', error);
    }
  },
};
