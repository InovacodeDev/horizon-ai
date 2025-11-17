/**
 * Appwrite Function: Shopping List Processor
 *
 * Processes async queue for AI shopping list generation
 *
 * Triggers:
 * - Scheduled: Every 1 minute (cron: "* * * * *")
 * - Manual: Can be triggered manually via Appwrite Console
 *
 * Logic:
 * 1. Query shopping_list_requests where status='pending'
 * 2. Process each request:
 *    - Update status to 'generating'
 *    - Fetch user's invoice history for the category
 *    - Call Google AI service to generate list
 *    - Create shopping_list and shopping_list_items
 *    - Update request status to 'completed' with shopping_list_id
 *    - Create notification for user
 * 3. On error:
 *    - Update request status to 'error' with error_message
 *    - Create error notification for user
 */
import { Client, ID, Query, TablesDB } from 'node-appwrite';

// Types
interface ShoppingListRequest {
  $id: string;
  user_id: string;
  category: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  historical_months: number;
  shopping_list_id?: string;
  error_message?: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface Invoice {
  $id: string;
  merchant_name: string;
  issue_date: string;
  total_amount: number;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface AIShoppingListItem {
  product_name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  category?: string;
  subcategory?: string;
  ai_confidence: number;
  ai_reasoning: string;
}

// Configuration
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const COLLECTIONS = {
  SHOPPING_LIST_REQUESTS: 'shopping_list_requests',
  SHOPPING_LISTS: 'shopping_lists',
  SHOPPING_LIST_ITEMS: 'shopping_list_items',
  NOTIFICATIONS: 'notifications',
  INVOICES: 'invoices',
  INVOICE_ITEMS: 'invoice_items',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Maximum requests to process per execution (to avoid timeouts)
const MAX_REQUESTS_PER_RUN = 3;

/**
 * Initialize Appwrite client
 */
function initializeClient(): TablesDB {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  return new TablesDB(client);
}

/**
 * Fetch pending shopping list requests
 */
async function fetchPendingRequests(databases: TablesDB): Promise<ShoppingListRequest[]> {
  const response = await databases.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.SHOPPING_LIST_REQUESTS,
    queries: [Query.equal('status', 'pending'), Query.orderAsc('created_at'), Query.limit(MAX_REQUESTS_PER_RUN)],
  });

  return response.rows as unknown as ShoppingListRequest[];
}

/**
 * Update request status
 */
async function updateRequestStatus(
  databases: TablesDB,
  requestId: string,
  status: 'generating' | 'completed' | 'error',
  options?: { shopping_list_id?: string; error_message?: string },
): Promise<void> {
  const data: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed' && options?.shopping_list_id) {
    data.shopping_list_id = options.shopping_list_id;
    data.completed_at = new Date().toISOString();
  }

  if (status === 'error' && options?.error_message) {
    data.error_message = options.error_message.substring(0, 1000); // Truncate to fit column
    data.completed_at = new Date().toISOString();
  }

  await databases.updateRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.SHOPPING_LIST_REQUESTS,
    rowId: requestId,
    data,
  });
}

/**
 * Fetch user's invoice history for category
 */
async function fetchInvoiceHistory(
  databases: TablesDB,
  userId: string,
  category: string,
  historicalMonths: number,
): Promise<Invoice[]> {
  // Calculate date cutoff
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - historicalMonths);
  const cutoffISOString = cutoffDate.toISOString();

  // Fetch invoices
  const invoicesResponse = await databases.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.INVOICES,
    queries: [
      Query.equal('user_id', userId),
      Query.equal('category', category),
      Query.greaterThanEqual('issue_date', cutoffISOString),
      Query.orderDesc('issue_date'),
      Query.limit(100), // Limit to avoid excessive data
    ],
  });

  const invoices: Invoice[] = [];

  // Fetch items for each invoice
  for (const invoice of invoicesResponse.rows) {
    const itemsResponse = await databases.listRows({
      databaseId: DATABASE_ID,
      tableId: COLLECTIONS.INVOICE_ITEMS,
      queries: [Query.equal('invoice_id', invoice.$id), Query.limit(100)],
    });

    invoices.push({
      $id: invoice.$id as string,
      merchant_name: invoice.merchant_name as string,
      issue_date: invoice.issue_date as string,
      total_amount: invoice.total_amount as number,
      items: (itemsResponse.rows as any[]).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
    });
  }

  return invoices;
}

/**
 * Generate AI shopping list using Google Gemini
 * (Simplified version - production should use the full service)
 */
async function generateAIShoppingList(invoiceHistory: Invoice[], category: string): Promise<AIShoppingListItem[]> {
  // This is a simplified implementation
  // In production, you would replicate the full GoogleAIService logic here
  // or import it from a shared module

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  if (invoiceHistory.length === 0) {
    throw new Error('No invoice history found');
  }

  // Aggregate products (same logic as GoogleAIService)
  const aggregatedProducts = new Map<
    string,
    {
      name: string;
      totalQuantity: number;
      totalSpent: number;
      purchaseCount: number;
      avgUnitPrice: number;
      lastPurchaseDate: string;
      purchaseDates: string[];
      avgDaysBetweenPurchases: number;
      avgQuantityPerPurchase: number;
      daysSinceLastPurchase: number;
    }
  >();

  const now = new Date();

  invoiceHistory.forEach((invoice) => {
    invoice.items.forEach((item) => {
      const key = item.description.toLowerCase().trim();
      const existing = aggregatedProducts.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalSpent += item.total_price;
        existing.purchaseCount++;
        existing.avgUnitPrice = existing.totalSpent / existing.totalQuantity;
        existing.purchaseDates.push(invoice.issue_date);
        if (invoice.issue_date > existing.lastPurchaseDate) {
          existing.lastPurchaseDate = invoice.issue_date;
        }
      } else {
        aggregatedProducts.set(key, {
          name: item.description,
          totalQuantity: item.quantity,
          totalSpent: item.total_price,
          purchaseCount: 1,
          avgUnitPrice: item.unit_price,
          lastPurchaseDate: invoice.issue_date,
          purchaseDates: [invoice.issue_date],
          avgDaysBetweenPurchases: 0,
          avgQuantityPerPurchase: item.quantity,
          daysSinceLastPurchase: 0,
        });
      }
    });
  });

  // Calculate consumption patterns
  aggregatedProducts.forEach((product) => {
    product.avgQuantityPerPurchase = product.totalQuantity / product.purchaseCount;

    const lastPurchase = new Date(product.lastPurchaseDate);
    product.daysSinceLastPurchase = Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

    if (product.purchaseDates.length > 1) {
      const sortedDates = product.purchaseDates.map((d) => new Date(d).getTime()).sort();
      const intervals: number[] = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const daysDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
        intervals.push(daysDiff);
      }
      product.avgDaysBetweenPurchases = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    } else {
      product.avgDaysBetweenPurchases = product.daysSinceLastPurchase;
    }
  });

  const simplifiedHistory = Array.from(aggregatedProducts.values()).map((product) => ({
    product: product.name,
    total_qty: product.totalQuantity,
    avg_price: product.avgUnitPrice,
    times_purchased: product.purchaseCount,
    last_purchase: product.lastPurchaseDate,
    purchase_dates: product.purchaseDates.slice(-5),
    avg_days_between: Math.round(product.avgDaysBetweenPurchases),
    avg_qty_per_purchase: product.avgQuantityPerPurchase,
    days_since_last: product.daysSinceLastPurchase,
  }));

  // Format for AI (TOON format simulation)
  const historyText = simplifiedHistory
    .map(
      (p, i) =>
        `${i + 1}. ${p.product} | qty=${p.total_qty} | price=${p.avg_price.toFixed(2)} | purchased=${p.times_purchased}x | last=${p.last_purchase} | days_between=${p.avg_days_between} | avg_qty=${p.avg_qty_per_purchase.toFixed(1)} | days_since=${p.days_since_last}`,
    )
    .join('\n');

  const prompt = `
You are an AI shopping assistant that analyzes purchase history to predict future shopping needs using consumption pattern analysis.

TASK: Generate an intelligent shopping list based on CONSUMPTION PATTERNS, not just summing quantities.

CONSUMPTION PATTERN ANALYSIS:
1. **Purchase Frequency**: Use "avg_days_between" to understand how often the product is bought
2. **Time Since Last Purchase**: Use "days_since_last" to determine urgency
3. **Consumption Rate**: Calculate daily consumption = avg_qty_per_purchase / avg_days_between
4. **Replenishment Logic**: 
   - If days_since_last ≥ avg_days_between * 0.8: SUGGEST (80% of typical cycle passed)
   - Suggested quantity = avg_qty_per_purchase (rounded to nearest integer)
   - If days_since_last < avg_days_between * 0.5: SKIP (still have supply)

QUANTITY CALCULATION RULES:
1. Base quantity = avg_qty_per_purchase (NOT total_qty!)
2. Round to nearest integer (use Math.round)
3. Never suggest more than 2x avg_qty_per_purchase (avoid over-buying)

IMPORTANT:
- Return quantities as INTEGER numbers (1, 2, 3, not 1.5)
- Use simple units: "unidades", "kg", "litros", "pacotes"
- Only suggest products that match category: "${category}"
- Filter OUT products where days_since_last < avg_days_between * 0.5

RESPONSE FORMAT: Return valid JSON array:
[
  {
    "product_name": "Product Name",
    "quantity": 12,
    "unit": "unidades",
    "estimated_price": 4.50,
    "category": "Category",
    "subcategory": "Subcategory",
    "ai_confidence": 0.95,
    "ai_reasoning": "Compra a cada X dias. Última compra há Y dias (Z% do ciclo). Sugerindo N unidades para os próximos X dias."
  }
]

HISTORICAL DATA:
${historyText}
`;

  // Call Google Gemini API
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty response from Google AI');
  }

  const items = JSON.parse(text);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Invalid AI response format');
  }

  // Sanitize items
  return items.map((item) => ({
    product_name: item.product_name?.trim() || 'Unknown Product',
    quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
    unit: item.unit || 'unidades',
    estimated_price: Number(item.estimated_price) || 0,
    category: item.category || '',
    subcategory: item.subcategory || '',
    ai_confidence: Math.min(1, Math.max(0, Number(item.ai_confidence) || 0.5)),
    ai_reasoning: item.ai_reasoning || 'Baseado no histórico de compras',
  }));
}

/**
 * Create shopping list and items
 * Implements manual rollback if item creation fails
 */
async function createShoppingList(
  databases: TablesDB,
  userId: string,
  category: string,
  items: AIShoppingListItem[],
): Promise<string> {
  // Calculate estimated total
  const estimatedTotal = items.reduce((sum, item) => sum + item.quantity * item.estimated_price, 0);

  let listId: string | null = null;
  const createdItemIds: string[] = [];

  try {
    // Create shopping list
    const list = await databases.createRow({
      databaseId: DATABASE_ID,
      tableId: COLLECTIONS.SHOPPING_LISTS,
      rowId: ID.unique(),
      data: {
        user_id: userId,
        title: `Lista Inteligente - ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        category,
        generated_by_ai: true,
        estimated_total: estimatedTotal,
        completed: false,
        metadata: JSON.stringify({ items_count: items.length }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    listId = list.$id as string;

    // Create shopping list items
    for (const item of items) {
      const createdItem = await databases.createRow({
        databaseId: DATABASE_ID,
        tableId: COLLECTIONS.SHOPPING_LIST_ITEMS,
        rowId: ID.unique(),
        data: {
          shopping_list_id: listId,
          user_id: userId,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          estimated_price: item.estimated_price,
          category: item.category || '',
          subcategory: item.subcategory || '',
          checked: false,
          ai_confidence: item.ai_confidence,
          ai_reasoning: item.ai_reasoning,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      createdItemIds.push(createdItem.$id as string);
    }

    return listId;
  } catch (error) {
    // Rollback: delete all created items and the list
    console.error('Error creating shopping list, performing rollback...');

    // Delete created items
    for (const itemId of createdItemIds) {
      try {
        await databases.deleteRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTIONS.SHOPPING_LIST_ITEMS,
          rowId: itemId,
        });
      } catch (deleteError) {
        console.error(`Failed to delete item ${itemId} during rollback:`, deleteError);
      }
    }

    // Delete the list if it was created
    if (listId) {
      try {
        await databases.deleteRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTIONS.SHOPPING_LISTS,
          rowId: listId,
        });
      } catch (deleteError) {
        console.error(`Failed to delete list ${listId} during rollback:`, deleteError);
      }
    }

    throw error;
  }
}

/**
 * Create notification
 */
async function createNotification(
  databases: TablesDB,
  userId: string,
  type: 'shopping_list_completed' | 'shopping_list_error',
  title: string,
  message: string,
  actionUrl?: string,
  relatedId?: string,
): Promise<void> {
  await databases.createRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.NOTIFICATIONS,
    rowId: ID.unique(),
    data: {
      user_id: userId,
      type,
      title,
      message,
      read: false,
      action_url: actionUrl || '',
      related_id: relatedId || '',
      created_at: new Date().toISOString(),
    },
  });
}

/**
 * Process a single shopping list request
 */
async function processRequest(databases: TablesDB, request: ShoppingListRequest): Promise<void> {
  console.log(`Processing request ${request.$id} for user ${request.user_id}, category ${request.category}`);

  try {
    // Update status to generating
    await updateRequestStatus(databases, request.$id, 'generating');

    // Fetch invoice history
    console.log(`Fetching invoice history: ${request.historical_months} months`);
    const invoiceHistory = await fetchInvoiceHistory(
      databases,
      request.user_id,
      request.category,
      request.historical_months,
    );

    if (invoiceHistory.length === 0) {
      throw new Error('Nenhum histórico de compras encontrado para esta categoria');
    }

    console.log(`Found ${invoiceHistory.length} invoices`);

    // Generate AI shopping list
    console.log('Generating AI shopping list');
    const items = await generateAIShoppingList(invoiceHistory, request.category);

    console.log(`Generated ${items.length} items`);

    // Create shopping list
    const shoppingListId = await createShoppingList(databases, request.user_id, request.category, items);

    console.log(`Created shopping list ${shoppingListId}`);

    // Update request status to completed
    await updateRequestStatus(databases, request.$id, 'completed', { shopping_list_id: shoppingListId });

    // Create success notification
    await createNotification(
      databases,
      request.user_id,
      'shopping_list_completed',
      'Lista de Compras Pronta!',
      `Sua lista inteligente de ${request.category} foi gerada com ${items.length} itens.`,
      `/invoices/lists?id=${shoppingListId}`,
      shoppingListId,
    );

    console.log(`✓ Request ${request.$id} completed successfully`);
  } catch (error) {
    console.error(`✗ Request ${request.$id} failed:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update request status to error
    await updateRequestStatus(databases, request.$id, 'error', { error_message: errorMessage });

    // Create error notification
    await createNotification(
      databases,
      request.user_id,
      'shopping_list_error',
      'Erro ao Gerar Lista',
      `Não foi possível gerar sua lista de compras: ${errorMessage}`,
      undefined,
      request.$id,
    );
  }
}

/**
 * Main function entry point
 */
export default async ({ req, res, log, error }: any) => {
  log('🚀 Shopping List Processor started');

  try {
    const databases = initializeClient();

    // Fetch pending requests
    log('Fetching pending requests...');
    const pendingRequests = await fetchPendingRequests(databases);

    if (pendingRequests.length === 0) {
      log('✓ No pending requests found');
      return res.json({ success: true, processed: 0, message: 'No pending requests' });
    }

    log(`Found ${pendingRequests.length} pending request(s)`);

    // Process each request
    let processed = 0;
    let failed = 0;

    for (const request of pendingRequests) {
      try {
        await processRequest(databases, request);
        processed++;
      } catch (err) {
        failed++;
        error(`Failed to process request ${request.$id}:`, err);
      }
    }

    log(`✓ Processed ${processed} request(s), ${failed} failed`);

    return res.json({
      success: true,
      processed,
      failed,
      total: pendingRequests.length,
    });
  } catch (err) {
    error('Fatal error in shopping list processor:', err);
    return res.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
};
