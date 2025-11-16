import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

async function checkProductsWithBrands() {
  console.log('📋 Verificando produtos que podem ter marcas no nome...\n');
  
  const products = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'products',
    [Query.limit(200), Query.orderDesc('$createdAt')]
  );
  
  console.log('🔍 Produtos que podem conter marcas:');
  console.log('='.repeat(80));
  
  products.documents.forEach((p: any) => {
    const name = p.name || '';
    const brand = p.brand || '';
    
    // Produtos com palavras em CamelCase ou múltiplas palavras capitalizadas podem ter marcas
    const words = name.split(' ');
    const capitalizedWords = words.filter((w: string) => w.length > 2 && w[0] === w[0].toUpperCase());
    
    if (capitalizedWords.length > 2 || (!brand && capitalizedWords.length > 1)) {
      console.log(`\nNome: ${name}`);
      console.log(`Marca atual: ${brand || '(sem marca)'}`);
      console.log(`Palavras capitalizadas: ${capitalizedWords.join(', ')}`);
    }
  });
}

checkProductsWithBrands().catch(console.error);
