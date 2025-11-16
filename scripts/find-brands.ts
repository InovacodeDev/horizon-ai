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

async function checkBrands() {
  console.log('📋 Verificando todas as invoice_items para identificar marcas no nome...\n');
  
  const items = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'invoice_items',
    [Query.limit(400)]
  );
  
  // Palavras que aparecem em letras maiúsculas geralmente são marcas
  const potentialBrands = new Set<string>();
  
  items.documents.forEach((item: any) => {
    const name = item.description || '';
    // Encontrar palavras em maiúsculas (possíveis marcas)
    const words = name.split(/\s+/);
    words.forEach((word: string) => {
      // Palavras com 3+ letras maiúsculas são possíveis marcas
      if (word.length >= 3 && /^[A-Z]+$/.test(word)) {
        potentialBrands.add(word.toLowerCase());
      }
      // Palavras que começam com maiúscula seguida de minúsculas
      if (word.length >= 4 && /^[A-Z][a-z]+$/.test(word)) {
        potentialBrands.add(word.toLowerCase());
      }
    });
  });
  
  console.log('🏷️  Possíveis marcas encontradas:');
  Array.from(potentialBrands).sort().forEach(brand => {
    console.log(`  - ${brand}`);
  });
  
  console.log(`\n📊 Total: ${potentialBrands.size} marcas potenciais`);
}

checkBrands().catch(console.error);
