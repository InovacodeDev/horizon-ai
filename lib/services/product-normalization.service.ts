/**
 * Product Normalization Service
 *
 * Handles normalization of product names and matching similar products
 * across different invoices to maintain a consistent product catalog.
 * Extracts brand information and promotion indicators for better price analysis.
 */

// ============================================
// Types and Interfaces
// ============================================

export interface NormalizedProduct {
  normalizedName: string;
  originalName: string;
  productCode?: string;
  ncmCode?: string;
  brand?: string;
  isPromotion?: boolean;
}

export interface ProductMatchResult {
  isMatch: boolean;
  confidence: number;
  matchedProductId?: string;
}

// ============================================
// Constants
// ============================================

// Words indicating promotion
const PROMOTION_KEYWORDS = [
  'promocao',
  'promoção',
  'promo',
  'oferta',
  'desconto',
  'desc',
  'atacado',
  'combo',
  'kit',
  'leve',
  'pague',
  'economico',
  'economica',
  'super',
  'mega',
  'hiper',
  'pack',
  'gratis',
  'gr',
  'venc',
  'prox venc',
  'especial',
];

// Common brands to extract - Taxonomia do Varejo Brasileiro
const KNOWN_BRANDS = [
  // Unilever - HPC
  'seda',
  'tresemme',
  'tresemmé',
  'dove',
  'clear',
  'clear men',
  'clear women',
  'nexxus',
  'bed head',
  'rexona',
  'rexona clinical',
  'lux',
  'lifebuoy',
  'axe',
  'vasenol',
  'vinólia',
  'vinolia',
  'fofo',
  'close up',
  'pepsodent',
  // Unilever - Home Care
  'omo',
  'brilhante',
  'comfort',
  'surf',
  'cif',
  'vim',
  'ala',
  'minerva',
  // P&G
  'gillette',
  'gillette mach3',
  'gillette fusion',
  'gillette proglide',
  'gillette proshield',
  'prestobarba',
  'venus',
  'venus breeze',
  'braun',
  'oral-b',
  'oral b',
  'pantene',
  'pantene pro-v',
  'head & shoulders',
  'head and shoulders',
  'h&s',
  'herbal essences',
  'old spice',
  'always',
  'tampax',
  'pampers',
  'vick',
  'vick vaporub',
  'metamucil',
  'pepto-bismol',
  'clearblue',
  // L'Oréal
  "l'oreal",
  'loreal',
  "l'oreal paris",
  'elseve',
  'imédia',
  'imedi excellence',
  'revitalift',
  'uv defender',
  'garnier',
  'fructis',
  'nutrisse',
  'skinactive',
  'niely',
  'niely gold',
  'cor&ton',
  'colorama',
  'maybelline',
  'la roche-posay',
  'la roche posay',
  'anthelios',
  'effaclar',
  'lipikar',
  'vichy',
  'mineral 89',
  'dercos',
  'normaderm',
  'cerave',
  'skinceuticals',
  'kerastase',
  'kérastase',
  'redken',
  // Coty
  'monange',
  'risqué',
  'risque',
  'bozzano',
  'paixão',
  'paixao',
  'cenoura & bronze',
  'biocolor',
  'adidas',
  'calvin klein',
  'hugo boss',
  'gucci',
  'burberry',
  // Outros HPC
  'nivea',
  'nivea sun',
  'nivea men',
  'colgate',
  'sorriso',
  'tandy',
  'protex',
  'palmolive',
  'darling',
  'pinho sol',
  'embelleze',
  'novex',
  'santo black',
  'meus cachos',
  'superfood',
  'maxton',
  'natucor',
  'salon line',
  'todecacho',
  'granado',
  'phebo',
  // Home Care - Ypê
  'ypê',
  'ype',
  'tixan',
  'tixan ypê',
  'assolan',
  'atol',
  'perfex',
  'bak',
  // Home Care - Reckitt
  'veja',
  'veja gold',
  'veja vidrex',
  'veja x-14',
  'vanish',
  'vanish oxi action',
  'sbp',
  'mortein',
  'bom ar',
  'harpic',
  'poliflor',
  'finish',
  'woolite',
  'passe bem',
  // Home Care - Bombril
  'bombril',
  'limpol',
  'pinho bril',
  'sapólio',
  'sapolio',
  'sapólio radium',
  'mon bijou',
  // Alimentos - BRF
  'sadia',
  'perdigão',
  'perdigao',
  'qualy',
  'claybom',
  'deline',
  'kidelli',
  // Alimentos - JBS/Seara
  'seara',
  'friboi',
  'swift',
  'massa leve',
  'doriana',
  'rezende',
  'wilson',
  'excelsior',
  // Laticínios
  'nestlé',
  'nestle',
  'ninho',
  'molico',
  'chamyto',
  'chandelle',
  'chambinho',
  'neston',
  'danone',
  'danoninho',
  'activia',
  'danette',
  'yopro',
  'silk',
  'aptamil',
  'milnutri',
  'fortifit',
  'sustagen',
  'parmalat',
  'batavo',
  'elegê',
  'elege',
  'itambé',
  'itambe',
  'nolac',
  'president',
  'poços de caldas',
  'vigor',
  'faixa azul',
  'danubio',
  'leco',
  'amélia',
  'amelia',
  'piracanjuba',
  'pirakids',
  'leitbom',
  'tirol',
  'italac',
  // Biscoitos e Massas - M. Dias Branco
  'piraquê',
  'piraque',
  'adria',
  'vitarella',
  'fortaleza',
  'richester',
  'isabela',
  'estrela',
  'pilar',
  'finna',
  'fit food',
  'frontera',
  'smart',
  'bauducco',
  'renata',
  'thabrula',
  // Mondelēz
  'lacta',
  'diamante negro',
  'laka',
  'shot',
  'bubbaloo',
  'bis',
  'sonho de valsa',
  'ouro branco',
  'oreo',
  'club social',
  'trakinas',
  'tang',
  'clight',
  'fresh',
  'trident',
  'halls',
  'chiclets',
  'royal',
  'ruffles',
  // Nestlé Alimentos
  'garoto',
  'baton',
  'talento',
  'serenata de amor',
  'alpino',
  'suflair',
  'classic',
  'galak',
  'kitkat',
  'kit kat',
  'prestígio',
  'prestigio',
  'charge',
  'chokito',
  'passatempo',
  'bono',
  'negresco',
  'tostines',
  'são luiz',
  'sao luiz',
  'calipso',
  'maggi',
  'moça',
  'moca',
  'nescau',
  'nescafe',
  'nescafé',
  'snow flakes',
  'corn flakes',
  'nesfit',
  'dr oetker',
  'dr. oetker',
  'oetker',
  // J.Macêdo
  'dona benta',
  'sol',
  'petybon',
  'brandini',
  // Bebidas - Ambev
  'skol',
  'brahma',
  'antarctica',
  'budweiser',
  'stella artois',
  'corona',
  'spaten',
  'becks',
  'colorado',
  'wäls',
  'wals',
  'goose island',
  'guaraná antarctica',
  'guarana antarctica',
  'pepsi',
  'sukita',
  'soda limonada',
  'h2oh',
  'gatorade',
  'lipton',
  'fusion',
  'do bem',
  'ama',
  // Heineken
  'heineken',
  'amstel',
  'devassa',
  'schin',
  'glacial',
  'kaiser',
  'bavaria',
  'eisenbahn',
  'baden baden',
  'lagunitas',
  'blue moon',
  'fys',
  'itubaína',
  'itubauna',
  // Petrópolis
  'itaipava',
  'petra',
  'black princess',
  'cacildis',
  'crystal',
  'lokal',
  'tnt energy',
  'tnt',
  'magneto',
  'ironage',
  'nordka',
  'red bull',
  // Coca-Cola
  'coca-cola',
  'coca cola',
  'fanta',
  'sprite',
  'kuat',
  'schweppes',
  'del valle',
  'kapifrut',
  'sococo',
  'matte leão',
  'matte leao',
  'leão fuze',
  'leao fuze',
  'powerade',
  'lemon-dou',
  'topo chico',
  // Café
  'pilão',
  'pilao',
  "l'or",
  'lor',
  'café do ponto',
  'cafe do ponto',
  'caboclo',
  'café pelé',
  'cafe pele',
  'damasco',
  'moka',
  'bom taí',
  'bom tai',
  'café puro',
  'cafe puro',
  'maratá',
  'marata',
  '3 corações',
  '3 coracoes',
  'três corações',
  'tres coracoes',
  'santa clara',
  'pimpinela',
  'kimimo',
  'fino grão',
  'fino grao',
  'itamaraty',
  'tres',
  'dona clara',
  'frisco',
  // Grãos e Óleos
  'camil',
  'namorado',
  'carreteiro',
  'momiji',
  'pai joão',
  'pai joao',
  'o arroz da lista',
  'coqueiro',
  'união',
  'uniao',
  'doçúcar',
  'docucar',
  'glaçúcar',
  'glacucar',
  'neve',
  'da barra',
  'toddy',
  'mabel',
  'soya',
  'salada',
  'liza',
  'primor',
  'salsaretti',
  'mazola',
  'purilev',
  'maria',
  'pomarola',
  'elefante',
  'tarantella',
  'coamo',
  'quero',
  'caldao',
  'caldão',
  'knorr',
  'sao francisco',
  'são francisco',
  'gran mestri',
  'cantu',
  // Farmacêutico - OTC
  'benegrip',
  'engov',
  'neosaldina',
  'epocler',
  'estomazil',
  'coristina',
  'biotônico fontoura',
  'biotonico fontoura',
  'zero-cal',
  'adocyl',
  'merthiolate',
  'mantecorp',
  'ivy c',
  'epidrat',
  'dorflex',
  'novalgina',
  'dermacyd',
  'targifor',
  'advil',
  'centrum',
  'eno',
  'sensodyne',
  'corega',
  'cataflampro',
  'tylenol',
  'band-aid',
  'band aid',
  'listerine',
  'neutrogena',
  "johnson's",
  'johnsons',
  'sempre livre',
  'carefree',
  // Marcas genéricas comuns
  'jcw',
  'devile',
  'quality',
  'top quality',
  'aurora',
  'scala',
  'bic',
  'bompack',
  'bombril',
  'cottonbaby',
  'benalet',
];

// Marcas de produtos específicos (ovos, queijos, farmácia, etc)
const SPECIFIC_BRANDS = [
  'marutani',
  'friolar',
  'catupiry',
  'batavo',
  'batistense',
  'keldog',
  'kelco',
  'benassi',
  // Farmácia
  'ems',
  'rubenti',
  'concerta',
  'dozemast',
  'neutrofer',
  'vitergan',
];

// Combinar todas as marcas
KNOWN_BRANDS.push(...SPECIFIC_BRANDS);

// Words to remove from product names (unidades de medida e ruído)
const NOISE_WORDS = [
  // Unidades básicas
  'un',
  'und',
  'unid',
  'unidade',
  'pc',
  'pct',
  'pco',
  'pt',
  'pacote',
  'cx',
  'cxa',
  'cxs',
  'caixa',
  // Peso
  'kg',
  'kilo',
  'kq',
  'g',
  'gr',
  'grs',
  'grama',
  'gramas',
  'mg',
  // Volume
  'l',
  'lt',
  'ltr',
  'litro',
  'litros',
  'ml',
  'mililitro',
  'mili',
  // Embalagens
  'lata',
  'lta',
  'garrafa',
  'gfa',
  'gar',
  'pet',
  'vidro',
  'tp',
  'tba',
  'tb',
  'tetra pak',
  'bisn',
  'bisnaga',
  'bs',
  'bsn',
  'refil',
  'refi',
  'rfl',
  'sch',
  'sache',
  'sachê',
  'sa',
  'fardo',
  'fdo',
  'fd',
  'conj',
  'conjunto',
  'dz',
  'duz',
  'duzia',
  'dúzia',
  'bd',
  'bal',
  'balde',
  'resma',
  // Promoções
  'promocao',
  'promoção',
  'promo',
  'oferta',
  'desconto',
  'desc',
  'atacado',
  'combo',
  'kit',
  'leve',
  'pague',
  'lv',
  'pg',
  'pack',
  'promo pack',
  'gratis',
  'gr',
  'especial',
  // Modificadores temporais
  'venc',
  'vencimento',
  'prox',
  'proximo',
  'próximo',
  // Outros
  'de',
  'com',
  'para',
  'ate',
  'até',
  // Cores e variações
  'azul',
  'vermelho',
  'verde',
  'amarelo',
  'branco',
  'preto',
  'rosa',
  'roxo',
  // Tamanhos
  'pequeno',
  'medio',
  'grande',
  'gg',
  'ggg',
  'pp',
  'p',
  'm',
  'g',
  // Tipos de embalagem específicos
  'tetra',
  'pak',
  'pet',
  'vidro',
  'lata',
  'garrafa',
  'pote',
  'sache',
  'sachet',
  'refil',
  'bisnaga',
  'frasco',
  'spray',
  'aerosol',
  'plastico',
  // Números e códigos
  'c/',
  'c',
  's/',
  's',
  'n',
  'x',
  // Palavras comuns em produtos
  'tipo',
  'marca',
  'produto',
  'item',
  'novo',
  'nova',
  'extra',
  // Sabores comuns (serão removidos para generalizar)
  'sabor',
  'tradicional',
  'classico',
  'original',
  'natural',
  // Qualificadores de quantidade
  'mais',
  'menos',
  'super',
  'mega',
  'mini',
  'maxi',
];

// Common abbreviations to expand
const ABBREVIATIONS: Record<string, string> = {
  // Bebidas
  refrig: 'refrigerante',
  // Alimentos
  choc: 'chocolate',
  bov: 'bovino',
  moida: 'moída',
  crescpa: 'crespa',
  int: 'integral',
  uht: '',
  desn: 'desnatado',
  // Higiene
  'desc.': 'descartavel',
  desod: 'desodorante',
  shamp: 'shampoo',
  cond: 'condicionador',
  sab: 'sabonete',
  sabao: 'sabão',
  // Limpeza
  deterg: 'detergente',
  amaciante: 'amaciante',
  amac: 'amaciante',
  limp: 'limpeza',
  desinf: 'desinfetante',
  desinfet: 'desinfetante',
  // Outros
  alcool: 'álcool',
  alc: 'álcool',
  cx: '',
  pct: '',
  lt: '',
  ml: '',
  gr: '',
  grs: '',
  kg: '',
  kilo: '',
  mag: '',
  cp: '',
  cpr: '',
  caps: '',
  cap: '',
  trad: '',
  bco: 'branco',
  bc: 'branco',
  bol: '',
  sl: '',
  rev: '',
  lp: '',
  frit: 'frito',
  conc: 'concentrado',
  bisc: 'biscoito',
  energ: 'energetico',
  roup: 'roupa',
  pal: '',
  fem: '',
  masc: '',
  inf: 'infantil',
  ad: 'adulto',
  jun: 'junior',
  tb: '',
  pc: '',
  achoc: 'achocolatado',
  refr: 'refrigerante',
  min: 'mineral',
  temp: 'tempero',
  cg: '',
  bd: '',
  tr: '',
  vac: '',
  az: '',
  beb: 'bebida',
  las: '',
  mc: '',
  abs: '',
  ald: '',
  apar: 'aparelho',
  depil: 'depilacao',
  gel: '',
  ess: 'essencia',
  essencia: 'essencia',
  po: 'po',
  pó: 'po',
  sol: 'soluvel',
  solúvel: 'soluvel',
  inst: 'instantaneo',
  instantâneo: 'instantaneo',
  org: 'organico',
  orgânico: 'organico',
  organi: 'organico',
  polpa: '',
  integ: 'integral',
  desnatado: 'desnatado',
};

// Minimum similarity threshold for matching (0-1)
const SIMILARITY_THRESHOLD = 0.75;

// ============================================
// Product Normalization Service
// ============================================

export class ProductNormalizationService {
  /**
   * Extract brand from product name
   */
  private extractBrand(productName: string): string | undefined {
    if (!productName) return undefined;

    const lowerName = productName.toLowerCase();

    // Check for known brands
    for (const brand of KNOWN_BRANDS) {
      const brandPattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (brandPattern.test(lowerName)) {
        // Return the brand with proper capitalization
        const match = productName.match(brandPattern);
        return match ? match[0] : brand;
      }
    }

    // Try to extract brand from common patterns
    // Pattern: "Brand Name" followed by product description
    const words = productName.split(/\s+/);
    if (words.length >= 2) {
      // Check if first 1-2 words could be a brand (capitalized, not common words)
      const potentialBrand = words.slice(0, 2).join(' ');
      if (/^[A-Z][a-z]*(\s[A-Z][a-z]*)?$/.test(potentialBrand)) {
        return potentialBrand;
      }
    }

    return undefined;
  }

  /**
   * Detect if product is on promotion
   */
  private isPromotion(productName: string): boolean {
    if (!productName) return false;

    const lowerName = productName.toLowerCase();
    return PROMOTION_KEYWORDS.some((keyword) => lowerName.includes(keyword));
  }

  /**
   * Normalize a product name
   */
  normalizeProductName(productName: string): string {
    if (!productName) return '';

    let normalized = productName;
    let extractedBrand: string | undefined;
    let isPharmacy = false;
    let pillCount: string | undefined;

    // Convert to lowercase for processing
    const lowerName = normalized.toLowerCase();

    // Check if it's a pharmacy product (has cpr, caps, comp, etc + number)
    const pharmacyPatterns = [
      /(\d+)\s*(cpr|caps|cap|comp|comprimido|comprimidos|capsula|cápsulas)/gi,
      /(cpr|caps|cap|comp|comprimido|comprimidos|capsula|cápsulas)\s*(\d+)/gi,
    ];

    for (const pattern of pharmacyPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        isPharmacy = true;
        // Extract the number from the match
        const numMatch = match[0].match(/\d+/);
        if (numMatch) {
          pillCount = numMatch[0];
        }
        break;
      }
    }

    // Convert to lowercase first for consistent processing
    normalized = normalized.toLowerCase();

    // Expand abbreviations BEFORE removing brand (so "int" becomes "integral")
    for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      if (full) {
        // If full is not empty, replace with the full word
        normalized = normalized.replace(regex, full);
      } else {
        // If full is empty, remove the abbreviation
        normalized = normalized.replace(regex, ' ');
      }
    }

    // Extract and remove brand from the name AFTER expanding abbreviations
    for (const brand of KNOWN_BRANDS) {
      const brandPattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (brandPattern.test(normalized)) {
        extractedBrand = brand;
        normalized = normalized.replace(brandPattern, ' ');
        break;
      }
    }

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Remove special characters but keep accents and numbers
    normalized = normalized.replace(/[^\w\sáàâãéèêíïóôõöúçñ\d]/gi, ' ');

    // For pharmacy products, preserve the pill count in a clean format
    if (isPharmacy && pillCount) {
      // Remove all numbers first
      normalized = normalized.replace(/\d+/g, ' ');
      // Then remove pharmacy-specific words
      normalized = normalized.replace(/\b(cpr|caps|cap|comp|comprimido|comprimidos|capsula|cápsulas)\b/gi, '');
    } else {
      // For non-pharmacy products, remove all numbers
      normalized = normalized.replace(/\d+/g, ' ');
    }

    // Remove noise words and promotion keywords
    const words = normalized.split(' ');
    const filteredWords = words.filter((word) => {
      const lowerWord = word.toLowerCase();
      return !NOISE_WORDS.includes(lowerWord) && word.length > 1;
    });
    normalized = filteredWords.join(' ');

    // Remove duplicate words
    const uniqueWords = [...new Set(normalized.split(' '))];
    normalized = uniqueWords.join(' ');

    // Final trim and cleanup
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Capitalize first letter of each word for better readability
    normalized = normalized
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // For pharmacy products, append the pill count at the end
    if (isPharmacy && pillCount) {
      normalized = `${normalized} ${pillCount} Comprimidos`;
    }

    return normalized;
  }

  /**
   * Normalize a product with all its information
   */
  normalizeProduct(productName: string, productCode?: string, ncmCode?: string): NormalizedProduct {
    if (!productName) {
      return {
        normalizedName: '',
        originalName: '',
        productCode,
        ncmCode,
        brand: undefined,
        isPromotion: false,
      };
    }

    const brand = this.extractBrand(productName);
    const isPromo = this.isPromotion(productName);

    return {
      normalizedName: this.normalizeProductName(productName),
      originalName: productName,
      productCode,
      ncmCode,
      brand,
      isPromotion: isPromo,
    };
  }

  /**
   * Check if two products match based on name, code, or NCM
   */
  matchProducts(product1: NormalizedProduct, product2: NormalizedProduct): ProductMatchResult {
    // Exact match on product code (EAN/GTIN)
    if (product1.productCode && product2.productCode && product1.productCode === product2.productCode) {
      return {
        isMatch: true,
        confidence: 1.0,
      };
    }

    // High confidence match on NCM code + similar name
    if (product1.ncmCode && product2.ncmCode && product1.ncmCode === product2.ncmCode) {
      const nameSimilarity = this.calculateSimilarity(product1.normalizedName, product2.normalizedName);

      if (nameSimilarity >= 0.6) {
        return {
          isMatch: true,
          confidence: 0.9,
        };
      }
    }

    // Name-based matching
    const nameSimilarity = this.calculateSimilarity(product1.normalizedName, product2.normalizedName);

    if (nameSimilarity >= SIMILARITY_THRESHOLD) {
      return {
        isMatch: true,
        confidence: nameSimilarity,
      };
    }

    return {
      isMatch: false,
      confidence: nameSimilarity,
    };
  }

  /**
   * Find matching product from a list of existing products
   */
  findMatchingProduct(
    newProduct: NormalizedProduct,
    existingProducts: Array<NormalizedProduct & { id: string }>,
  ): ProductMatchResult {
    let bestMatch: ProductMatchResult = {
      isMatch: false,
      confidence: 0,
    };

    for (const existingProduct of existingProducts) {
      const matchResult = this.matchProducts(newProduct, existingProduct);

      if (matchResult.isMatch && matchResult.confidence > bestMatch.confidence) {
        bestMatch = {
          ...matchResult,
          matchedProductId: existingProduct.id,
        };

        // If we found a perfect match, no need to continue
        if (matchResult.confidence === 1.0) {
          break;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    // Use Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    // Convert distance to similarity (0-1)
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Extract size/quantity from product name
   */
  extractSize(productName: string): string | null {
    // Common size patterns: 500ml, 1kg, 2l, etc.
    const sizePattern = /(\d+(?:\.\d+)?)\s*(ml|l|kg|g|mg|un|unid)/i;
    const match = productName.match(sizePattern);

    if (match) {
      return `${match[1]}${match[2].toLowerCase()}`;
    }

    return null;
  }

  /**
   * Generate a canonical product key for grouping
   */
  generateProductKey(product: NormalizedProduct): string {
    const parts: string[] = [];

    // Use product code if available (most reliable)
    if (product.productCode) {
      parts.push(`code:${product.productCode}`);
    }

    // Use NCM code
    if (product.ncmCode) {
      parts.push(`ncm:${product.ncmCode}`);
    }

    // Use normalized name
    if (product.normalizedName) {
      // Take first 3 significant words
      const words = product.normalizedName.split(' ').slice(0, 3);
      parts.push(`name:${words.join('-')}`);
    }

    return parts.join('|');
  }

  /**
   * Batch normalize multiple products
   */
  batchNormalize(
    products: Array<{
      name: string;
      productCode?: string;
      ncmCode?: string;
    }>,
  ): NormalizedProduct[] {
    return products.map((product) => this.normalizeProduct(product.name, product.productCode, product.ncmCode));
  }

  /**
   * Group similar products together
   */
  groupSimilarProducts(products: NormalizedProduct[]): Map<string, NormalizedProduct[]> {
    const groups = new Map<string, NormalizedProduct[]>();

    for (const product of products) {
      const key = this.generateProductKey(product);

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(product);
    }

    return groups;
  }
}

// Export singleton instance
export const productNormalizationService = new ProductNormalizationService();
