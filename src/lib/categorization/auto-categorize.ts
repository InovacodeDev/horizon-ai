/**
 * Automatic categorization system for financial transactions
 * Uses keyword-based rules to assign categories to transactions based on their descriptions
 *
 * Requirements: 3.3 - Apply automatic categorization to transactions
 */

export interface CategoryRule {
  keywords: string[];
  category: string;
  priority?: number; // Higher priority rules are checked first
}

/**
 * Predefined category rules for Brazilian financial transactions
 * Rules are checked in order, first match wins
 */
export const CATEGORY_RULES: CategoryRule[] = [
  // Transportation
  {
    keywords: [
      "uber",
      "99",
      "99pop",
      "taxi",
      "cabify",
      "metro",
      "metrô",
      "onibus",
      "ônibus",
      "bus",
      "combustivel",
      "combustível",
      "gasolina",
      "etanol",
      "diesel",
      "posto",
      "shell",
      "ipiranga",
      "petrobras",
      "br distribuidora",
      "estacionamento",
      "pedágio",
      "pedagio",
    ],
    category: "Transporte",
    priority: 10,
  },

  // Food & Dining
  {
    keywords: [
      "ifood",
      "rappi",
      "uber eats",
      "restaurante",
      "lanchonete",
      "padaria",
      "mercado",
      "supermercado",
      "extra",
      "carrefour",
      "pao de acucar",
      "pão de açúcar",
      "assai",
      "atacadao",
      "atacadão",
      "hortifruti",
      "bar",
      "cafe",
      "café",
      "pizzaria",
      "hamburgueria",
      "mcdonald",
      "burger king",
      "subway",
    ],
    category: "Alimentação",
    priority: 10,
  },

  // Shopping & Retail
  {
    keywords: [
      "amazon",
      "mercado livre",
      "shopee",
      "magazine luiza",
      "magalu",
      "americanas",
      "casas bahia",
      "extra",
      "renner",
      "c&a",
      "zara",
      "shein",
      "aliexpress",
      "ebay",
      "loja",
      "shopping",
    ],
    category: "Compras",
    priority: 8,
  },

  // Entertainment & Streaming
  {
    keywords: [
      "netflix",
      "spotify",
      "amazon prime",
      "disney",
      "hbo",
      "globoplay",
      "youtube premium",
      "cinema",
      "cinemark",
      "teatro",
      "show",
      "ingresso",
      "ticket",
      "steam",
      "playstation",
      "xbox",
      "nintendo",
    ],
    category: "Entretenimento",
    priority: 9,
  },

  // Health & Wellness
  {
    keywords: [
      "farmacia",
      "farmácia",
      "drogaria",
      "droga raia",
      "drogasil",
      "pague menos",
      "hospital",
      "clinica",
      "clínica",
      "medico",
      "médico",
      "laboratorio",
      "laboratório",
      "exame",
      "consulta",
      "dentista",
      "fisioterapia",
      "academia",
      "smartfit",
      "bioritmo",
    ],
    category: "Saúde",
    priority: 10,
  },

  // Bills & Utilities
  {
    keywords: [
      "energia",
      "eletricidade",
      "cemig",
      "copel",
      "light",
      "enel",
      "agua",
      "água",
      "sabesp",
      "cedae",
      "saneamento",
      "internet",
      "telefone",
      "celular",
      "vivo",
      "claro",
      "tim",
      "oi",
      "condominio",
      "condomínio",
      "iptu",
      "aluguel",
    ],
    category: "Contas",
    priority: 10,
  },

  // Education
  {
    keywords: [
      "escola",
      "colegio",
      "colégio",
      "faculdade",
      "universidade",
      "curso",
      "udemy",
      "coursera",
      "alura",
      "livro",
      "livraria",
      "saraiva",
      "cultura",
      "material escolar",
    ],
    category: "Educação",
    priority: 9,
  },

  // Financial Services
  {
    keywords: [
      "banco",
      "tarifa",
      "anuidade",
      "juros",
      "emprestimo",
      "empréstimo",
      "financiamento",
      "investimento",
      "seguro",
      "previdencia",
      "previdência",
      "pix",
      "ted",
      "doc",
      "transferencia",
      "transferência",
    ],
    category: "Serviços Financeiros",
    priority: 7,
  },

  // Travel
  {
    keywords: [
      "hotel",
      "pousada",
      "airbnb",
      "booking",
      "decolar",
      "latam",
      "gol",
      "azul",
      "passagem",
      "viagem",
      "turismo",
    ],
    category: "Viagem",
    priority: 9,
  },

  // Personal Care
  {
    keywords: [
      "salao",
      "salão",
      "barbearia",
      "cabeleireiro",
      "manicure",
      "estetica",
      "estética",
      "spa",
      "perfumaria",
      "cosmetico",
      "cosmético",
    ],
    category: "Cuidados Pessoais",
    priority: 8,
  },
];

/**
 * Categorize a transaction based on its description
 * Uses keyword matching with normalized text (lowercase, no accents)
 *
 * @param description - The transaction description from the bank
 * @returns The category name or null if no match is found
 *
 * @example
 * categorizeTransaction("UBER *TRIP") // Returns "Transporte"
 * categorizeTransaction("IFOOD *PEDIDO") // Returns "Alimentação"
 * categorizeTransaction("NETFLIX.COM") // Returns "Entretenimento"
 */
export function categorizeTransaction(description: string): string | null {
  if (!description || typeof description !== "string") {
    return null;
  }

  // Normalize description: lowercase and remove special characters
  const normalizedDescription = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents

  // Sort rules by priority (higher first)
  const sortedRules = [...CATEGORY_RULES].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );

  // Check each rule
  for (const rule of sortedRules) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (normalizedDescription.includes(normalizedKeyword)) {
        return rule.category;
      }
    }
  }

  // Return null for uncategorized transactions
  // This allows the UI to show "Sem categoria" or similar
  return null;
}

/**
 * Get all available categories
 * Useful for UI dropdowns or filters
 *
 * @returns Array of unique category names
 */
export function getAvailableCategories(): string[] {
  const categories = new Set(CATEGORY_RULES.map((rule) => rule.category));
  return Array.from(categories).sort();
}

/**
 * Add a custom category rule
 * This function can be used in the future to allow users to create custom rules
 *
 * @param keywords - Array of keywords to match
 * @param category - Category name to assign
 * @param priority - Optional priority (default: 5)
 */
export function addCustomCategoryRule(
  keywords: string[],
  category: string,
  priority: number = 5
): void {
  CATEGORY_RULES.push({
    keywords,
    category,
    priority,
  });
}

/**
 * Batch categorize multiple transactions
 * More efficient than calling categorizeTransaction multiple times
 *
 * @param descriptions - Array of transaction descriptions
 * @returns Array of categories (same order as input)
 */
export function batchCategorizeTransactions(
  descriptions: string[]
): (string | null)[] {
  return descriptions.map((desc) => categorizeTransaction(desc));
}
