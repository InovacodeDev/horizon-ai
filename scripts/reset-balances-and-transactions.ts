/**
 * Script para resetar saldos das contas e marcar transações como pending
 *
 * Este script:
 * 1. Reseta o saldo de todas as contas para 0
 * 2. Atualiza todas as transações para status = 'pending'
 * 3. Permite que a function balance-sync recalcule os saldos corretamente
 *
 * ATENÇÃO: Este script modifica dados. Use com cuidado!
 *
 * Uso:
 *   npx tsx scripts/reset-balances-and-transactions.ts [--dry-run]
 */
import { config } from 'dotenv';
import { Client, Query, TablesDB } from 'node-appwrite';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const ACCOUNTS_COLLECTION = 'accounts';
const TRANSACTIONS_COLLECTION = 'transactions';

if (!DATABASE_ID) {
  console.error('❌ Missing APPWRITE_DATABASE_ID or NEXT_PUBLIC_APPWRITE_DATABASE_ID in .env.local');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  console.error('❌ Missing NEXT_PUBLIC_APPWRITE_ENDPOINT in .env.local');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('❌ Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local');
  process.exit(1);
}

if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Missing APPWRITE_API_KEY in .env.local');
  console.error('   This is required for server-side operations.');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

async function resetBalancesAndTransactions() {
  console.log('🔄 Iniciando reset de saldos e transações...\n');
  
  if (dryRun) {
    console.log('🔒 DRY RUN MODE - Nenhuma alteração será feita\n');
  }

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const tablesDB = new TablesDB(client);

  try {
    // ========================================
    // PARTE 1: Resetar saldos das contas
    // ========================================
    console.log('📊 PARTE 1: Resetando saldos das contas\n');
    console.log(`   Using databaseId='${DATABASE_ID}' tableId='${ACCOUNTS_COLLECTION}'`);

    let accountsProcessed = 0;
    let accountsReset = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      console.log(`📦 Buscando contas (offset: ${offset})...`);

      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID!,
        tableId: ACCOUNTS_COLLECTION,
        queries: [Query.limit(limit), Query.offset(offset)],
      });

      const accounts = response.rows;

      if (accounts.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`   Encontradas ${accounts.length} contas`);

      // Filtrar contas que precisam ser resetadas
      const accountsToReset = accounts.filter((account) => {
        const currentBalance = Number(account.balance) || 0;
        return currentBalance !== 0;
      });

      accountsProcessed += accounts.length;

      if (accountsToReset.length > 0) {
        console.log(`   ${accountsToReset.length} contas precisam ser resetadas:`);
        
        for (const account of accountsToReset) {
          const currentBalance = Number(account.balance) || 0;
          console.log(`   • ${account.name} (${account.$id}): R$ ${currentBalance.toFixed(2)} -> R$ 0.00`);
        }

        if (!dryRun) {
          console.log(`   Atualizando ${accountsToReset.length} contas em bulk...`);
          
          // Atualizar em bulk usando queries para contas com saldo != 0
          await tablesDB.updateRows({
            databaseId: DATABASE_ID!,
            tableId: ACCOUNTS_COLLECTION,
            queries: [Query.notEqual('balance', 0)],
            data: { balance: 0 },
          });
          
          accountsReset += accountsToReset.length;
          console.log(`   ✅ Bulk update concluído`);
        }
      } else {
        console.log(`   ✓ Todas as contas já estão em R$ 0.00`);
      }

      offset += limit;
      
      // Se não há mais contas para processar, sair do loop
      if (accounts.length < limit) {
        hasMore = false;
      }
      
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log('\n📊 Resumo - Contas:');
    console.log(`   Total processadas: ${accountsProcessed}`);
    console.log(`   Resetadas: ${dryRun ? 0 : accountsReset}`);

    // ========================================
    // PARTE 2: Atualizar transações para pending
    // ========================================
    console.log('\n📊 PARTE 2: Atualizando transações para pending\n');
    console.log(`   Using databaseId='${DATABASE_ID}' tableId='${TRANSACTIONS_COLLECTION}'`);

    let transactionsProcessed = 0;
    let transactionsUpdated = 0;
    offset = 0;
    hasMore = true;

    while (hasMore) {
      console.log(`📦 Buscando transações (offset: ${offset})...`);

      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID!,
        tableId: TRANSACTIONS_COLLECTION,
        queries: [Query.limit(limit), Query.offset(offset)],
      });

      const transactions = response.rows;

      if (transactions.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`   Encontradas ${transactions.length} transações`);

      // Filtrar transações que não estão pending
      const transactionsToUpdate = transactions.filter((tx) => tx.status !== 'pending');

      transactionsProcessed += transactions.length;

      if (transactionsToUpdate.length > 0) {
        console.log(`   ${transactionsToUpdate.length} transações precisam ser atualizadas para pending`);

        if (!dryRun) {
          console.log(`   Atualizando transações em bulk...`);
          
          // Atualizar em bulk usando queries para status != pending
          await tablesDB.updateRows({
            databaseId: DATABASE_ID!,
            tableId: TRANSACTIONS_COLLECTION,
            queries: [Query.notEqual('status', 'pending')],
            data: { status: 'pending' },
          });
          
          transactionsUpdated += transactionsToUpdate.length;
          console.log(`   ✅ Bulk update concluído`);
        }
      } else {
        console.log(`   ✓ Todas as transações já estão com status pending`);
      }

      offset += limit;
      
      // Se não há mais transações para processar, sair do loop
      if (transactions.length < limit) {
        hasMore = false;
      }
      
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log('\n📊 Resumo - Transações:');
    console.log(`   Total processadas: ${transactionsProcessed}`);
    console.log(`   Atualizadas para pending: ${dryRun ? 0 : transactionsUpdated}`);

    if (dryRun) {
      console.log('\n🔒 Dry run concluído. Nenhuma alteração foi feita.');
      console.log("   Execute sem '--dry-run' para aplicar as alterações.");
    } else {
      console.log('\n✅ Reset concluído com sucesso!');
      console.log('\n💡 Próximos passos:');
      console.log('   1. A function balance-sync processará automaticamente as transações pending');
      console.log('   2. Os saldos serão recalculados conforme as transações forem processadas');
      console.log('   3. Você pode monitorar o progresso nos logs da function');
    }
  } catch (error: any) {
    console.error('\n❌ Erro durante o reset:', error?.message || error);
    console.error(error);
    process.exit(1);
  }
}

resetBalancesAndTransactions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
