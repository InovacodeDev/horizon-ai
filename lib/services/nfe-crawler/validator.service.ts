/**
 * NFe Web Crawler with AI Extraction - Validator Service
 *
 * Service for validating and normalizing AI-extracted invoice data.
 * Ensures data quality and consistency before returning to clients.
 */
import { TOTAL_VERIFICATION_TOLERANCE, VALIDATION_RULES } from './constants';
import { loggerService } from './logger.service';
import { AIParseResponse, IValidatorService, ValidationResult, ValidationRule } from './types';

/**
 * Validator Service implementation
 * Validates AI-parsed invoice data against defined rules
 */
export class ValidatorService implements IValidatorService {
  /**
   * Validate complete parsed invoice
   * @param data - AI parsed invoice data
   * @returns Validation result with errors if any
   */
  validate(data: AIParseResponse): ValidationResult {
    const startTime = loggerService.startPerformanceTracking('validate-invoice');
    const errors: string[] = [];

    loggerService.info('validator', 'validate', 'Starting validation', {
      merchant: data.merchant.name,
      itemCount: data.items.length,
    });

    // Validate merchant data
    this.validateMerchant(data.merchant, errors);

    // Validate invoice metadata
    this.validateInvoice(data.invoice, errors);

    // Validate items
    this.validateItems(data.items, errors);

    // Validate totals
    this.validateTotals(data.totals, errors);

    // Verify totals match item sum
    if (!this.verifyTotals(data.items, data.totals)) {
      errors.push('Total amount does not match sum of item prices');
    }

    const isValid = errors.length === 0;

    // Log validation result
    const invoiceKey = data.invoice.number || 'unknown';
    loggerService.logValidation(invoiceKey, isValid, errors);
    loggerService.endPerformanceTracking(startTime, isValid);

    return {
      isValid,
      errors,
    };
  }

  /**
   * Validate merchant information
   */
  private validateMerchant(merchant: AIParseResponse['merchant'], errors: string[]): void {
    const rules = VALIDATION_RULES.merchant;

    // Validate CNPJ
    if (rules.cnpj.required && !merchant.cnpj) {
      errors.push('Merchant CNPJ is required');
    } else if (merchant.cnpj && !this.validateCNPJ(merchant.cnpj)) {
      errors.push('Merchant CNPJ is invalid (must be 14 digits)');
    }

    // Validate name
    if (rules.name.required && !merchant.name) {
      errors.push('Merchant name is required');
    } else if (merchant.name && rules.name.minLength && merchant.name.length < rules.name.minLength) {
      errors.push(`Merchant name must be at least ${rules.name.minLength} characters`);
    }

    // Validate state
    if (merchant.state && rules.state.pattern && !rules.state.pattern.test(merchant.state)) {
      errors.push('Merchant state must be 2 uppercase letters (e.g., SP, RJ)');
    }
  }

  /**
   * Validate invoice metadata
   */
  private validateInvoice(invoice: AIParseResponse['invoice'], errors: string[]): void {
    const rules = VALIDATION_RULES.invoice;

    // Validate number
    if (rules.number.required && !invoice.number) {
      errors.push('Invoice number is required');
    }

    // Validate series
    if (rules.series.required && !invoice.series) {
      errors.push('Invoice series is required');
    }

    // Validate issue date
    if (rules.issueDate.required && !invoice.issueDate) {
      errors.push('Invoice issue date is required');
    } else if (invoice.issueDate && !this.validateDate(invoice.issueDate)) {
      errors.push('Invoice issue date must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)');
    }
  }

  /**
   * Validate invoice items
   */
  private validateItems(items: AIParseResponse['items'], errors: string[]): void {
    const rules = VALIDATION_RULES.items;

    // Validate minimum items
    if (items.length < rules.minItems) {
      errors.push(`Invoice must have at least ${rules.minItems} item(s)`);
      return; // Don't validate individual items if array is empty
    }

    // Validate each item
    items.forEach((item, index) => {
      const itemPrefix = `Item ${index + 1}`;

      // Validate description
      if (rules.description.required && !item.description) {
        errors.push(`${itemPrefix}: description is required`);
      }

      // Validate quantity
      if (rules.quantity.required && item.quantity === undefined) {
        errors.push(`${itemPrefix}: quantity is required`);
      } else if (
        item.quantity !== undefined &&
        rules.quantity.min !== undefined &&
        item.quantity < rules.quantity.min
      ) {
        errors.push(`${itemPrefix}: quantity must be at least ${rules.quantity.min}`);
      }

      // Validate unit price
      if (rules.unitPrice.required && item.unitPrice === undefined) {
        errors.push(`${itemPrefix}: unit price is required`);
      } else if (
        item.unitPrice !== undefined &&
        rules.unitPrice.min !== undefined &&
        item.unitPrice < rules.unitPrice.min
      ) {
        errors.push(`${itemPrefix}: unit price must be at least ${rules.unitPrice.min}`);
      }

      // Validate total price
      if (rules.totalPrice.required && item.totalPrice === undefined) {
        errors.push(`${itemPrefix}: total price is required`);
      } else if (
        item.totalPrice !== undefined &&
        rules.totalPrice.min !== undefined &&
        item.totalPrice < rules.totalPrice.min
      ) {
        errors.push(`${itemPrefix}: total price must be at least ${rules.totalPrice.min}`);
      }

      // Validate numeric types
      if (item.quantity !== undefined && typeof item.quantity !== 'number') {
        errors.push(`${itemPrefix}: quantity must be a number`);
      }
      if (item.unitPrice !== undefined && typeof item.unitPrice !== 'number') {
        errors.push(`${itemPrefix}: unit price must be a number`);
      }
      if (item.totalPrice !== undefined && typeof item.totalPrice !== 'number') {
        errors.push(`${itemPrefix}: total price must be a number`);
      }
      if (item.discountAmount !== undefined && typeof item.discountAmount !== 'number') {
        errors.push(`${itemPrefix}: discount amount must be a number`);
      }
    });
  }

  /**
   * Validate invoice totals
   */
  private validateTotals(totals: AIParseResponse['totals'], errors: string[]): void {
    const rules = VALIDATION_RULES.totals;

    // Validate total
    if (rules.total.required && totals.total === undefined) {
      errors.push('Total amount is required');
    } else if (totals.total !== undefined && rules.total.min !== undefined && totals.total < rules.total.min) {
      errors.push(`Total amount must be at least ${rules.total.min}`);
    }

    // Validate numeric types
    if (totals.subtotal !== undefined && typeof totals.subtotal !== 'number') {
      errors.push('Subtotal must be a number');
    }
    if (totals.discount !== undefined && typeof totals.discount !== 'number') {
      errors.push('Discount must be a number');
    }
    if (totals.tax !== undefined && typeof totals.tax !== 'number') {
      errors.push('Tax must be a number');
    }
    if (totals.total !== undefined && typeof totals.total !== 'number') {
      errors.push('Total must be a number');
    }
  }

  /**
   * Normalize currency values
   * Removes formatting and converts to number
   * @param value - Currency value as string or number
   * @returns Normalized number value
   */
  normalizeCurrency(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }

    // Remove currency symbols, spaces, and thousand separators
    let normalized = value
      .replace(/R\$\s*/g, '') // Remove R$
      .replace(/\s/g, '') // Remove spaces
      .trim();

    // Handle Brazilian format: 1.234,56 -> 1234.56
    // Check if comma is used as decimal separator
    const commaIndex = normalized.lastIndexOf(',');
    const dotIndex = normalized.lastIndexOf('.');

    if (commaIndex > dotIndex) {
      // Brazilian format: 1.234,56
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56 or just 1234.56
      normalized = normalized.replace(/,/g, '');
    }

    const result = parseFloat(normalized);
    return isNaN(result) ? 0 : result;
  }

  /**
   * Validate CNPJ format
   * @param cnpj - CNPJ string to validate
   * @returns True if valid (14 digits)
   */
  validateCNPJ(cnpj: string): boolean {
    if (!cnpj) {
      return false;
    }

    // Remove formatting
    const normalized = this.normalizeCNPJ(cnpj);

    // Check if it's exactly 14 digits
    return /^\d{14}$/.test(normalized);
  }

  /**
   * Normalize CNPJ (remove formatting)
   * @param cnpj - CNPJ with or without formatting
   * @returns CNPJ with only digits
   */
  normalizeCNPJ(cnpj: string): string {
    return cnpj.replace(/[.\-/]/g, '');
  }

  /**
   * Validate date format (ISO 8601: YYYY-MM-DD)
   * @param date - Date string to validate
   * @returns True if valid ISO 8601 format
   */
  validateDate(date: string): boolean {
    if (!date) {
      return false;
    }

    // Check format - aceita YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/.test(date)) {
      return false;
    }

    // Check if it's a valid date
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }

  /**
   * Normalize date from Brazilian format to ISO 8601
   * @param date - Date in DD/MM/YYYY format
   * @returns Date in YYYY-MM-DD format
   */
  normalizeDate(date: string): string {
    if (!date) {
      return '';
    }

    // If already in ISO format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }

    // Try other common formats
    // YYYY/MM/DD
    const match2 = date.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (match2) {
      const [, year, month, day] = match2;
      return `${year}-${month}-${day}`;
    }

    // Return original if can't parse
    return date;
  }

  /**
   * Verify totals match item sum
   * @param items - Invoice items
   * @param totals - Invoice totals
   * @returns True if totals match within tolerance
   */
  verifyTotals(
    items: Array<{ totalPrice: number }>,
    totals: { subtotal: number; discount: number; total: number },
  ): boolean {
    // Calculate sum of item prices
    const itemsSum = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Calculate expected total: subtotal - discount
    // Note: subtotal should equal itemsSum, but we'll use the declared subtotal
    const expectedTotal = totals.subtotal - totals.discount;

    // Check if itemsSum matches subtotal
    const subtotalMatches = Math.abs(itemsSum - totals.subtotal) <= TOTAL_VERIFICATION_TOLERANCE;

    // Check if calculated total matches declared total
    const totalMatches = Math.abs(expectedTotal - totals.total) <= TOTAL_VERIFICATION_TOLERANCE;

    // Both must match
    return subtotalMatches && totalMatches;
  }
}

/**
 * Singleton instance of ValidatorService
 */
export const validatorService = new ValidatorService();
