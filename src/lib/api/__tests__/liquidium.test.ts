import { get, post } from '../../fetchWrapper';
import {
  fetchBorrowQuotesFromApi,
  fetchBorrowRangesFromApi,
  prepareLiquidiumBorrow,
  repayLiquidiumLoan,
  submitLiquidiumBorrow,
  submitRepayPsbt,
} from '../liquidium';

// Mock the fetchWrapper module
jest.mock('../../fetchWrapper', () => ({
  get: jest.fn(),
  post: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status: number,
      public statusText: string,
      public url: string,
    ) {
      super(message);
      this.name = 'FetchError';
    }
  },
}));

const { FetchError } = jest.requireMock('../../fetchWrapper');

// Shared test fixtures
const FIXTURES = {
  quoteResponse: {
    success: true,
    runeDetails: {
      rune_id: 'test-rune-id',
      slug: 'test-rune',
      floor_price_sats: 1000,
      floor_price_last_updated_at: '2024-01-01T00:00:00Z',
      common_offer_data: { interest_rate: 10, rune_divisibility: 8 },
      valid_ranges: {
        rune_amount: { ranges: [{ min: '100', max: '1000' }] },
        loan_term_days: [30, 60, 90],
      },
      offers: [
        {
          offer_id: 'offer-123',
          fungible_amount: 1,
          loan_term_days: 30,
          ltv_rate: 80,
          loan_breakdown: {
            total_repayment_sats: 1100,
            principal_sats: 1000,
            interest_sats: 100,
            loan_due_by_date: '2024-02-01T00:00:00Z',
            activation_fee_sats: 50,
            discount: { discount_rate: 5, discount_sats: 50 },
          },
        },
      ],
    },
  },
  rangeResponse: {
    success: true,
    data: {
      runeId: 'test-rune-id',
      minAmount: '100',
      maxAmount: '1000',
      loanTermDays: [30, 60, 90],
      cached: false,
      updatedAt: '2024-01-01T00:00:00Z',
    },
  },
};

// Test utilities
const mockResponse = <T>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
});
const mockErrorResponse = (error: string) => ({ success: false, error });

describe('liquidium API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('fetchBorrowQuotesFromApi', () => {
    const params: Parameters<typeof fetchBorrowQuotesFromApi> = [
      'test-rune-id',
      '500',
      'bc1test123',
    ];
    const expectedUrl =
      '/api/liquidium/borrow/quotes?runeId=test-rune-id&runeAmount=500&address=bc1test123';
    const encodedParams: Parameters<typeof fetchBorrowQuotesFromApi> = [
      'test rune with spaces',
      '1000',
      'bc1+special@chars',
    ];
    const encodedUrl =
      '/api/liquidium/borrow/quotes?runeId=test%20rune%20with%20spaces&runeAmount=1000&address=bc1%2Bspecial%40chars';
    const testResponse = FIXTURES.quoteResponse;
    const errorMessage = 'Failed to fetch borrow quotes';

    it('fetches data and encodes URLs correctly', async () => {
      (get as jest.Mock).mockResolvedValue(mockResponse(testResponse));

      // Test normal params
      expect(await fetchBorrowQuotesFromApi(...params)).toEqual(testResponse);
      expect(get).toHaveBeenCalledWith(expectedUrl);

      // Test URL encoding
      await fetchBorrowQuotesFromApi(...encodedParams);
      expect(get).toHaveBeenLastCalledWith(encodedUrl);
    });

    it.each([
      [
        'HTTP error',
        () => new FetchError('HTTP 404: Not Found', 404, 'Not Found', '/test'),
        'HTTP 404: Not Found',
      ],
      ['network error', () => new Error('Network error'), 'Network error'],
    ])('handles %s', async (_, errorFactory, expectedError) => {
      (get as jest.Mock).mockRejectedValue(errorFactory());
      await expect(fetchBorrowQuotesFromApi(...params)).rejects.toThrow(
        expectedError,
      );
    });

    it('handles API error response', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockResponse(mockErrorResponse('API Error')),
      );
      await expect(fetchBorrowQuotesFromApi(...params)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('fetchBorrowRangesFromApi', () => {
    const params: Parameters<typeof fetchBorrowRangesFromApi> = [
      'test-rune-id',
      'bc1test123',
    ];
    const expectedUrl =
      '/api/liquidium/borrow/ranges?runeId=test-rune-id&address=bc1test123';
    const encodedParams: Parameters<typeof fetchBorrowRangesFromApi> = [
      'rune with spaces',
      'bc1+special@chars',
    ];
    const encodedUrl =
      '/api/liquidium/borrow/ranges?runeId=rune%20with%20spaces&address=bc1%2Bspecial%40chars';
    const testResponse = FIXTURES.rangeResponse;
    const errorMessage = 'Failed to fetch borrow ranges';

    it('fetches data and encodes URLs correctly', async () => {
      (get as jest.Mock).mockResolvedValue(mockResponse(testResponse));

      // Test normal params
      expect(await fetchBorrowRangesFromApi(...params)).toEqual(testResponse);
      expect(get).toHaveBeenCalledWith(expectedUrl);

      // Test URL encoding
      await fetchBorrowRangesFromApi(...encodedParams);
      expect(get).toHaveBeenLastCalledWith(encodedUrl);
    });

    it.each([
      [
        'HTTP error',
        () => new FetchError('HTTP 404: Not Found', 404, 'Not Found', '/test'),
        'HTTP 404: Not Found',
      ],
      ['network error', () => new Error('Network error'), 'Network error'],
    ])('handles %s', async (_, errorFactory, expectedError) => {
      (get as jest.Mock).mockRejectedValue(errorFactory());
      await expect(fetchBorrowRangesFromApi(...params)).rejects.toThrow(
        expectedError,
      );
    });

    it('handles API error response', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockResponse(mockErrorResponse('API Error')),
      );
      await expect(fetchBorrowRangesFromApi(...params)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('prepareLiquidiumBorrow', () => {
    const params = {
      instant_offer_id: 'offer-123',
      fee_rate: 15,
      token_amount: '500',
      borrower_payment_address: 'bc1payment',
      borrower_payment_pubkey: '02pubkey1',
      borrower_ordinal_address: 'bc1ordinal',
      borrower_ordinal_pubkey: '02pubkey2',
      address: 'bc1user123',
    };
    const mockResponse1 = {
      success: true,
      data: {
        prepare_offer_id: 'prepare-456',
        base64_psbt: 'cHNidAEBAA==',
        sides: [
          {
            index: 0,
            address: 'bc1test123',
            sighash: 1,
            disable_tweak_signer: false,
          },
        ],
      },
    };

    it('executes successfully', async () => {
      (post as jest.Mock).mockResolvedValue(mockResponse(mockResponse1));
      const result = await prepareLiquidiumBorrow(params);
      expect(post).toHaveBeenCalledWith(
        '/api/liquidium/borrow/prepare',
        params,
      );
      expect(result).toEqual(mockResponse1);
    });

    it.each([
      ['network error', () => new Error('Network error')],
      ['API error', () => mockResponse(mockErrorResponse('API Error'))],
    ])('handles %s', async (_, errorFactory) => {
      (post as jest.Mock).mockRejectedValue(errorFactory());
      await expect(prepareLiquidiumBorrow(params)).rejects.toThrow(
        'Failed to prepare borrow',
      );
    });
  });

  describe('submitLiquidiumBorrow', () => {
    const params = {
      signed_psbt_base_64: 'cHNidAEBAA==signed',
      prepare_offer_id: 'prepare-456',
      address: 'bc1user123',
    };
    const mockResponse2 = {
      success: true,
      data: { loan_transaction_id: 'tx-789' },
    };

    it('executes successfully', async () => {
      (post as jest.Mock).mockResolvedValue(mockResponse(mockResponse2));
      const result = await submitLiquidiumBorrow(params);
      expect(post).toHaveBeenCalledWith('/api/liquidium/borrow/submit', params);
      expect(result).toEqual(mockResponse2);
    });

    it.each([
      ['network error', () => new Error('Network error')],
      ['API error', () => mockResponse(mockErrorResponse('API Error'))],
    ])('handles %s', async (_, errorFactory) => {
      (post as jest.Mock).mockRejectedValue(errorFactory());
      await expect(submitLiquidiumBorrow(params)).rejects.toThrow(
        'Failed to submit borrow',
      );
    });
  });

  // Special edge cases
  describe('edge cases', () => {
    it('fetchBorrowQuotesFromApi handles nested data structure', async () => {
      const nestedResponse = {
        success: true,
        data: { runeDetails: FIXTURES.quoteResponse.runeDetails },
      };
      (get as jest.Mock).mockResolvedValue(mockResponse(nestedResponse));
      const result = await fetchBorrowQuotesFromApi(
        'test-rune-id',
        '500',
        'bc1test123',
      );
      expect(result.runeDetails).toEqual(FIXTURES.quoteResponse.runeDetails);
    });

    it('submitLiquidiumBorrow handles JSON parse errors gracefully', async () => {
      (post as jest.Mock).mockRejectedValue(new Error('Invalid JSON response'));
      const params = {
        signed_psbt_base_64: 'cHNidAEBAA==signed',
        prepare_offer_id: 'prepare-456',
        address: 'bc1user123',
      };
      const result = await submitLiquidiumBorrow(params);
      expect(result).toEqual({
        success: true,
        data: { loan_transaction_id: 'prepare-456' },
      });
    });
  });

  // Repay operations
  describe('repayLiquidiumLoan', () => {
    const params: Parameters<typeof repayLiquidiumLoan> = [
      'loan-123',
      'bc1user123',
    ];
    const expectedCall = { loanId: 'loan-123', address: 'bc1user123' };
    const errorMessage = 'Failed to repay loan';

    it('works correctly', async () => {
      const mockRepayResponse = {
        success: true,
        data: {
          psbt: 'cHNidAEBAA==repay',
          repaymentAmountSats: 1100,
          loanId: 'loan-123',
        },
      };
      (post as jest.Mock).mockResolvedValue(mockResponse(mockRepayResponse));
      const result = await repayLiquidiumLoan(...params);
      expect(post).toHaveBeenCalledWith('/api/liquidium/repay', expectedCall);
      expect(result).toEqual(mockRepayResponse);
    });

    it('handles errors', async () => {
      (post as jest.Mock).mockRejectedValue(new Error('Network error'));
      await expect(repayLiquidiumLoan(...params)).rejects.toThrow(errorMessage);
    });
  });

  describe('submitRepayPsbt', () => {
    const params: Parameters<typeof submitRepayPsbt> = [
      'loan-123',
      'cHNidAEBAA==signed',
      'bc1user123',
    ];
    const expectedCall = {
      loanId: 'loan-123',
      signedPsbt: 'cHNidAEBAA==signed',
      address: 'bc1user123',
    };
    const errorMessage = 'Failed to submit repayment';

    it('works correctly', async () => {
      const mockRepayResponse = {
        success: true,
        data: { repayment_transaction_id: 'tx-repay-456' },
      };
      (post as jest.Mock).mockResolvedValue(mockResponse(mockRepayResponse));
      const result = await submitRepayPsbt(...params);
      expect(post).toHaveBeenCalledWith('/api/liquidium/repay', expectedCall);
      expect(result).toEqual(mockRepayResponse);
    });

    it('handles errors', async () => {
      (post as jest.Mock).mockRejectedValue(new Error('Network error'));
      await expect(submitRepayPsbt(...params)).rejects.toThrow(errorMessage);
    });
  });

  it('repayLiquidiumLoan handles field mapping', async () => {
    const mappedResponse = {
      success: true,
      data: {
        base64_psbt: 'cHNidAEBAA==mapped',
        repayment_amount_sats: 1200,
        offer_id: 'offer-mapped',
      },
    };
    (post as jest.Mock).mockResolvedValue(mockResponse(mappedResponse));
    const result = await repayLiquidiumLoan('loan-123', 'bc1user123');
    expect(result.data).toEqual(
      expect.objectContaining({
        psbt: 'cHNidAEBAA==mapped',
        repaymentAmountSats: 1200,
        loanId: 'offer-mapped',
      }),
    );
  });
});
