import { CreateTransactionDto } from '@/lib/types';
import { ImportError, ImportErrorCode, ParsedTransaction } from '@/lib/types/import.types';

/**
 * TransactionMapper
 *
 * Converts parsed transactions from various file formats into the application's
 * CreateTransactionDto format. Handles validation, category assignment, and
 * metadata preservation.
 */
export class TransactionMapper {
  /**
   * Map parsed transaction to CreateTransactionDto
   *
   * @param parsed - Parsed transaction from file parser
   * @param accountId - Target account ID for the transaction
   * @param userId - User ID who owns the transaction
   * @returns CreateTransactionDto ready for database insertion
   * @throws ImportError if validation fails
   */
  mapToDto(parsed: ParsedTransaction, accountId: string, userId: string): CreateTransactionDto {
    // Validate the parsed transaction first
    this.validate(parsed);

    // Filter out zero-amount transactions
    if (parsed.amount === 0) {
      throw new ImportError('Transaction with zero amount cannot be imported', ImportErrorCode.VALIDATION_ERROR, {
        transaction: parsed,
      });
    }

    // Assign category based on description
    const category = parsed.category || this.assignCategory(parsed.description, parsed.type);

    // Build the DTO
    const dto: CreateTransactionDto = {
      amount: Math.abs(parsed.amount),
      type: parsed.type,
      date: parsed.date,
      category,
      description: parsed.description,
      account_id: accountId,
      currency: 'BRL',
      tags: ['imported'],
    };

    return dto;
  }

  /**
   * Validate parsed transaction
   *
   * Ensures all required fields are present and valid before mapping
   *
   * @param parsed - Parsed transaction to validate
   * @throws ImportError if validation fails
   */
  validate(parsed: ParsedTransaction): void {
    // Validate date
    if (!parsed.date || !this.isValidDate(parsed.date)) {
      throw new ImportError('Invalid or missing date', ImportErrorCode.INVALID_DATE_FORMAT, { date: parsed.date });
    }

    // Validate amount
    if (typeof parsed.amount !== 'number' || isNaN(parsed.amount)) {
      throw new ImportError('Invalid amount', ImportErrorCode.INVALID_AMOUNT_FORMAT, { amount: parsed.amount });
    }

    // Validate description
    if (!parsed.description || parsed.description.trim().length === 0) {
      throw new ImportError('Missing or empty description', ImportErrorCode.VALIDATION_ERROR, {
        description: parsed.description,
      });
    }

    // Validate type
    if (!['income', 'expense'].includes(parsed.type)) {
      throw new ImportError('Invalid transaction type', ImportErrorCode.VALIDATION_ERROR, { type: parsed.type });
    }
  }

  /**
   * Assign category based on description keywords
   *
   * Uses keyword matching to automatically categorize transactions.
   * Falls back to default categories if no match is found.
   *
   * @param description - Transaction description
   * @param type - Transaction type (income or expense)
   * @returns Category ID
   */
  assignCategory(description: string, type: 'income' | 'expense'): string {
    const desc = description.toLowerCase();

    // Pix transfers
    if (desc.includes('pix')) {
      // Check if it's income based on type or keywords
      if (type === 'income' || desc.includes('recebido') || desc.includes('received')) {
        return 'other_income';
      }
      return 'transfer';
    }

    // Bills and utilities
    if (
      desc.includes('boleto') ||
      desc.includes('conta') ||
      desc.includes('celesc') ||
      desc.includes('energia') ||
      desc.includes('luz') ||
      desc.includes('água') ||
      desc.includes('gas') ||
      desc.includes('water') ||
      desc.includes('electricity')
    ) {
      return 'utilities';
    }

    // Internet and phone
    if (desc.includes('internet') || desc.includes('wifi') || desc.includes('banda larga')) {
      return 'internet';
    }

    if (
      desc.includes('telefone') ||
      desc.includes('celular') ||
      desc.includes('phone') ||
      desc.includes('mobile') ||
      desc.includes('vivo') ||
      desc.includes('claro') ||
      desc.includes('tim') ||
      desc.includes('oi')
    ) {
      return 'phone';
    }

    // Card purchases
    if (desc.includes('cartão') || desc.includes('card') || desc.includes('fatura')) {
      return 'credit_card';
    }

    // Transportation
    if (
      desc.includes('uber') ||
      desc.includes('99') ||
      desc.includes('taxi') ||
      desc.includes('transporte') ||
      desc.includes('transport') ||
      desc.includes('combustível') ||
      desc.includes('gasolina') ||
      desc.includes('gas station') ||
      desc.includes('posto')
    ) {
      return 'transport';
    }

    // Food and dining
    if (
      desc.includes('restaurante') ||
      desc.includes('restaurant') ||
      desc.includes('ifood') ||
      desc.includes('rappi') ||
      desc.includes('delivery') ||
      desc.includes('lanche') ||
      desc.includes('refeição')
    ) {
      return 'food';
    }

    // Coffee and snacks
    if (
      desc.includes('café') ||
      desc.includes('coffee') ||
      desc.includes('padaria') ||
      desc.includes('bakery') ||
      desc.includes('starbucks')
    ) {
      return 'coffee';
    }

    // Groceries
    if (
      desc.includes('supermercado') ||
      desc.includes('supermarket') ||
      desc.includes('mercado') ||
      desc.includes('market') ||
      desc.includes('carrefour') ||
      desc.includes('pão de açúcar') ||
      desc.includes('extra')
    ) {
      return 'groceries';
    }

    // Shopping
    if (
      desc.includes('shopping') ||
      desc.includes('loja') ||
      desc.includes('store') ||
      desc.includes('compra') ||
      desc.includes('magazine luiza') ||
      desc.includes('americanas') ||
      desc.includes('amazon')
    ) {
      return 'shopping';
    }

    // Health
    if (
      desc.includes('farmácia') ||
      desc.includes('farmacia') ||
      desc.includes('pharmacy') ||
      desc.includes('médico') ||
      desc.includes('medico') ||
      desc.includes('doctor') ||
      desc.includes('hospital') ||
      desc.includes('clínica') ||
      desc.includes('clinica') ||
      desc.includes('saúde') ||
      desc.includes('saude') ||
      desc.includes('health') ||
      desc.includes('consulta')
    ) {
      return 'health';
    }

    // Entertainment
    if (
      desc.includes('netflix') ||
      desc.includes('spotify') ||
      desc.includes('cinema') ||
      desc.includes('teatro') ||
      desc.includes('show') ||
      desc.includes('ingresso') ||
      desc.includes('ticket')
    ) {
      return 'entertainment';
    }

    // Travel
    if (
      desc.includes('hotel') ||
      desc.includes('passagem') ||
      desc.includes('viagem') ||
      desc.includes('travel') ||
      desc.includes('airbnb') ||
      desc.includes('booking')
    ) {
      return 'travel';
    }

    // Housing
    if (
      desc.includes('aluguel') ||
      desc.includes('rent') ||
      desc.includes('condomínio') ||
      desc.includes('iptu') ||
      desc.includes('imóvel')
    ) {
      return 'housing';
    }

    // Education
    if (
      desc.includes('escola') ||
      desc.includes('school') ||
      desc.includes('curso') ||
      desc.includes('course') ||
      desc.includes('faculdade') ||
      desc.includes('university') ||
      desc.includes('educação')
    ) {
      return 'education';
    }

    // Taxes
    if (
      desc.includes('imposto') ||
      desc.includes('tax') ||
      desc.includes('tributo') ||
      desc.includes('inss') ||
      desc.includes('irpf')
    ) {
      return 'taxes';
    }

    // Income categories
    if (type === 'income') {
      if (desc.includes('salário') || desc.includes('salario') || desc.includes('salary')) {
        return 'salary';
      }

      if (
        desc.includes('freelance') ||
        desc.includes('autônomo') ||
        desc.includes('autonomo') ||
        desc.includes('pagamento freelance')
      ) {
        return 'freelance';
      }

      if (
        desc.includes('investimento') ||
        desc.includes('investment') ||
        desc.includes('dividendo') ||
        desc.includes('dividendos')
      ) {
        return 'investment';
      }

      if (desc.includes('bônus') || desc.includes('bonus')) {
        return 'bonus';
      }

      if (desc.includes('reembolso') || desc.includes('refund') || desc.includes('estorno')) {
        return 'refund';
      }

      // Default income category
      return 'other_income';
    }

    // Default expense category
    return 'other_expense';
  }

  /**
   * Check if a date string is valid ISO 8601 format
   *
   * @param dateStr - Date string to validate
   * @returns true if valid, false otherwise
   */
  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
}
