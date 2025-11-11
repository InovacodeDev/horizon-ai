/**
 * TOON Format Usage Examples
 *
 * Demonstrates how to use TOON format for token-efficient AI prompts
 */
import { calculateTokenSavings, encodeToToon, formatForAIPrompt } from '@/lib/utils/toon';

// Example 1: Purchase History
console.log('=== Example 1: Purchase History ===\n');

const purchaseHistory = [
  {
    id: 1,
    storeName: 'Supermercado Exemplo',
    purchaseDate: '2025-01-15',
    totalAmount: 150.5,
    items: [
      { name: 'Arroz 5kg', quantity: 1, unitPrice: 25.9, totalPrice: 25.9 },
      { name: 'Feijão 1kg', quantity: 2, unitPrice: 8.5, totalPrice: 17.0 },
    ],
  },
  {
    id: 2,
    storeName: 'Farmácia Saúde',
    purchaseDate: '2025-01-16',
    totalAmount: 45.3,
    items: [
      { name: 'Dipirona 500mg', quantity: 2, unitPrice: 8.5, totalPrice: 17.0 },
      { name: 'Paracetamol 750mg', quantity: 1, unitPrice: 12.3, totalPrice: 12.3 },
    ],
  },
];

// Calculate token savings
const savings = calculateTokenSavings({ purchases: purchaseHistory });
console.log('Token Savings:');
console.log(`  JSON: ${savings.jsonTokens} tokens`);
console.log(`  TOON: ${savings.toonTokens} tokens`);
console.log(`  Saved: ${savings.savedTokens} tokens (${savings.savedPercentage}%)\n`);

// Format for AI prompt
const formattedPrompt = formatForAIPrompt({ purchases: purchaseHistory }, 'Purchase History');
console.log('Formatted for AI Prompt:');
console.log(formattedPrompt);
console.log('\n');

// Example 2: Transaction List
console.log('=== Example 2: Transaction List ===\n');

const transactions = [
  { id: 1, date: '2025-01-01', description: 'Supermercado', amount: -150.5, category: 'groceries' },
  { id: 2, date: '2025-01-02', description: 'Salário', amount: 5000.0, category: 'income' },
  { id: 3, date: '2025-01-03', description: 'Farmácia', amount: -45.3, category: 'health' },
  { id: 4, date: '2025-01-04', description: 'Restaurante', amount: -85.0, category: 'food' },
];

const txSavings = calculateTokenSavings({ transactions });
console.log('Token Savings:');
console.log(`  JSON: ${txSavings.jsonTokens} tokens`);
console.log(`  TOON: ${txSavings.toonTokens} tokens`);
console.log(`  Saved: ${txSavings.savedTokens} tokens (${txSavings.savedPercentage}%)\n`);

// Show TOON encoding
const toonEncoded = encodeToToon({ transactions });
console.log('TOON Encoded:');
console.log(toonEncoded);
console.log('\n');

// Example 3: Analytics Data
console.log('=== Example 3: Analytics Data ===\n');

const analyticsData = {
  metrics: [
    { date: '2025-01-01', views: 5715, clicks: 211, conversions: 28, revenue: 7976.46 },
    { date: '2025-01-02', views: 7103, clicks: 393, conversions: 28, revenue: 8360.53 },
    { date: '2025-01-03', views: 7248, clicks: 378, conversions: 24, revenue: 3212.57 },
    { date: '2025-01-04', views: 2927, clicks: 77, conversions: 11, revenue: 1211.69 },
    { date: '2025-01-05', views: 3530, clicks: 82, conversions: 8, revenue: 462.77 },
  ],
};

const analyticsSavings = calculateTokenSavings(analyticsData);
console.log('Token Savings:');
console.log(`  JSON: ${analyticsSavings.jsonTokens} tokens`);
console.log(`  TOON: ${analyticsSavings.toonTokens} tokens`);
console.log(`  Saved: ${analyticsSavings.savedTokens} tokens (${analyticsSavings.savedPercentage}%)\n`);

console.log('TOON Encoded:');
console.log(encodeToToon(analyticsData));
console.log('\n');

// Example 4: AI Prompt with TOON
console.log('=== Example 4: Complete AI Prompt Example ===\n');

const aiPrompt = `
You are a financial advisor analyzing user spending patterns.

${formatForAIPrompt({ transactions }, 'Recent Transactions')}

Instructions:
1. Analyze spending patterns from the TOON data above
2. Identify the top spending categories
3. Suggest 2-3 ways to reduce expenses
4. Format your response in Markdown

Remember: The data is in TOON format (tab-separated tabular notation).
`;

console.log('Complete AI Prompt:');
console.log(aiPrompt);
