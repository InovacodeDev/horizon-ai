/**
 * TOON Format Utility
 *
 * Provides utilities to convert data to TOON format for token-efficient AI prompts.
 * TOON (Tabular Object Oriented Notation) reduces token usage by 20-60% compared to JSON
 * while maintaining high accuracy for LLM comprehension.
 *
 * @see https://github.com/toon-format/toon
 */
import { decode, encode } from '@toon-format/toon';

/**
 * Encode data to TOON format with tab delimiters for maximum token efficiency
 */
export function encodeToToon(data: unknown): string {
  return encode(data, {
    delimiter: '\t', // Tab delimiter for better tokenization
    indent: 2,
  });
}

/**
 * Decode TOON format back to JavaScript objects
 */
export function decodeFromToon(toonData: string): unknown {
  return decode(toonData, {
    indent: 2,
    strict: true,
  });
}

/**
 * Format data for AI prompts using TOON
 * Wraps TOON data in a code block with instructions for the AI
 */
export function formatForAIPrompt(data: unknown, description?: string): string {
  const toonData = encodeToToon(data);
  const header = description ? `${description} (TOON format - tab-separated):\n` : 'Data (TOON format):\n';

  return `${header}\`\`\`toon
${toonData}
\`\`\``;
}

/**
 * Calculate approximate token savings using TOON vs JSON
 * Returns percentage saved and token counts
 */
export function calculateTokenSavings(data: unknown): {
  jsonTokens: number;
  toonTokens: number;
  savedTokens: number;
  savedPercentage: number;
} {
  const jsonStr = JSON.stringify(data, null, 2);
  const toonStr = encodeToToon(data);

  // Rough token estimation (1 token ≈ 4 characters for English text)
  const jsonTokens = Math.ceil(jsonStr.length / 4);
  const toonTokens = Math.ceil(toonStr.length / 4);
  const savedTokens = jsonTokens - toonTokens;
  const savedPercentage = ((savedTokens / jsonTokens) * 100).toFixed(1);

  return {
    jsonTokens,
    toonTokens,
    savedTokens,
    savedPercentage: parseFloat(savedPercentage),
  };
}
