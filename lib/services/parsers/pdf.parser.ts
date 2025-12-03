import path from 'path';
import { PDFParse } from 'pdf-parse';
// @ts-ignore
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure worker for Node.js environment to avoid "fake worker" errors in Next.js
if (typeof window === 'undefined') {
  try {
    // Point to the worker file in node_modules
    pdfjs.GlobalWorkerOptions.workerSrc = path.join(
      process.cwd(),
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    );
  } catch (e) {
    console.warn('Failed to configure PDF worker:', e);
  }
}

export interface PdfTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  metadata?: any;
}

export class PDFParser {
  /**
   * Parse PDF buffer and extract text
   */
  async parseText(buffer: Buffer): Promise<string> {
    try {
      console.log('Parsing PDF buffer of size:', buffer.length);
      const parser = new PDFParse(new Uint8Array(buffer));
      const data = await parser.getText();
      console.log('PDF parsed successfully, text length:', data.text.length);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Check if file is a PDF
   */
  canParse(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Extract potential items from text using heuristics
   */
  extractItemsFromText(text: string): any[] {
    const lines = text.split('\n');
    const items: any[] = [];

    // Regex to identify lines with quantity and price
    // Format 1: "Product Name 2 UN 10,00 20,00" (Qty before Unit)
    const itemRegexQtyFirst =
      /(.+?)\s+(\d+(?:[.,]\d+)?)\s+(?:UN|KG|L|PC|CX)\s+(?:R\$\s*)?(\d+(?:[.,]\d+)?)\s+(?:R\$\s*)?(\d+(?:[.,]\d+)?)/i;

    // Format 2: "Product Name 01234 UN 1 10,00 10,00" (Code before Unit, Qty after Unit)
    const itemRegexCodeFirst =
      /(.+?)\s+(\d+)\s+(?:UN|KG|L|PC|CX)\s+(\d+(?:[.,]\d+)?)\s+(?:R\$\s*)?(\d+(?:[.,]\d+)?)\s+(?:R\$\s*)?(\d+(?:[.,]\d+)?)/i;

    // Format 3: "01234 UN 1 10,00 10,00" (Starts with Code, Description on previous lines)
    const itemRegexStartWithCode =
      /^(\d+)\s+(?:UN|KG|L|PC|CX)\s+(\d+(?:[.,]\d+)?)\s+(?:R\$\s*)?(\d+(?:[.,]\d+)?)\s+(?:R\$\s*)?(\d+(?:[.,]\d+)?)/i;

    // Fallback regex for Service Invoices (NFS-e) or simple lists
    // Matches: Description ... Price (at the end of line)
    // Must end with 2 decimals to avoid matching years or integers
    const serviceRegex = /(.+?)\s+(?:R\$\s*)?(\d+[.,]\d{2})$/i;

    let descriptionBuffer: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip headers/footers or short lines
      if (trimmedLine.length < 5 || trimmedLine.includes('.......')) continue;

      // Skip common metadata lines
      if (
        trimmedLine.match(
          /total|valor|base|calculo|iss|aliquota|imposto|tributo|cofins|pis|inss|irrf|csll|fust|funttel|telefone|nota fiscal|série|modelo|chave|acesso|protocolo|cliente|endereço|cidade|cnpj|ie:|vencimento|referência|impresso|pagina|reservado|informações/i,
        )
      ) {
        descriptionBuffer = []; // Clear buffer if we hit metadata
        continue;
      }

      // Skip lines that are just numbers/spaces (like Access Keys)
      if (trimmedLine.replace(/[\s.]/g, '').match(/^\d+$/)) {
        descriptionBuffer = [];
        continue;
      }

      // Skip lines starting with R$ (usually totals)
      if (trimmedLine.startsWith('R$')) {
        descriptionBuffer = [];
        continue;
      }

      // Try Format 3 (Starts with Code) - Uses buffer for description
      let match = trimmedLine.match(itemRegexStartWithCode);
      if (match) {
        // match[1] is code
        const quantity = parseFloat(match[2].replace(',', '.'));
        const unitPrice = parseFloat(match[3].replace(',', '.'));
        const totalPrice = parseFloat(match[4].replace(',', '.'));

        const description = descriptionBuffer.join(' ').trim();

        if (description && !isNaN(quantity) && !isNaN(totalPrice)) {
          items.push({
            description,
            quantity,
            unitPrice,
            totalPrice,
            discountAmount: 0,
          });
          descriptionBuffer = [];
          continue;
        }
      }

      // Try Format 2 (Code before Unit)
      match = trimmedLine.match(itemRegexCodeFirst);
      if (match) {
        const lineDesc = match[1].trim();
        const description = [...descriptionBuffer, lineDesc].join(' ').trim();

        // match[2] is code
        const quantity = parseFloat(match[3].replace(',', '.'));
        const unitPrice = parseFloat(match[4].replace(',', '.'));
        const totalPrice = parseFloat(match[5].replace(',', '.'));

        if (description && !isNaN(quantity) && !isNaN(totalPrice)) {
          items.push({
            description,
            quantity,
            unitPrice,
            totalPrice,
            discountAmount: 0,
          });
          descriptionBuffer = [];
          continue;
        }
      }

      // Try Format 1 (Qty before Unit)
      match = trimmedLine.match(itemRegexQtyFirst);
      if (match) {
        const lineDesc = match[1].trim();
        const description = [...descriptionBuffer, lineDesc].join(' ').trim();

        const quantity = parseFloat(match[2].replace(',', '.'));
        const unitPrice = parseFloat(match[3].replace(',', '.'));
        const totalPrice = parseFloat(match[4].replace(',', '.'));

        if (description && !isNaN(quantity) && !isNaN(totalPrice)) {
          items.push({
            description,
            quantity,
            unitPrice,
            totalPrice,
            discountAmount: 0,
          });
          descriptionBuffer = [];
          continue;
        }
      }

      // Try fallback regex
      match = trimmedLine.match(serviceRegex);
      if (match) {
        const lineDesc = match[1].trim();
        const price = parseFloat(match[2].replace(',', '.'));

        // Filter out common metadata lines that look like items
        if (
          lineDesc.match(
            /total|valor|base|calculo|iss|aliquota|imposto|tributo|cofins|pis|inss|irrf|csll|fust|funttel|telefone|nota fiscal|série|modelo|chave|acesso|protocolo|cliente|endereço|cidade|cnpj|ie:|vencimento|referência|impresso|pagina|reservado|informações/i,
          )
        ) {
          descriptionBuffer = [];
          continue;
        }

        if (lineDesc && !isNaN(price)) {
          // For service regex, we might want to use the buffer too, but it's risky.
          // Let's assume service regex lines usually contain the full description.
          // Or we can append to buffer?
          // If we append to buffer, we might consume it later?
          // No, if we match here, we consume it.

          // Let's check if this looks like a valid item
          items.push({
            description: lineDesc,
            quantity: 1,
            unitPrice: price,
            totalPrice: price,
            discountAmount: 0,
          });
          descriptionBuffer = [];
          continue;
        }
      }

      // If no match, add to buffer
      descriptionBuffer.push(trimmedLine);
    }

    return items;
  }

  /**
   * Extract metadata from text
   */
  extractMetadata(text: string): {
    accessKey?: string;
    invoiceNumber?: string;
    series?: string;
    issueDate?: Date;
    merchantCNPJ?: string;
    merchantName?: string;
    totalAmount?: number;
  } {
    const metadata: any = {};

    // Extract Access Key (44 digits)
    // Look for lines containing 44 digits, possibly with spaces
    const accessKeyMatch = text.match(
      /\b(\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4})\b/,
    );
    if (accessKeyMatch) {
      metadata.accessKey = accessKeyMatch[1].replace(/\s/g, '');
    }

    // Extract Invoice Number
    // Pattern: "NOTA FISCAL FATURA Nº: 000035362"
    const invoiceNumberMatch = text.match(/N[ºo°].?\s*(\d+)/i);
    if (invoiceNumberMatch) {
      metadata.invoiceNumber = invoiceNumberMatch[1];
    }

    // Extract Series
    // Pattern: "SÉRIE: 001"
    const seriesMatch = text.match(/S[ée]rie:?\s*(\d+)/i);
    if (seriesMatch) {
      metadata.series = seriesMatch[1];
    }

    // Extract Issue Date
    // Pattern: "DATA DE EMISSÃO: 02/12/2025"
    const dateMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      metadata.issueDate = new Date(parseInt(dateMatch[3]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
    }

    // Extract Merchant CNPJ
    // Pattern: "CNPJ: 29.911.764/0001-10"
    const cnpjMatch = text.match(/CNPJ:?\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
    if (cnpjMatch) {
      metadata.merchantCNPJ = cnpjMatch[1].replace(/[^\d]/g, '');
    }

    // Extract Merchant Name
    // Usually the first line or near "RAZÃO SOCIAL:"
    const merchantNameMatch = text.match(/RAZÃO SOCIAL:?\s*(.+)/i);
    if (merchantNameMatch) {
      metadata.merchantName = merchantNameMatch[1].trim();
    } else {
      // Fallback: first non-empty line
      const firstLine = text.split('\n').find((l) => l.trim().length > 0);
      if (firstLine) metadata.merchantName = firstLine.trim();
    }

    // Extract Total Amount
    // Pattern: "Total: R$ 139,90" or "VALOR TOTAL NFCOM ... R$ 139,90"
    // We look for the last occurrence of a currency value associated with "Total"
    const totalMatches = [...text.matchAll(/Total(?:.*?)R\$\s*(\d+[.,]\d{2})/gi)];
    if (totalMatches.length > 0) {
      const lastMatch = totalMatches[totalMatches.length - 1];
      metadata.totalAmount = parseFloat(lastMatch[1].replace('.', '').replace(',', '.'));
    }

    return metadata;
  }
}
