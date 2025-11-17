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
import { migration as createInvoicesTable } from './20251105_000021_create_invoices_table';
import { migration as createInvoiceItemsTable } from './20251105_000022_create_invoice_items_table';
import { migration as createProductsTable } from './20251105_000023_create_products_table';
import { migration as createPriceHistoryTable } from './20251105_000024_create_price_history_table';
import { migration as addValeAccountType } from './20251106_000025_add_vale_account_type';
import { migration as createSharingInvitationTable } from './20251111_000026_create_sharing_invitations_table';
import { migration as createSharingAuditLogsTable } from './20251111_000027_create_sharing_audit_logs_table';
import { migration as createSharingRelationshipsTable } from './20251111_000028_create_sharing_relationships_table';
import { migration as dropTransferLogsTable } from './20251111_000029_drop_transfer_logs_table';
import { migration as expandInvestmentsDataColumn } from './20251111_000030_expand_investments_data_column';
import { migration as expandCreditCardsDataColumn } from './20251111_000031_expand_credit_cards_data_column';
import { migration as expandInvoicesDataColumn } from './20251111_000032_expand_invoices_data_column';
import { migration as expandAccountsDataColumn } from './20251111_000033_expand_accounts_data_column';
import { migration as expandTransactionsDataColumn } from './20251111_000034_expand_transactions_data_column';
import { migration as addDirectionToTransactions } from './20251111_000035_add_direction_to_transactions';
import { migration as populateDirectionColumn } from './20251111_000036_populate_direction_column';
import { migration as removeProductsStatsColumns } from './20251114_000037_remove_products_stats_columns';
import { migration as createShoppingListsTable } from './20251114_000038_create_shopping_lists_table';
import { migration as createShoppingListItemsTable } from './20251114_000039_create_shopping_list_items_table';
import { migration as createShoppingListRequestsTable } from './20251114_000040_create_shopping_list_requests_table';
import { migration as createNotificationsTable } from './20251114_000041_create_notifications_table';
import { migration as addBrandPromotionToProducts } from './20251115_000042_add_brand_promotion_to_products';
import { migration as removeProductCodes } from './20251116_000043_remove_product_codes';
import { migration as addSyncStatusToCreditCardTransactions } from './20251117_000044_add_sync_status_to_credit_card_transactions';
import { migration as deleteCreditCardBillsTable } from './20251117_000045_delete_credit_card_bills_table';
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
  createInvoicesTable,
  createInvoiceItemsTable,
  createProductsTable,
  createPriceHistoryTable,
  addValeAccountType,
  createSharingInvitationTable,
  createSharingAuditLogsTable,
  createSharingRelationshipsTable,
  dropTransferLogsTable,
  expandInvestmentsDataColumn,
  expandCreditCardsDataColumn,
  expandInvoicesDataColumn,
  expandAccountsDataColumn,
  expandTransactionsDataColumn,
  addDirectionToTransactions,
  populateDirectionColumn,
  removeProductsStatsColumns,
  createShoppingListsTable,
  createShoppingListItemsTable,
  createShoppingListRequestsTable,
  createNotificationsTable,
  addBrandPromotionToProducts,
  removeProductCodes,
  addSyncStatusToCreditCardTransactions,
  deleteCreditCardBillsTable,
];
