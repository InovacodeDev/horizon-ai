import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, Invoice, InvoiceItem, Product } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { SharingService } from '@/lib/services/sharing.service';
import { UserService } from '@/lib/services/user.service';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

interface AggregatedProduct extends Product {
  total_purchases: number;
  average_price: number;
  last_purchase_date?: string;
  total_spent?: number;
}

const sharingService = new SharingService();
const userService = new UserService();

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get('category');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 500, 1000) : 500;

    const databases = getAppwriteDatabases();

    const sharingPrefs = await userService.getSharingPreferences(userId);
    const sharedContext = await sharingService.getSharedDataContext(userId);

    const accessibleUserIds = [userId];
    if (sharingPrefs.show_shared_data && sharedContext.hasActiveRelationship && sharedContext.linkedUserId) {
      accessibleUserIds.push(sharedContext.linkedUserId);
    }

    const invoiceItems = await listAllDocuments<InvoiceItem>(databases, COLLECTIONS.INVOICE_ITEMS, [
      Query.equal('user_id', accessibleUserIds),
    ]);

    if (invoiceItems.length === 0) {
      return NextResponse.json({ success: true, data: [], total: 0, includesSharedData: accessibleUserIds.length > 1 });
    }

    const productIds = Array.from(new Set(invoiceItems.map((item) => item.product_id)));
    const invoiceIds = Array.from(new Set(invoiceItems.map((item) => item.invoice_id)));

    const [products, invoices] = await Promise.all([
      fetchRowsByIds<Product>(databases, COLLECTIONS.PRODUCTS, productIds),
      fetchRowsByIds<Invoice>(databases, COLLECTIONS.INVOICES, invoiceIds),
    ]);

    const productById = new Map(products.map((product) => [product.$id, product]));
    const invoiceById = new Map(invoices.map((invoice) => [invoice.$id, invoice]));

    const statsByProduct = new Map<
      string,
      {
        invoiceRefs: Set<string>;
        totalSpent: number;
        totalQuantity: number;
        lastPurchaseDate?: string;
      }
    >();

    for (const item of invoiceItems) {
      const product = productById.get(item.product_id);
      if (!product) continue;

      const stats = statsByProduct.get(item.product_id) || {
        invoiceRefs: new Set<string>(),
        totalSpent: 0,
        totalQuantity: 0,
        lastPurchaseDate: undefined,
      };

      stats.invoiceRefs.add(item.invoice_id);
      stats.totalSpent += typeof item.total_price === 'number' ? item.total_price : item.unit_price * item.quantity;
      stats.totalQuantity += item.quantity || 0;

      const invoice = invoiceById.get(item.invoice_id);
      const purchaseDate = invoice?.issue_date || invoice?.created_at || item.created_at;
      if (!stats.lastPurchaseDate || (purchaseDate && purchaseDate > stats.lastPurchaseDate)) {
        stats.lastPurchaseDate = purchaseDate;
      }

      statsByProduct.set(item.product_id, stats);
    }

    const aggregated: AggregatedProduct[] = [];

    for (const [productId, stats] of statsByProduct.entries()) {
      const product = productById.get(productId);
      if (!product) continue;

      if (categoryFilter && product.category !== categoryFilter) {
        continue;
      }

      const averagePrice = stats.totalQuantity > 0 ? stats.totalSpent / stats.totalQuantity : 0;

      aggregated.push({
        ...product,
        total_purchases: stats.invoiceRefs.size,
        average_price: Number(averagePrice.toFixed(2)),
        last_purchase_date: stats.lastPurchaseDate,
        total_spent: Number(stats.totalSpent.toFixed(2)),
      });
    }

    aggregated.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

    return NextResponse.json({
      success: true,
      data: aggregated.slice(0, limit),
      total: aggregated.length,
      includesSharedData: accessibleUserIds.length > 1,
    });
  } catch (error: any) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch products',
      },
      { status: 500 },
    );
  }
}

async function listAllDocuments<T>(
  databases: ReturnType<typeof getAppwriteDatabases>,
  tableId: string,
  baseQueries: string[],
  batchSize: number = 500,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const queries = [...baseQueries, Query.limit(batchSize), Query.offset(offset)];
    const response = await databases.listDocuments(DATABASE_ID, tableId, queries);
    const documents = (response.documents || []) as T[];
    rows.push(...documents);

    if (documents.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  return rows;
}

async function fetchRowsByIds<T>(
  databases: ReturnType<typeof getAppwriteDatabases>,
  tableId: string,
  ids: string[],
  chunkSize: number = 100,
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows: T[] = [];

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const response = await databases.listDocuments(DATABASE_ID, tableId, [
      Query.equal('$id', chunk),
      Query.limit(chunk.length),
    ]);
    rows.push(...((response.documents || []) as T[]));
  }

  return rows;
}
