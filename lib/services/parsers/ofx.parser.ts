import type { OFXAccountInfo, OFXData, OFXTransaction, ParsedTransaction, Parser } from '@/lib/types';
import { ImportError, ImportErrorCode } from '@/lib/types';
import { XMLParser } from 'fast-xml-parser';
import { v4 as uuidv4 } from 'uuid';

/**
 * OFX Parser - Parses Open Financial Exchange (OFX) files
 * Supports both OFX v1 (SGML) and OFX v2 (XML) formats
 */
export class OFXParser implements Parser {
  private xmlParser: XMLParser;

  constructor() {
    // Configure XML parser for OFX v2 format
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
      ignoreDeclaration: true,
      removeNSPrefix: true,
    });
  }

  /**
   * Check if this parser can handle the file
   */
  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.ofx');
  }

  /**
   * Parse OFX file and extract transactions
   */
  async parse(fileContent: string | Buffer): Promise<ParsedTransaction[]> {
    try {
      const content = typeof fileContent === 'string' ? fileContent : fileContent.toString('utf-8');

      // Detect OFX version and parse accordingly
      const ofxData = this.detectVersionAndParse(content);

      // Extract transactions
      const transactions = this.extractTransactions(ofxData);

      if (transactions.length === 0) {
        throw new ImportError('No transactions found in OFX file', ImportErrorCode.NO_TRANSACTIONS_FOUND);
      }

      return transactions;
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }

      throw new ImportError(
        `Failed to parse OFX file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Get account information from OFX file
   * This is used for account matching
   */
  async getAccountInfo(fileContent: string | Buffer): Promise<OFXAccountInfo | undefined> {
    try {
      const content = typeof fileContent === 'string' ? fileContent : fileContent.toString('utf-8');

      // Detect OFX version and parse accordingly
      const ofxData = this.detectVersionAndParse(content);

      return ofxData.accountInfo;
    } catch (error) {
      // Return undefined if we can't extract account info
      console.error('Failed to extract account info from OFX:', error);
      return undefined;
    }
  }

  /**
   * Detect OFX version and parse accordingly
   */
  private detectVersionAndParse(content: string): OFXData {
    // Check for OFX header
    const headerMatch = content.match(/OFXHEADER:(\d+)/);
    if (!headerMatch) {
      throw new ImportError('Invalid OFX file: Missing OFXHEADER', ImportErrorCode.MALFORMED_FILE);
    }

    // Check for version in header
    const versionMatch = content.match(/VERSION:(\d+)/);
    const version = versionMatch ? versionMatch[1] : '102';

    // OFX v1 uses SGML format (version 102 or lower)
    // OFX v2 uses XML format (version 200 or higher)
    const isV1 = parseInt(version) < 200;

    if (isV1) {
      return this.parseOFXv1(content);
    } else {
      return this.parseOFXv2(content);
    }
  }

  /**
   * Parse OFX v1 (SGML format)
   */
  private parseOFXv1(content: string): OFXData {
    try {
      // Remove header section (everything before <OFX>)
      const ofxStartIndex = content.indexOf('<OFX>');
      if (ofxStartIndex === -1) {
        throw new ImportError('Invalid OFX file: Missing <OFX> tag', ImportErrorCode.MALFORMED_FILE);
      }

      const ofxContent = content.substring(ofxStartIndex);

      // Convert SGML to XML by closing self-closing tags
      // OFX v1 uses SGML which doesn't require closing tags
      const xmlContent = this.convertSGMLToXML(ofxContent);

      // Parse as XML
      const parsed = this.xmlParser.parse(xmlContent);

      return this.extractOFXData(parsed, '1');
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }

      throw new ImportError(
        `Failed to parse OFX v1 file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Parse OFX v2 (XML format)
   */
  private parseOFXv2(content: string): OFXData {
    try {
      // Remove header section (everything before <?xml or <OFX>)
      let ofxContent = content;
      const xmlDeclIndex = content.indexOf('<?xml');
      const ofxStartIndex = content.indexOf('<OFX>');

      if (xmlDeclIndex !== -1) {
        ofxContent = content.substring(xmlDeclIndex);
      } else if (ofxStartIndex !== -1) {
        ofxContent = content.substring(ofxStartIndex);
      }

      // Parse XML
      const parsed = this.xmlParser.parse(ofxContent);

      return this.extractOFXData(parsed, '2');
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }

      throw new ImportError(
        `Failed to parse OFX v2 file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Convert SGML to XML by closing self-closing tags
   */
  private convertSGMLToXML(sgml: string): string {
    // List of OFX tags that should be self-closing
    const selfClosingTags = [
      'DTSERVER',
      'LANGUAGE',
      'ORG',
      'FID',
      'CODE',
      'SEVERITY',
      'TRNUID',
      'CURDEF',
      'BANKID',
      'BRANCHID',
      'ACCTID',
      'ACCTTYPE',
      'DTSTART',
      'DTEND',
      'TRNTYPE',
      'DTPOSTED',
      'TRNAMT',
      'FITID',
      'NAME',
      'MEMO',
      'CHECKNUM',
      'BALAMT',
      'DTASOF',
    ];

    let xml = sgml;

    // Close self-closing tags
    for (const tag of selfClosingTags) {
      // Match opening tag with content but no closing tag
      const regex = new RegExp(`<${tag}>([^<]*?)(?=<(?!/${tag}>))`, 'g');
      xml = xml.replace(regex, `<${tag}>$1</${tag}>`);
    }

    return xml;
  }

  /**
   * Extract OFX data from parsed XML
   */
  private extractOFXData(parsed: any, version: '1' | '2'): OFXData {
    const ofx = parsed.OFX;
    if (!ofx) {
      throw new ImportError('Invalid OFX structure: Missing OFX element', ImportErrorCode.MALFORMED_FILE);
    }

    // Extract account information
    const accountInfo = this.extractAccountInfo(ofx);

    // Extract transactions
    const transactions = this.extractOFXTransactions(ofx);

    return {
      version,
      accountInfo,
      transactions,
    };
  }

  /**
   * Extract bank account information from OFX data
   */
  private extractAccountInfo(ofx: any): OFXAccountInfo | undefined {
    try {
      const bankMsgs = ofx.BANKMSGSRSV1;
      if (!bankMsgs) return undefined;

      const stmtTrnRs = bankMsgs.STMTTRNRS;
      if (!stmtTrnRs) return undefined;

      const stmtRs = stmtTrnRs.STMTRS;
      if (!stmtRs) return undefined;

      const bankAcctFrom = stmtRs.BANKACCTFROM;
      if (!bankAcctFrom) return undefined;

      return {
        BANKID: this.getTextValue(bankAcctFrom.BANKID),
        BRANCHID: this.getTextValue(bankAcctFrom.BRANCHID),
        ACCTID: this.getTextValue(bankAcctFrom.ACCTID),
        ACCTTYPE: this.getTextValue(bankAcctFrom.ACCTTYPE),
      };
    } catch (error) {
      // Account info is optional, so we don't throw an error
      return undefined;
    }
  }

  /**
   * Extract OFX transactions from parsed data
   */
  private extractOFXTransactions(ofx: any): OFXTransaction[] {
    try {
      const bankMsgs = ofx.BANKMSGSRSV1;
      if (!bankMsgs) {
        throw new ImportError('Invalid OFX structure: Missing BANKMSGSRSV1', ImportErrorCode.MALFORMED_FILE);
      }

      const stmtTrnRs = bankMsgs.STMTTRNRS;
      if (!stmtTrnRs) {
        throw new ImportError('Invalid OFX structure: Missing STMTTRNRS', ImportErrorCode.MALFORMED_FILE);
      }

      const stmtRs = stmtTrnRs.STMTRS;
      if (!stmtRs) {
        throw new ImportError('Invalid OFX structure: Missing STMTRS', ImportErrorCode.MALFORMED_FILE);
      }

      const bankTranList = stmtRs.BANKTRANLIST;
      if (!bankTranList) {
        throw new ImportError('Invalid OFX structure: Missing BANKTRANLIST', ImportErrorCode.MALFORMED_FILE);
      }

      const stmtTrn = bankTranList.STMTTRN;
      if (!stmtTrn) {
        return [];
      }

      // Handle both single transaction and array of transactions
      const transactions = Array.isArray(stmtTrn) ? stmtTrn : [stmtTrn];

      return transactions.map((trn) => ({
        TRNTYPE: this.getTextValue(trn.TRNTYPE) || '',
        DTPOSTED: this.getTextValue(trn.DTPOSTED) || '',
        TRNAMT: this.getTextValue(trn.TRNAMT) || '0',
        FITID: this.getTextValue(trn.FITID) || '',
        NAME: this.getTextValue(trn.NAME),
        MEMO: this.getTextValue(trn.MEMO),
        CHECKNUM: this.getTextValue(trn.CHECKNUM),
      }));
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }

      throw new ImportError(
        `Failed to extract transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Extract transactions from OFX data and convert to ParsedTransaction format
   */
  private extractTransactions(ofxData: OFXData): ParsedTransaction[] {
    const parsedTransactions: ParsedTransaction[] = [];

    for (const ofxTrn of ofxData.transactions) {
      try {
        const parsed = this.convertTransaction(ofxTrn);

        // Skip transactions with zero amount (like "Saldo do dia" or "Saldo Anterior")
        if (parsed.amount === 0) {
          continue;
        }

        parsedTransactions.push(parsed);
      } catch (error) {
        // Log error but continue processing other transactions
        console.error('Failed to convert transaction:', error, ofxTrn);
      }
    }

    return parsedTransactions;
  }

  /**
   * Convert OFX transaction to ParsedTransaction format
   */
  private convertTransaction(ofxTrn: OFXTransaction): ParsedTransaction {
    // Parse amount
    const amount = Math.abs(parseFloat(ofxTrn.TRNAMT));

    // Determine transaction type based on TRNTYPE and amount sign
    const type = ofxTrn.TRNTYPE === 'CREDIT' || parseFloat(ofxTrn.TRNAMT) > 0 ? 'income' : 'expense';

    // Parse date
    const date = this.parseOFXDate(ofxTrn.DTPOSTED);

    // Build description from NAME and MEMO
    const description = this.buildDescription(ofxTrn.NAME, ofxTrn.MEMO);

    return {
      id: uuidv4(),
      date,
      amount,
      type,
      description,
      externalId: ofxTrn.FITID || undefined,
      metadata: {
        ofxType: ofxTrn.TRNTYPE,
        name: ofxTrn.NAME,
        memo: ofxTrn.MEMO,
        checkNum: ofxTrn.CHECKNUM,
      },
    };
  }

  /**
   * Parse OFX date format to ISO 8601
   * OFX date format: YYYYMMDDHHMMSS[.SSS][offset]
   * Example: 20251103000000[-3:BRT]
   */
  private parseOFXDate(dateStr: string): string {
    if (!dateStr) {
      throw new ImportError('Missing date in transaction', ImportErrorCode.INVALID_DATE_FORMAT);
    }

    try {
      // Remove timezone offset if present (e.g., [-3:BRT])
      const cleanDate = dateStr.replace(/\[.*?\]/, '').trim();

      // Extract date components
      const year = cleanDate.substring(0, 4);
      const month = cleanDate.substring(4, 6);
      const day = cleanDate.substring(6, 8);

      // Validate date components
      if (!year || !month || !day) {
        throw new Error('Invalid date format');
      }

      // Create ISO 8601 date string (YYYY-MM-DD)
      const isoDate = `${year}-${month}-${day}`;

      // Validate the date
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date value');
      }

      return isoDate;
    } catch (error) {
      throw new ImportError(`Invalid OFX date format: ${dateStr}`, ImportErrorCode.INVALID_DATE_FORMAT, {
        originalDate: dateStr,
        error,
      });
    }
  }

  /**
   * Build transaction description from NAME and MEMO fields
   */
  private buildDescription(name?: string, memo?: string): string {
    const parts: string[] = [];

    if (name && name.trim()) {
      parts.push(name.trim());
    }

    if (memo && memo.trim()) {
      parts.push(memo.trim());
    }

    if (parts.length === 0) {
      return 'Transação sem descrição';
    }

    return parts.join(' - ');
  }

  /**
   * Get text value from parsed XML node
   * Handles both direct values and objects with #text property
   */
  private getTextValue(value: any): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'object' && '#text' in value) {
      return String(value['#text']);
    }

    return String(value);
  }
}
