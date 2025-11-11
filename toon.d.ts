/**
 * Type declarations for toon package
 * @see https://github.com/toon-format/toon
 */

declare module '@toon-format/toon' {
  /**
   * Encoding options for TOON format
   */
  export interface EncodeOptions {
    /**
     * Number of spaces per indentation level
     * @default 2
     */
    indent?: number;

    /**
     * Delimiter for array values and tabular rows
     * @default ','
     */
    delimiter?: ',' | '\t' | '|';

    /**
     * Enable key folding to collapse single-key wrapper chains into dotted paths
     * @default 'off'
     */
    keyFolding?: 'off' | 'safe';

    /**
     * Maximum number of segments to fold when keyFolding is enabled
     * @default Infinity
     */
    flattenDepth?: number;
  }

  /**
   * Decoding options for TOON format
   */
  export interface DecodeOptions {
    /**
     * Expected number of spaces per indentation level
     * @default 2
     */
    indent?: number;

    /**
     * Enable strict validation
     * @default true
     */
    strict?: boolean;

    /**
     * Enable path expansion to reconstruct dotted keys into nested objects
     * @default 'off'
     */
    expandPaths?: 'off' | 'safe';
  }

  /**
   * Encode any JSON-serializable value to TOON format
   * @param value - Any JSON-serializable value
   * @param options - Optional encoding options
   * @returns TOON-formatted string
   */
  export function encode(value: unknown, options?: EncodeOptions): string;

  /**
   * Decode a TOON-formatted string back to JavaScript values
   * @param input - A TOON-formatted string to parse
   * @param options - Optional decoding options
   * @returns JavaScript value (object, array, or primitive)
   */
  export function decode(input: string, options?: DecodeOptions): unknown;
}
