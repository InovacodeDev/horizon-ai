/**
 * Migration Registry
 * All migrations must be registered here in chronological order
 */
import { migration as createMigrationsTable } from './20250123_000001_create_migrations_table';
import { migration as createUsersTable } from './20250123_000002_create_users_table';
import { migration as createUserProfilesTable } from './20250123_000003_create_user_profiles_table';
import { migration as createUserPreferencesTable } from './20250123_000004_create_user_preferences_table';
import { migration as createUserSettingsTable } from './20250123_000005_create_user_settings_table';
import { migration as syncSchemaWithAppwriteSchema } from './20251022_000006_sync_schema_with_appwrite_schema';
import { migration as createTransactionsTable } from './20251022_000007_create_transactions_table';
import { migration as createAccountsTable } from './20251022_000008_create_accounts_table';
import { migration as createCreditCardsTable } from './20251022_000009_create_credit_cards_table';
import { migration as addAccountIdToTransactions } from './20251027_000010_add_account_id_to_transactions';
import { migration as addSyncedTransactionIdsToAccounts } from './20251027_000011_add_synced_transaction_ids_to_accounts';
import { migration as migrateAccountIdAndSyncBalances } from './20251027_000012_migrate_account_id_and_sync_balances';
import { migration as createInvestmentsTable } from './20251027_000013_create_investments_table';
import { migration as createCreditCardBillsTable } from './20251027_000014_create_credit_card_bills_table';
import { migration as expandTransactionsColumns } from './20251028_000015_expand_transactions_columns';
import { migration as addCreditCardIdToTransactions } from './20251029_000016_add_credit_card_id_to_transactions';
import { migration as addInstallmentColumnsToTransactions } from './20251029_000017_add_installment_columns_to_transactions';
import { migration as createCreditCardTransactionsTable } from './20251029_000018_create_credit_card_transactions_table';
import { migration as migrateCreditCardData } from './20251029_000019_migrate_credit_card_data';
import { migration as createTransferLogsTable } from './20251031_000020_create_transfer_logs_table';
import { migration as createInvoicesTable } from './20251105_000021_create_invoices_table';
import { migration as createInvoiceItemsTable } from './20251105_000022_create_invoice_items_table';
import { migration as createProductsTable } from './20251105_000023_create_products_table';
import { migration as createPriceHistoryTable } from './20251105_000024_create_price_history_table';
import { Migration } from './migration.interface';

/**
 * All migrations in order of execution
 * IMPORTANT: Never remove or reorder existing migrations
 * Always add new migrations at the end
 */
export const migrations: Migration[] = [
  createMigrationsTable,
  createUsersTable,
  createUserProfilesTable,
  createUserPreferencesTable,
  createUserSettingsTable,
  syncSchemaWithAppwriteSchema,
  createTransactionsTable,
  createAccountsTable,
  createCreditCardsTable,
  addAccountIdToTransactions,
  addSyncedTransactionIdsToAccounts,
  migrateAccountIdAndSyncBalances,
  createInvestmentsTable,
  createCreditCardBillsTable,
  expandTransactionsColumns,
  addCreditCardIdToTransactions,
  addInstallmentColumnsToTransactions,
  createCreditCardTransactionsTable,
  migrateCreditCardData,
  createTransferLogsTable,
  createInvoicesTable,
  createInvoiceItemsTable,
  createProductsTable,
  createPriceHistoryTable,
];
