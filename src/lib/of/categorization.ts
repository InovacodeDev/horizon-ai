/**
 * Basic automatic categorization of transactions based on description
 * This is a simple keyword-based approach for the MVP
 */

interface CategoryRule {
  keywords: string[];
  category: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  // Transportation
  {
    keywords: [
      "uber",
      "99",
      "taxi",
      "metro",
      "onibus",
      "bus",
      "combustivel",
      "gasolina",
      "posto",
    ],
    category: "Transporte",
  },
  // Food & Dining
  {
    keywords: [
      "ifood",
      "rappi",
      "restaurante",
      "lanchonete",
      "padaria",
      "mercado",
      "supermercado",
    ],
    category: "Alimentação",
  },
  // Shopping
  {
    keywords: [
      "amazon",
      "mercado livre",
      "shopee",
      "magazine",
      "americanas",
      "casas bahia",
    ],
    category: "Compras",
  },
  // Entertainment
  {
    keywords: ["netflix", "spotify", "cinema", "teatro", "show", "ingresso"],
    category: "Entretenimento",
  },
  // Health
  {
    keywords: [
      "farmacia",
      "drogaria",
      "hospital",
      "clinica",
      "medico",
      "laboratorio",
    ],
    category: "Saúde",
  },
  // Bills & Utilities
  {
    keywords: [
      "energia",
      "agua",
      "internet",
      "telefone",
      "celular",
      "condominio",
    ],
    category: "Contas",
  },
  // Education
  {
    keywords: ["escola", "faculdade", "universidade", "curso", "livro"],
    category: "Educação",
  },
];

/**
 * Categorize a transaction based on its description
 * Returns the category name or null if no match is found
 */
export function categorizeTransaction(description: string): string | null {
  const normalizedDescription = description.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (normalizedDescription.includes(keyword)) {
        return rule.category;
      }
    }
  }

  // Return null for uncategorized transactions
  return null;
}
