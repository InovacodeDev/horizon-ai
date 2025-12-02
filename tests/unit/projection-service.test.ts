import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { ProjectionService } from '@/lib/services/projection.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
const mockListDocuments = vi.fn();

vi.mock('@/lib/appwrite/client', () => ({
  getAppwriteDatabases: () => ({
    listDocuments: mockListDocuments,
  }),
}));

describe('ProjectionService', () => {
  let service: ProjectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectionService();
  });

  it('should correctly project recurring transactions in a leap year', async () => {
    const userId = 'user123';
    // Target: February 2024 (Leap Year)
    const targetDate = new Date('2024-02-15T12:00:00Z');

    // Mock Actual Transactions: Empty
    mockListDocuments.mockResolvedValueOnce({ documents: [] });

    // Mock Recurring Rules
    // Rule 1: Monthly rent, 15th of every month
    // Rule 2: Yearly subscription, started Feb 29, 2020. Should trigger Feb 29, 2024.
    const rules = [
      {
        $id: 'rule1',
        user_id: userId,
        frequency: 'MONTHLY',
        interval: 1,
        amount: 1000,
        start_date: '2023-01-15T00:00:00Z',
        category: 'Rent',
        type: 'expense',
      },
      {
        $id: 'rule2',
        user_id: userId,
        frequency: 'YEARLY',
        interval: 1,
        amount: 200,
        start_date: '2020-02-29T00:00:00Z', // Leap day start
        category: 'Leap Subscription',
        type: 'expense',
      },
    ];

    mockListDocuments.mockResolvedValueOnce({ documents: rules });

    const result = await service.getMonthlyProjection(userId, targetDate);

    // Expect 2 virtual transactions
    expect(result.transactions).toHaveLength(2);

    // Check Rent
    const rentTx = result.transactions.find((t) => t.description.includes('Rent'));
    expect(rentTx).toBeDefined();
    expect(rentTx?.amount).toBe(1000);
    // Should be in Feb 2024
    expect(new Date(rentTx!.date).toISOString()).toContain('2024-02');

    // Check Leap Subscription
    const leapTx = result.transactions.find((t) => t.description.includes('Leap Subscription'));
    expect(leapTx).toBeDefined();
    expect(leapTx?.amount).toBe(200);
    // Should be Feb 29, 2024
    // Note: date-fns addYears(Feb 29 2020, 4) -> Feb 29 2024.
    expect(new Date(leapTx!.date).toISOString()).toContain('2024-02-29');
  });

  it('should not project if rule ended', async () => {
    const userId = 'user123';
    const targetDate = new Date('2024-03-15T12:00:00Z');

    mockListDocuments.mockResolvedValueOnce({ documents: [] });

    const rules = [
      {
        $id: 'rule1',
        user_id: userId,
        frequency: 'MONTHLY',
        interval: 1,
        amount: 1000,
        start_date: '2023-01-15T00:00:00Z',
        end_date: '2024-02-15T00:00:00Z', // Ended last month
        category: 'Rent',
        type: 'expense',
      },
    ];

    mockListDocuments.mockResolvedValueOnce({ documents: rules });

    const result = await service.getMonthlyProjection(userId, targetDate);

    expect(result.transactions).toHaveLength(0);
  });
});
