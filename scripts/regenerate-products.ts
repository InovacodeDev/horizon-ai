/**
 * Script para regenerar todos os produtos com base nas novas regras de normalização
 * 
 * Este script:
 * 1. Busca todos os invoice_items
 * 2. Remove todos os produtos existentes
 * 3. Regenera os produtos com base na nova normalização (com brand e is_promotion)
 * 4. Atualiza os invoice_items com as referências corretas aos novos produtos
 * 
 * ATENÇÃO: Este script é DESTRUTIVO! Ele remove todos os produtos existentes.
 * Execute apenas após backup do banco de dados.
 * 
 * Uso: pnpm tsx scripts/regenerate-products.ts
 */

import 'dotenv/config';
import { getAppwriteDatabases } from '../lib/appwrite/client';
import { DATABASE_ID } from '../lib/appwrite/schema';
import { productNormalizationService } from '../lib/services/product-normalization.service';
import { aiNormalizeProduct, aiNormalizeProductsBatch } from '../lib/services/product-normalization-ai.service';
import { Query } from 'node-appwrite';

interface InvoiceItem {
  $id: string;
  invoice_id: string;
  user_id: string;
  product_id?: string;
  description: string;
  product_code?: string;
  ncm_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

interface Invoice {
  $id: string;
  user_id: string;
  merchant_cnpj: string;
  merchant_name: string;
  issue_date: string;
}

interface Product {
  $id: string;
  user_id: string;
  name: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  is_promotion: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductMap {
  [key: string]: Product;
}

// Mapa de categorias com base no NCM e palavras-chave
function categorizeProduct(productName: string, ncmCode?: string): { category: string; subcategory?: string } {
  const lowerName = productName.toLowerCase();

  // Carnes e Proteínas
  if (
    lowerName.includes('carne') ||
    lowerName.includes('frango') ||
    lowerName.includes('peixe') ||
    lowerName.includes('ovo') ||
    lowerName.includes('bacon') ||
    lowerName.includes('linguica') ||
    lowerName.includes('salsicha') ||
    lowerName.includes('presunto') ||
    lowerName.includes('mortadela')
  ) {
    return { category: 'Alimentos', subcategory: 'Carnes e Proteínas' };
  }

  // Laticínios
  if (
    lowerName.includes('leite') ||
    lowerName.includes('queijo') ||
    lowerName.includes('iogurte') ||
    lowerName.includes('requeijao') ||
    lowerName.includes('manteiga') ||
    lowerName.includes('margarina')
  ) {
    return { category: 'Alimentos', subcategory: 'Laticínios' };
  }

  // Frutas e Vegetais
  if (
    lowerName.includes('alface') ||
    lowerName.includes('tomate') ||
    lowerName.includes('cebola') ||
    lowerName.includes('batata') ||
    lowerName.includes('cenoura') ||
    lowerName.includes('banana') ||
    lowerName.includes('maca') ||
    lowerName.includes('laranja')
  ) {
    return { category: 'Alimentos', subcategory: 'Frutas e Vegetais' };
  }

  // Bebidas
  if (
    lowerName.includes('refrigerante') ||
    lowerName.includes('suco') ||
    lowerName.includes('agua') ||
    lowerName.includes('cerveja') ||
    lowerName.includes('vinho') ||
    lowerName.includes('cafe') ||
    lowerName.includes('cha')
  ) {
    return { category: 'Bebidas' };
  }

  // Higiene Pessoal
  if (
    lowerName.includes('shampoo') ||
    lowerName.includes('sabonete') ||
    lowerName.includes('desodorante') ||
    lowerName.includes('pasta de dente') ||
    lowerName.includes('escova') ||
    lowerName.includes('fio dental')
  ) {
    return { category: 'Higiene Pessoal' };
  }

  // Limpeza
  if (
    lowerName.includes('detergente') ||
    lowerName.includes('amaciante') ||
    lowerName.includes('sabao') ||
    lowerName.includes('desinfetante') ||
    lowerName.includes('agua sanitaria') ||
    lowerName.includes('limpador')
  ) {
    return { category: 'Limpeza' };
  }

  // Mercearia
  if (
    lowerName.includes('arroz') ||
    lowerName.includes('feijao') ||
    lowerName.includes('macarrao') ||
    lowerName.includes('oleo') ||
    lowerName.includes('acucar') ||
    lowerName.includes('sal') ||
    lowerName.includes('farinha') ||
    lowerName.includes('biscoito')
  ) {
    return { category: 'Alimentos', subcategory: 'Mercearia' };
  }

  return { category: 'Outros' };
}

async function regenerateProducts() {
  console.log('🚀 Iniciando regeneração de produtos...\n');

  // Inicializar cliente Appwrite
  const databases = getAppwriteDatabases();

  try {
    // 1. Buscar todos os invoice_items
    console.log('📋 Buscando todos os invoice_items...');
    let allInvoiceItems: InvoiceItem[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await databases.listDocuments(DATABASE_ID, 'invoice_items', [
        Query.limit(limit),
        Query.offset(offset),
      ]);

      allInvoiceItems = allInvoiceItems.concat(response.documents as unknown as InvoiceItem[]);
      console.log(`  ↳ Carregados ${allInvoiceItems.length} invoice_items...`);

      hasMore = response.documents.length === limit;
      offset += limit;
    }

    console.log(`✅ Total de ${allInvoiceItems.length} invoice_items encontrados\n`);

    // 1.5. Carregar todas as invoices para obter informações do comerciante
    console.log('📋 Carregando invoices...');
    const invoicesMap = new Map<string, Invoice>();
    offset = 0;
    hasMore = true;

    while (hasMore) {
      const response = await databases.listDocuments(DATABASE_ID, 'invoices', [
        Query.orderDesc('issue_date'),
        Query.limit(limit),
        Query.offset(offset),
      ]);

      for (const invoice of response.documents as unknown as Invoice[]) {
        invoicesMap.set(invoice.$id, invoice);
      }

      console.log(`  ↳ Carregadas ${invoicesMap.size} invoices...`);

      hasMore = response.documents.length === limit;
      offset += limit;
    }

    console.log(`✅ Total de ${invoicesMap.size} invoices encontradas\n`);

    // 2. Remover todos os produtos existentes
    console.log('🗑️  Removendo produtos existentes...');
    let deletedCount = 0;
    offset = 0;
    hasMore = true;

    while (hasMore) {
      const response = await databases.listDocuments(DATABASE_ID, 'products', [Query.limit(limit), Query.offset(0)]); // Sempre offset 0 porque estamos deletando

      for (const product of response.documents) {
        await databases.deleteDocument(DATABASE_ID, 'products', product.$id);
        deletedCount++;
        if (deletedCount % 10 === 0) {
          console.log(`  ↳ Removidos ${deletedCount} produtos...`);
        }
      }

      hasMore = response.documents.length === limit;
    }

    console.log(`✅ ${deletedCount} produtos removidos\n`);

    // 3. Agrupar invoice_items por usuário
    console.log('👥 Agrupando invoice_items por usuário...');
    const itemsByUser = new Map<string, InvoiceItem[]>();

    for (const item of allInvoiceItems) {
      if (!itemsByUser.has(item.user_id)) {
        itemsByUser.set(item.user_id, []);
      }
      itemsByUser.get(item.user_id)!.push(item);
    }

    console.log(`✅ Encontrados ${itemsByUser.size} usuários\n`);

    // 4. Processar cada usuário
    let totalProductsCreated = 0;
    let totalItemsUpdated = 0;

    for (const [userId, userItems] of itemsByUser) {
      console.log(`\n👤 Processando usuário: ${userId}`);
      console.log(`  ↳ ${userItems.length} invoice_items`);

      // Mapa de produtos por chave normalizada (para evitar duplicatas)
      const productsByKey = new Map<string, { product: Product; items: InvoiceItem[] }>();

      // Filter out items without description
      const validItems = userItems.filter((item) => item.description && item.description.trim() !== '');

      if (validItems.length === 0) {
        console.log(`    ⚠️  Nenhum item válido para processar`);
        continue;
      }

      console.log(`    📋 Processando ${validItems.length} items válidos`);

      // Normalize items (batch processing if AI enabled)
      let normalizedResults: any[] = [];

      if (process.env.USE_AI_NORMALIZER === 'true') {
        console.log(`    🤖 Usando AI normalizer em lotes de 20...`);
        const BATCH_SIZE = 20;

        for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
          const batch = validItems.slice(i, i + BATCH_SIZE);
          const batchNames = batch.map((item) => item.description);

          console.log(
            `    ⏳ Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validItems.length / BATCH_SIZE)} (${batchNames.length} produtos)...`,
          );

          try {
            const batchResults = await aiNormalizeProductsBatch(batchNames);

            // For any null results, use static normalizer as fallback
            for (let j = 0; j < batchResults.length; j++) {
              if (batchResults[j]) {
                normalizedResults.push(batchResults[j]);
              } else {
                const item = batch[j];
                const staticResult = productNormalizationService.normalizeProduct(
                  item.description,
                  item.product_code,
                  item.ncm_code,
                );
                normalizedResults.push(staticResult);
              }
            }
          } catch (err) {
            console.error(`    ❌ Erro no lote, usando normalização estática para ${batch.length} items:`, err);

            // Fallback to static for entire batch
            for (const item of batch) {
              const staticResult = productNormalizationService.normalizeProduct(
                item.description,
                item.product_code,
                item.ncm_code,
              );
              normalizedResults.push(staticResult);
            }
          }
        }
      } else {
        // Use static normalizer for all items
        console.log(`    📝 Usando normalização estática...`);
        normalizedResults = validItems.map((item) =>
          productNormalizationService.normalizeProduct(item.description, item.product_code, item.ncm_code),
        );
      }

      // Group items by normalized product name
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const normalized = normalizedResults[i];

        // Pular se a normalização resultou em nome vazio
        if (!normalized.normalizedName || normalized.normalizedName.trim() === '') {
          console.log(`    ⚠️  Pulando invoice_item ${item.$id} - normalização resultou em nome vazio`);
          continue;
        }

        // Gerar chave única para o produto normalizado (apenas pelo nome)
        const key = normalized.normalizedName;

        if (!productsByKey.has(key)) {
          // Categorizar produto (passando o primeiro NCM encontrado para ajudar na categorização)
          const { category, subcategory } = categorizeProduct(normalized.normalizedName, item.ncm_code);

          // Criar novo produto
          const now = new Date().toISOString();
          const newProduct: Product = {
            $id: '', // Será preenchido após criação
            user_id: userId,
            name: normalized.normalizedName,
            category,
            subcategory: subcategory || null,
            brand: normalized.brand || null,
            is_promotion: normalized.isPromotion || false,
            created_at: now,
            updated_at: now,
          };

          productsByKey.set(key, { product: newProduct, items: [] });
        }

        productsByKey.get(key)!.items.push(item);
      }

      console.log(`  ↳ ${productsByKey.size} produtos únicos identificados`);

      // Criar produtos no banco
      for (const [key, { product, items }] of productsByKey) {
        // Criar produto no banco
        try {
          const createdProduct = await databases.createDocument(DATABASE_ID, 'products', 'unique()', {
            user_id: product.user_id,
            name: product.name,
            category: product.category,
            subcategory: product.subcategory,
            brand: product.brand,
            is_promotion: product.is_promotion,
            created_at: product.created_at,
            updated_at: product.updated_at,
          });

          totalProductsCreated++;
          product.$id = createdProduct.$id;

          // Atualizar invoice_items e criar price_history para cada item
          for (const item of items) {
            try {
              // Atualizar invoice_item com product_id
              await databases.updateDocument(DATABASE_ID, 'invoice_items', item.$id, {
                product_id: createdProduct.$id,
              });
              totalItemsUpdated++;

              // Obter informações da invoice para criar price_history
              const invoice = invoicesMap.get(item.invoice_id);
              if (invoice) {
                // Criar registro no price_history
                await databases.createDocument(DATABASE_ID, 'price_history', 'unique()', {
                  user_id: product.user_id,
                  product_id: createdProduct.$id,
                  invoice_id: item.invoice_id,
                  merchant_cnpj: invoice.merchant_cnpj,
                  merchant_name: invoice.merchant_name,
                  purchase_date: invoice.issue_date,
                  unit_price: item.unit_price,
                  quantity: item.quantity,
                  created_at: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error(`    ❌ Erro ao atualizar invoice_item ${item.$id}:`, error);
            }
          }

          if (totalProductsCreated % 10 === 0) {
            console.log(`    ↳ ${totalProductsCreated} produtos criados...`);
          }
        } catch (error) {
          console.error(`    ❌ Erro ao criar produto "${product.name}":`, error);
        }
      }
    }

    console.log('\n\n✨ Regeneração concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`  - Invoice items processados: ${allInvoiceItems.length}`);
    console.log(`  - Produtos antigos removidos: ${deletedCount}`);
    console.log(`  - Produtos novos criados: ${totalProductsCreated}`);
    console.log(`  - Invoice items atualizados: ${totalItemsUpdated}`);
    console.log(`  - Usuários processados: ${itemsByUser.size}`);

    console.log('\n🎉 Script executado com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante a regeneração:', error);
    throw error;
  }
}

// Executar script
regenerateProducts()
  .then(() => {
    console.log('\n👋 Finalizando...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
