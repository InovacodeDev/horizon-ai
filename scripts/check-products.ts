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

async function checkProducts() {
  console.log('📋 Verificando produtos com leite...\n');
  
  const products = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'products',
    [Query.search('name', 'leite'), Query.limit(20)]
  );
  
  products.documents.forEach(p => {
    console.log('Nome:', p.name);
    console.log('Marca:', p.brand || '(sem marca)');
    console.log('---');
  });
  
  console.log('\n📋 Verificando produtos de farmácia...\n');
  
  const pharmacy = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'products',
    [Query.search('name', 'comprimido'), Query.limit(10)]
  );
  
  pharmacy.documents.forEach(p => {
    console.log('Nome:', p.name);
    console.log('Marca:', p.brand || '(sem marca)');
    console.log('---');
  });
  
  console.log('\n📋 Total de produtos:', products.total);
}

checkProducts().catch(console.error);
