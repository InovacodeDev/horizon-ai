# Transaction Auto-Categorization

This module provides automatic categorization of financial transactions based on their descriptions.

## Features

- **Keyword-based matching**: Uses predefined rules to match transaction descriptions to categories
- **Brazilian market focus**: Includes common Brazilian merchants and services
- **Accent-insensitive**: Normalizes text to handle accented characters
- **Priority system**: Rules can have different priorities for better matching
- **Extensible**: Easy to add new rules and categories

## Usage

### Basic Categorization

```typescript
import { categorizeTransaction } from "@/lib/categorization/auto-categorize";

// Categorize a single transaction
const category = categorizeTransaction("UBER *TRIP");
console.log(category); // "Transporte"

const category2 = categorizeTransaction("IFOOD *PEDIDO");
console.log(category2); // "Alimentação"

const category3 = categorizeTransaction("NETFLIX.COM");
console.log(category3); // "Entretenimento"

// Uncategorized transactions return null
const category4 = categorizeTransaction("UNKNOWN MERCHANT");
console.log(category4); // null
```

### Batch Categorization

```typescript
import { batchCategorizeTransactions } from "@/lib/categorization/auto-categorize";

const descriptions = [
  "UBER *TRIP",
  "IFOOD *PEDIDO",
  "NETFLIX.COM",
  "UNKNOWN MERCHANT",
];

const categories = batchCategorizeTransactions(descriptions);
console.log(categories); // ["Transporte", "Alimentação", "Entretenimento", null]
```

### Get Available Categories

```typescript
import { getAvailableCategories } from "@/lib/categorization/auto-categorize";

const categories = getAvailableCategories();
console.log(categories);
// [
//   "Alimentação",
//   "Compras",
//   "Contas",
//   "Cuidados Pessoais",
//   "Educação",
//   "Entretenimento",
//   "Saúde",
//   "Serviços Financeiros",
//   "Transporte",
//   "Viagem"
// ]
```

### Add Custom Rules (Future Feature)

```typescript
import { addCustomCategoryRule } from "@/lib/categorization/auto-categorize";

// Add a custom rule for a specific merchant
addCustomCategoryRule(
  ["my-custom-store", "special-merchant"],
  "Custom Category",
  10 // priority
);
```

## Categories

The system currently supports the following categories:

1. **Transporte** - Transportation (Uber, 99, taxis, gas stations, parking)
2. **Alimentação** - Food & Dining (iFood, Rappi, restaurants, supermarkets)
3. **Compras** - Shopping & Retail (Amazon, Mercado Livre, clothing stores)
4. **Entretenimento** - Entertainment (Netflix, Spotify, cinema, games)
5. **Saúde** - Health & Wellness (pharmacies, hospitals, gyms)
6. **Contas** - Bills & Utilities (electricity, water, internet, rent)
7. **Educação** - Education (schools, courses, books)
8. **Serviços Financeiros** - Financial Services (bank fees, insurance, investments)
9. **Viagem** - Travel (hotels, flights, Airbnb)
10. **Cuidados Pessoais** - Personal Care (salons, barbershops, cosmetics)

## How It Works

1. **Normalization**: The transaction description is converted to lowercase and accents are removed
2. **Rule Matching**: Rules are checked in priority order (highest first)
3. **Keyword Search**: Each keyword in the rule is checked against the normalized description
4. **First Match Wins**: The first matching rule's category is returned
5. **Fallback**: If no match is found, `null` is returned

## Integration with Sync System

The categorization is automatically applied during the Open Finance sync process:

```typescript
// In src/lib/of/sync.ts
import { categorizeTransaction } from "@/lib/categorization/auto-categorize";

// During transaction sync
const category = categorizeTransaction(transaction.description);

await supabaseAdmin.from("transactions").insert({
  // ... other fields
  category, // Automatically categorized
});
```

## Future Enhancements

- User-defined custom rules
- Machine learning-based categorization
- Category correction by users
- Subcategories for more granular classification
- Multi-language support
