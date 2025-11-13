/**
 * Appwrite Function: Balance Sync
 *
 * Esta função gerencia automaticamente o saldo das contas baseado nas transações.
 *
 * Triggers:
 * - Eventos de database: transactions.*.create, transactions.*.update, transactions.*.delete
 * - Schedule: Diariamente às 20:00 (cron: 0 20 * * *)
 * - Manual: Execução manual via console ou API
 *
 * Funcionalidades:
 * 1. Sincroniza saldo quando transações são criadas/editadas/removidas
 * 2. Processa transações futuras que chegaram na data de hoje (execução diária)
 * 3. Reprocessa todas as transações quando recebe { reprocessAll: true } no body
 * 4. Ignora transações futuras no cálculo do saldo
 * 5. Ignora transações de cartão de crédito (gerenciadas separadamente)
 *
 * Execução Manual:
 * - Processamento normal: { "userId": "user-id" }
 * - Reprocessamento completo: { "userId": "user-id", "reprocessAll": true }
 */
import { Client, Query, TablesDB } from 'node-appwrite';
// Configuração
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const COLLECTIONS = {
    TRANSACTIONS: 'transactions',
    ACCOUNTS: 'accounts',
};
/**
 * Inicializa o cliente Appwrite
 */
function initializeClient() {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_API_KEY || '');
    const databases = new TablesDB(client);
    return { client, databases };
}
/**
 * Busca todas as transações de uma conta com paginação
 */
async function getAllTransactions(databases, accountId) {
    const allTransactions = [];
    let offset = 0;
    const limit = 500;
    while (true) {
        const result = await databases.listRows({
            databaseId: DATABASE_ID,
            tableId: COLLECTIONS.TRANSACTIONS,
            queries: [
                Query.equal('account_id', accountId),
                Query.limit(limit),
                Query.offset(offset),
                Query.orderDesc('date'),
            ],
        });
        const transactions = result.rows;
        allTransactions.push(...transactions);
        if (transactions.length === 0 || transactions.length < limit) {
            break;
        }
        offset += limit;
    }
    return allTransactions;
}
/**
 * Sincroniza o saldo de uma conta
 * @param databases - Cliente TablesDB
 * @param accountId - ID da conta
 * @param deletedTransactionId - ID da transação deletada (opcional)
 * @param forceReprocess - Se true, reprocessa até transações já completadas
 */
async function syncAccountBalance(databases, accountId, deletedTransactionId, forceReprocess = false) {
    console.log(`[BalanceSync] Syncing account ${accountId}`);
    if (forceReprocess) {
        console.log(`[BalanceSync] - Force reprocess mode: will reprocess ALL transactions including completed ones`);
    }
    try {
        // Buscar todas as transações desta conta
        const transactions = await getAllTransactions(databases, accountId);
        // Recalcular balance do zero
        let newBalance = 0;
        const now = new Date();
        now.setHours(23, 59, 59, 999); // Fim do dia atual
        console.log(`[BalanceSync] - Total transactions: ${transactions.length}`);
        console.log(`[BalanceSync] - Current date: ${now.toISOString()}`);
        const processedTransactions = [];
        const transactionsToMarkCompleted = [];
        for (const transaction of transactions) {
            // Ignorar transações de cartão de crédito
            if (transaction.credit_card_id) {
                console.log(`[BalanceSync] - Skipping credit card transaction: ${transaction.$id}`);
                continue;
            }
            // Ignorar transações futuras
            const transactionDate = new Date(transaction.date);
            if (transactionDate > now) {
                console.log(`[BalanceSync] - Skipping future transaction: ${transaction.$id} (${transactionDate.toISOString()})`);
                continue;
            }
            // Se NÃO for force reprocess, ignorar transações já completadas (exceto se for a transação deletada)
            if (!forceReprocess && transaction.status === 'completed' && transaction.$id !== deletedTransactionId) {
                console.log(`[BalanceSync] - Skipping completed transaction: ${transaction.$id}`);
                // Ainda incluir no cálculo do saldo
                if (transaction.direction === 'in') {
                    newBalance += transaction.amount;
                }
                else {
                    newBalance -= transaction.amount;
                }
                processedTransactions.push(transaction.$id);
                continue;
            }
            // Processar cada tipo de transação
            if (transaction.direction === 'in') {
                newBalance += transaction.amount;
                console.log(`[BalanceSync] - Adding ${transaction.amount} from transaction ${transaction.$id} (direction: in, status: ${transaction.status})`);
            }
            else {
                newBalance -= transaction.amount;
                console.log(`[BalanceSync] - Subtracting ${transaction.amount} from transaction ${transaction.$id} (direction: out, status: ${transaction.status})`);
            }
            processedTransactions.push(transaction.$id);
            // Marcar para atualizar status para completed (se não for a transação deletada)
            if (transaction.status !== 'completed' && transaction.$id !== deletedTransactionId) {
                transactionsToMarkCompleted.push(transaction.$id);
            }
        }
        console.log(`[BalanceSync] - Final balance: ${newBalance}`);
        console.log(`[BalanceSync] - Processed ${processedTransactions.length} transactions`);
        console.log(`[BalanceSync] - Marking ${transactionsToMarkCompleted.length} transactions as completed`);
        // Atualizar status das transações para completed em lotes
        const batchSize = 10;
        for (let i = 0; i < transactionsToMarkCompleted.length; i += batchSize) {
            const batch = transactionsToMarkCompleted.slice(i, i + batchSize);
            await Promise.all(batch.map(async (transactionId) => {
                try {
                    await databases.updateRow({
                        databaseId: DATABASE_ID,
                        tableId: COLLECTIONS.TRANSACTIONS,
                        rowId: transactionId,
                        data: {
                            status: 'completed',
                        },
                    });
                    console.log(`[BalanceSync] - Marked transaction ${transactionId} as completed`);
                }
                catch (error) {
                    console.error(`[BalanceSync] - Error marking transaction ${transactionId} as completed:`, error);
                }
            }));
            // Pequeno delay entre lotes (100ms)
            if (i + batchSize < transactionsToMarkCompleted.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
        // Atualizar conta com novo balance
        await databases.updateRow({
            databaseId: DATABASE_ID,
            tableId: COLLECTIONS.ACCOUNTS,
            rowId: accountId,
            data: {
                balance: newBalance,
                synced_transaction_ids: JSON.stringify(processedTransactions),
                updated_at: new Date().toISOString(),
            },
        });
        console.log(`[BalanceSync] Account ${accountId} updated successfully with balance: ${newBalance}`);
        return newBalance;
    }
    catch (error) {
        console.error(`[BalanceSync] Error syncing account ${accountId}:`, error);
        throw error;
    }
}
/**
 * Processa transações futuras que chegaram na data de hoje
 */
async function processDueTransactions(databases, userId) {
    console.log(`[BalanceSync] Processing due transactions for user ${userId}`);
    // Buscar todas as transações do usuário com paginação
    const allTransactions = [];
    let offset = 0;
    const limit = 500;
    while (true) {
        const result = await databases.listRows({
            databaseId: DATABASE_ID,
            tableId: COLLECTIONS.TRANSACTIONS,
            queries: [Query.equal('user_id', userId), Query.limit(limit), Query.offset(offset)],
        });
        const transactions = result.rows;
        allTransactions.push(...transactions);
        if (transactions.length === 0 || transactions.length < limit) {
            break;
        }
        offset += limit;
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Identificar transações que eram futuras mas agora são de hoje ou passado
    const dueTransactions = allTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        return transactionDay <= today;
    });
    if (dueTransactions.length === 0) {
        console.log('[BalanceSync] No due transactions found');
        return 0;
    }
    // Agrupar por conta
    const accountIds = new Set();
    for (const transaction of dueTransactions) {
        if (transaction.account_id && !transaction.credit_card_id) {
            accountIds.add(transaction.account_id);
        }
    }
    console.log(`[BalanceSync] Found ${accountIds.size} accounts to update`);
    // Recalcular saldo de cada conta afetada com pequeno delay entre cada uma
    let processed = 0;
    for (const accountId of accountIds) {
        try {
            await syncAccountBalance(databases, accountId);
            processed++;
            // Pequeno delay para evitar sobrecarga (50ms)
            if (processed < accountIds.size) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }
        catch (error) {
            console.error(`[BalanceSync] Error syncing account ${accountId}:`, error);
            // Continuar com as próximas contas mesmo se uma falhar
        }
    }
    return processed;
}
/**
 * Processa todos os usuários (para execução agendada)
 */
async function processAllUsers(databases) {
    console.log('[BalanceSync] Processing all users (scheduled execution)');
    // Buscar todas as contas
    let offset = 0;
    const limit = 50; // Reduzido para processar em lotes menores
    const processedUsers = new Set();
    while (true) {
        const result = await databases.listRows({
            databaseId: DATABASE_ID,
            tableId: COLLECTIONS.ACCOUNTS,
            queries: [Query.limit(limit), Query.offset(offset)],
        });
        const accounts = result.rows;
        if (accounts.length === 0) {
            break;
        }
        // Processar cada usuário único
        for (const account of accounts) {
            if (!processedUsers.has(account.user_id)) {
                processedUsers.add(account.user_id);
                try {
                    await processDueTransactions(databases, account.user_id);
                    // Pequeno delay entre usuários (100ms)
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`[BalanceSync] Error processing user ${account.user_id}:`, error);
                    // Continuar com os próximos usuários mesmo se um falhar
                }
            }
        }
        if (accounts.length < limit) {
            break;
        }
        offset += limit;
        // Delay entre lotes (200ms)
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    console.log(`[BalanceSync] Processed ${processedUsers.size} users`);
}
/**
 * Função principal
 */
export default async ({ req, res, log, error }) => {
    // Para execuções longas, retornar resposta imediatamente e processar de forma assíncrona
    const isAsync = req.headers['x-appwrite-trigger'] === 'schedule' || req.headers['x-appwrite-trigger'] === 'event';
    if (isAsync) {
        // Responder imediatamente para evitar timeout
        res.json({
            success: true,
            message: 'Balance sync started asynchronously',
            timestamp: new Date().toISOString(),
        });
    }
    try {
        log('Balance Sync Function started');
        log(`Request method: ${req.method}`);
        log(`Request headers: ${JSON.stringify(req.headers)}`);
        log(`Request body (raw): ${req.bodyRaw}`);
        log(`Request body (parsed): ${JSON.stringify(req.body)}`);
        const { client, databases } = initializeClient();
        // Verificar o tipo de execução
        const executionType = req.headers['x-appwrite-trigger'] || 'manual';
        log(`Execution type: ${executionType}`);
        // Execução agendada (cron)
        if (executionType === 'schedule') {
            log('Running scheduled balance sync (processing due transactions)');
            await processAllUsers(databases);
            log('Scheduled balance sync completed successfully');
            return; // Resposta já foi enviada no início
        }
        // Execução por evento de database
        if (executionType === 'event') {
            const eventData = req.body;
            const eventType = req.headers['x-appwrite-event'] || '';
            log(`Processing database event: ${eventType}`);
            log(`Event data: ${JSON.stringify(eventData)}`);
            // Extrair dados da transação do evento
            const transaction = eventData;
            // Log detalhado para debug
            log(`Transaction ID: ${transaction.$id}`);
            log(`Account ID: ${transaction.account_id}`);
            log(`Credit Card ID: ${transaction.credit_card_id}`);
            log(`Amount: ${transaction.amount}`);
            log(`Direction: ${transaction.direction}`);
            log(`Date: ${transaction.date}`);
            log(`Status: ${transaction.status}`);
            if (!transaction.account_id) {
                log('Transaction has no account_id, skipping');
                return res.json({
                    success: true,
                    message: 'Transaction has no account, skipped',
                });
            }
            if (transaction.credit_card_id) {
                log('Transaction is for credit card, skipping');
                return res.json({
                    success: true,
                    message: 'Credit card transaction, skipped',
                });
            }
            // Detectar se é um evento de delete
            const isDeleteEvent = eventType.includes('.delete');
            const deletedTransactionId = isDeleteEvent ? transaction.$id : undefined;
            // Sincronizar saldo da conta
            log(`Starting balance sync for account: ${transaction.account_id}`);
            log(`Is delete event: ${isDeleteEvent}`);
            const newBalance = await syncAccountBalance(databases, transaction.account_id, deletedTransactionId);
            log(`Balance sync completed. New balance: ${newBalance}`);
            log(`Event processing completed successfully`);
            return; // Resposta já foi enviada no início
        }
        // Execução manual
        log('Running manual balance sync');
        log(`Request body: ${JSON.stringify(req.body)}`);
        log(`Request body type: ${typeof req.body}`);
        // Parse do body se vier como string
        let bodyData = req.body;
        if (typeof req.body === 'string') {
            try {
                bodyData = JSON.parse(req.body);
                log(`Body parsed successfully: ${JSON.stringify(bodyData)}`);
            }
            catch (e) {
                log(`Failed to parse body: ${e}`);
            }
        }
        const userId = bodyData?.userId;
        const reprocessAll = bodyData?.reprocessAll === true || bodyData?.reprocessAll === 'true';
        log(`Extracted userId: ${userId}`);
        log(`userId type: ${typeof userId}`);
        log(`reprocessAll: ${reprocessAll}`);
        if (!userId) {
            log('ERROR: userId is missing or undefined');
            return res.json({
                success: false,
                error: 'userId is required for manual execution',
                debug: {
                    body: req.body,
                    bodyData: bodyData,
                    bodyType: typeof req.body,
                },
            }, 400);
        }
        let accountsProcessed = 0;
        // Se reprocessAll for true, reprocessar todas as contas do usuário
        if (reprocessAll) {
            log('Reprocessing ALL transactions for all user accounts (including completed transactions)');
            // Buscar todas as contas do usuário
            const accountsResult = await databases.listRows({
                databaseId: DATABASE_ID,
                tableId: COLLECTIONS.ACCOUNTS,
                queries: [Query.equal('user_id', userId)],
            });
            const accounts = accountsResult.rows;
            log(`Found ${accounts.length} accounts to reprocess`);
            // Reprocessar cada conta com forceReprocess = true
            for (const account of accounts) {
                try {
                    log(`Reprocessing account: ${account.$id}`);
                    await syncAccountBalance(databases, account.$id, undefined, true);
                    accountsProcessed++;
                    // Pequeno delay entre contas (50ms)
                    if (accountsProcessed < accounts.length) {
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                }
                catch (err) {
                    error(`Error reprocessing account ${account.$id}:`, err);
                    // Continuar com as próximas contas mesmo se uma falhar
                }
            }
            log(`Reprocessing completed. Total accounts processed: ${accountsProcessed}`);
        }
        else {
            // Comportamento padrão: processar apenas transações vencidas
            accountsProcessed = await processDueTransactions(databases, userId);
            log(`Manual balance sync completed. Accounts processed: ${accountsProcessed}`);
        }
        // Se não for assíncrono, retornar resposta normal
        if (!isAsync) {
            return res.json({
                success: true,
                message: reprocessAll ? 'All transactions reprocessed successfully' : 'Manual balance sync completed',
                accountsProcessed,
                reprocessAll,
            });
        }
    }
    catch (err) {
        error('Balance Sync Function error:', err);
        // Se não for assíncrono, retornar erro
        if (!isAsync) {
            return res.json({
                success: false,
                error: err.message || 'Unknown error',
            }, 500);
        }
    }
};
//# sourceMappingURL=index.js.map