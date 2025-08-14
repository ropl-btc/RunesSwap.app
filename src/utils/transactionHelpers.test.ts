import { testData } from '@/test-utils';
import { interpretRuneTransaction } from './transactionHelpers';

describe('interpretRuneTransaction', () => {
  const userAddress = 'bc1qtest123456789';
  const otherAddress = 'bc1qother987654321';

  const testCases = [
    {
      name: 'minting transaction',
      transaction: testData.runeActivityEvent('MINT', userAddress, {
        txid: 'mint-tx',
        outputs: [
          {
            address: userAddress,
            vout: 0,
            rune: 'BITCOIN',
            rune_amount: '1000',
          },
        ],
      }),
      expected: {
        action: 'Minted',
        runeName: 'BITCOIN',
        runeAmountRaw: '1000',
      },
    },
    {
      name: 'etching transaction',
      transaction: testData.runeActivityEvent('ETCH', userAddress, {
        txid: 'etch-tx',
        runestone_messages: [{ type: 'ETCH', rune: 'NEWRUNE' }],
        outputs: [
          {
            address: userAddress,
            vout: 0,
            rune: 'NEWRUNE',
            rune_amount: '5000',
          },
        ],
      }),
      expected: {
        action: 'Etched',
        runeName: 'NEWRUNE',
        runeAmountRaw: '5000',
      },
    },
    {
      name: 'sending transaction',
      transaction: testData.runeActivityEvent('TRANSFER', userAddress, {
        inputs: [
          {
            address: userAddress,
            output: 'txid:0',
            rune: 'BITCOIN',
            rune_amount: '500',
          },
        ],
        outputs: [
          {
            address: otherAddress,
            vout: 0,
            rune: 'BITCOIN',
            rune_amount: '500',
          },
        ],
      }),
      expected: { action: 'Sent', runeName: 'BITCOIN', runeAmountRaw: '500' },
    },
    {
      name: 'receiving transaction',
      transaction: testData.runeActivityEvent('TRANSFER', userAddress, {
        inputs: [
          {
            address: otherAddress,
            output: 'txid:0',
            rune: 'BITCOIN',
            rune_amount: '300',
          },
        ],
        outputs: [
          {
            address: userAddress,
            vout: 0,
            rune: 'BITCOIN',
            rune_amount: '300',
          },
        ],
      }),
      expected: {
        action: 'Received',
        runeName: 'BITCOIN',
        runeAmountRaw: '300',
      },
    },
    {
      name: 'internal transfer transaction',
      transaction: testData.runeActivityEvent('TRANSFER', userAddress, {
        inputs: [
          {
            address: userAddress,
            output: 'txid:0',
            rune: 'BITCOIN',
            rune_amount: '200',
          },
        ],
        outputs: [
          {
            address: userAddress,
            vout: 0,
            rune: 'BITCOIN',
            rune_amount: '200',
          },
        ],
      }),
      expected: {
        action: 'Internal Transfer',
        runeName: 'BITCOIN',
        runeAmountRaw: '200',
      },
    },
    {
      name: 'external transfer transaction',
      transaction: testData.runeActivityEvent('TRANSFER', userAddress, {
        inputs: [
          {
            address: otherAddress,
            output: 'txid:0',
            rune: 'BITCOIN',
            rune_amount: '100',
          },
        ],
        outputs: [
          {
            address: 'bc1qdifferent123',
            vout: 0,
            rune: 'BITCOIN',
            rune_amount: '100',
          },
        ],
      }),
      expected: {
        action: 'Transfer (External)',
        runeName: 'BITCOIN',
        runeAmountRaw: 'N/A',
      },
    },
    {
      name: 'error handling for invalid transaction',
      transaction: {} as ReturnType<typeof testData.runeActivityEvent>,
      expected: { action: 'Unknown', runeName: 'N/A', runeAmountRaw: 'N/A' },
    },
  ];

  testCases.forEach(({ name, transaction, expected }) => {
    it(`correctly interprets ${name}`, () => {
      const result = interpretRuneTransaction(transaction, userAddress);
      expect(result.action).toBe(expected.action);
      expect(result.runeName).toBe(expected.runeName);
      expect(result.runeAmountRaw).toBe(expected.runeAmountRaw);
    });
  });
});
