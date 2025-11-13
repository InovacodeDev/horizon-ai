/**
 * Test account matching logic for OFX imports
 */
import { ImportService } from '@/lib/services/import.service';

describe('Account Matching', () => {
  let importService: ImportService;

  beforeEach(() => {
    importService = new ImportService();
  });

  test('should match account by ACCTID', () => {
    const ofxAccountInfo = {
      BANKID: '001',
      BRANCHID: '1234',
      ACCTID: '567890',
    };

    const userAccounts = [
      {
        $id: 'account-1',
        name: 'Conta Corrente',
        data: JSON.stringify({
          integration_data: {
            BANKID: '001',
            BRANCHID: '1234',
            ACCTID: '567890',
          },
        }),
      },
      {
        $id: 'account-2',
        name: 'Conta Poupança',
        data: JSON.stringify({
          integration_data: {
            BANKID: '002',
            BRANCHID: '5678',
            ACCTID: '123456',
          },
        }),
      },
    ];

    // Access private method via type assertion for testing
    const matchAccount = (importService as any).matchAccount.bind(importService);
    const matchedId = matchAccount(ofxAccountInfo, userAccounts);

    expect(matchedId).toBe('account-1');
  });

  test('should match account by last digits', () => {
    const ofxAccountInfo = {
      ACCTID: '1234567890',
    };

    const userAccounts = [
      {
        $id: 'account-1',
        name: 'Conta Corrente',
        data: JSON.stringify({
          last_digits: '7890',
        }),
      },
      {
        $id: 'account-2',
        name: 'Conta Poupança',
        data: JSON.stringify({
          last_digits: '1234',
        }),
      },
    ];

    const matchAccount = (importService as any).matchAccount.bind(importService);
    const matchedId = matchAccount(ofxAccountInfo, userAccounts);

    expect(matchedId).toBe('account-1');
  });

  test('should return undefined when no match found', () => {
    const ofxAccountInfo = {
      BANKID: '999',
      ACCTID: '999999',
    };

    const userAccounts = [
      {
        $id: 'account-1',
        name: 'Conta Corrente',
        data: JSON.stringify({
          integration_data: {
            BANKID: '001',
            ACCTID: '123456',
          },
        }),
      },
    ];

    const matchAccount = (importService as any).matchAccount.bind(importService);
    const matchedId = matchAccount(ofxAccountInfo, userAccounts);

    expect(matchedId).toBeUndefined();
  });

  test('should handle accounts without data field', () => {
    const ofxAccountInfo = {
      ACCTID: '123456',
    };

    const userAccounts = [
      {
        $id: 'account-1',
        name: 'Conta Corrente',
        // No data field
      },
      {
        $id: 'account-2',
        name: 'Conta Poupança',
        data: JSON.stringify({
          integration_data: {
            ACCTID: '123456',
          },
        }),
      },
    ];

    const matchAccount = (importService as any).matchAccount.bind(importService);
    const matchedId = matchAccount(ofxAccountInfo, userAccounts);

    expect(matchedId).toBe('account-2');
  });

  test('should handle partial matches', () => {
    const ofxAccountInfo = {
      BANKID: '001',
      // Missing BRANCHID and ACCTID
    };

    const userAccounts = [
      {
        $id: 'account-1',
        name: 'Conta Corrente',
        data: JSON.stringify({
          integration_data: {
            BANKID: '001',
            BRANCHID: '1234',
            ACCTID: '567890',
          },
        }),
      },
    ];

    const matchAccount = (importService as any).matchAccount.bind(importService);
    const matchedId = matchAccount(ofxAccountInfo, userAccounts);

    expect(matchedId).toBe('account-1');
  });
});
