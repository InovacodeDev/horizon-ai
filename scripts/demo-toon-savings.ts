#!/usr/bin/env tsx
/**
 * Demo: TOON Token Savings
 *
 * Demonstrates the token savings achieved by using TOON format
 * Run: pnpm tsx scripts/demo-toon-savings.ts
 */
import { calculateTokenSavings, encodeToToon, formatForAIPrompt } from '@/lib/utils/toon';

console.log('🎯 TOON Format - Token Savings Demo\n');
console.log('='.repeat(60));

// Example 1: Small dataset
console.log('\n📊 Example 1: Small Purchase History (2 items)\n');

const smallData = {
  purchases: [
    { id: 1, store: 'Supermercado A', total: 150.5, date: '2025-01-01' },
    { id: 2, store: 'Farmácia B', total: 45.3, date: '2025-01-02' },
  ],
};

const small = calculateTokenSavings(smallData);
console.log(`JSON:  ${small.jsonTokens} tokens`);
console.log(`TOON:  ${small.toonTokens} tokens`);
console.log(`Saved: ${small.savedTokens} tokens (${small.savedPercentage}% reduction) ✨\n`);

// Example 2: Medium dataset
console.log('📊 Example 2: Medium Transaction List (10 items)\n');

const mediumData = {
  transactions: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    date: `2025-01-${String(i + 1).padStart(2, '0')}`,
    description: `Transaction ${i + 1}`,
    amount: Math.random() * 1000,
    category: ['groceries', 'health', 'food', 'transport'][i % 4],
  })),
};

const medium = calculateTokenSavings(mediumData);
console.log(`JSON:  ${medium.jsonTokens} tokens`);
console.log(`TOON:  ${medium.toonTokens} tokens`);
console.log(`Saved: ${medium.savedTokens} tokens (${medium.savedPercentage}% reduction) ✨\n`);

// Example 3: Large dataset
console.log('📊 Example 3: Large Analytics Data (100 items)\n');

const largeData = {
  metrics: Array.from({ length: 100 }, (_, i) => ({
    date: `2025-01-${String((i % 31) + 1).padStart(2, '0')}`,
    views: Math.floor(Math.random() * 10000),
    clicks: Math.floor(Math.random() * 500),
    conversions: Math.floor(Math.random() * 50),
    revenue: Math.random() * 10000,
  })),
};

const large = calculateTokenSavings(largeData);
console.log(`JSON:  ${large.jsonTokens} tokens`);
console.log(`TOON:  ${large.toonTokens} tokens`);
console.log(`Saved: ${large.savedTokens} tokens (${large.savedPercentage}% reduction) ✨\n`);

// Summary
console.log('='.repeat(60));
console.log('\n💰 Total Potential Savings\n');

const totalJsonTokens = small.jsonTokens + medium.jsonTokens + large.jsonTokens;
const totalToonTokens = small.toonTokens + medium.toonTokens + large.toonTokens;
const totalSaved = totalJsonTokens - totalToonTokens;
const totalPercentage = ((totalSaved / totalJsonTokens) * 100).toFixed(1);

console.log(`Total JSON tokens:  ${totalJsonTokens}`);
console.log(`Total TOON tokens:  ${totalToonTokens}`);
console.log(`Total saved:        ${totalSaved} tokens (${totalPercentage}%)\n`);

// Cost estimation (assuming $0.01 per 1K tokens)
const costPerToken = 0.01 / 1000;
const savedCost = (totalSaved * costPerToken).toFixed(4);

console.log(`💵 Estimated cost savings: $${savedCost} per request`);
console.log(`   (at $0.01 per 1K tokens)\n`);

// Show TOON example
console.log('='.repeat(60));
console.log('\n📝 TOON Format Example\n');
console.log('Small dataset in TOON format:');
console.log(encodeToToon(smallData));
console.log('\n');

// Show formatted prompt
console.log('='.repeat(60));
console.log('\n🤖 AI Prompt Example\n');
const prompt = formatForAIPrompt(smallData, 'Purchase History');
console.log(prompt);
console.log('\n');

console.log('='.repeat(60));
console.log('\n✅ Demo complete! Use TOON to save tokens in your AI calls.\n');
