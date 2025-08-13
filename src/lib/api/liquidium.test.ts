import { get, post } from '../fetchWrapper';
import {
  type BorrowRangeResponse,
  type LiquidiumBorrowQuoteResponse,
  type LiquidiumPrepareBorrowResponse,
  type LiquidiumSubmitBorrowResponse,
  type RepayLiquidiumLoanResponse,
  type SubmitRepayResponse,
  fetchBorrowQuotesFromApi,
  fetchBorrowRangesFromApi,
  prepareLiquidiumBorrow,
  repayLiquidiumLoan,
  submitLiquidiumBorrow,
  submitRepayPsbt,
} from './liquidium';

// Mock the fetchWrapper module
jest.mock('../fetchWrapper', () => ({
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

// Helper to mock fetchWrapper responses
const mockFetchWrapperResponse = <T>(
  data: T,
  status = 200,
  statusText = 'OK',
) => ({
  data,
  status,
  statusText,
  headers: new Headers(),
});

describe('liquidium API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBorrowQuotesFromApi', () => {
    const mockQuoteResponse: LiquidiumBorrowQuoteResponse = {
      success: true,
      runeDetails: {
        rune_id: 'test-rune-id',
        slug: 'test-rune',
        floor_price_sats: 1000,
        floor_price_last_updated_at: '2024-01-01T00:00:00Z',
        common_offer_data: {
          interest_rate: 10,
          rune_divisibility: 8,
        },
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
              discount: {
                discount_rate: 5,
                discount_sats: 50,
              },
            },
          },
        ],
      },
    };

    it('fetches borrow quotes successfully', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockQuoteResponse),
      );

      const result = await fetchBorrowQuotesFromApi(
        'test-rune-id',
        '500',
        'bc1test123',
      );

      expect(get).toHaveBeenCalledWith(
        '/api/liquidium/borrow/quotes?runeId=test-rune-id&runeAmount=500&address=bc1test123',
      );
      expect(result).toEqual(mockQuoteResponse);
    });

    it('handles nested data structure response', async () => {
      const nestedResponse = {
        success: true,
        data: {
          runeDetails: mockQuoteResponse.runeDetails,
        },
      };

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(nestedResponse),
      );

      const result = await fetchBorrowQuotesFromApi(
        'test-rune-id',
        '500',
        'bc1test123',
      );

      expect(result.runeDetails).toEqual(mockQuoteResponse.runeDetails);
    });

    it('properly encodes URL parameters', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockQuoteResponse),
      );

      await fetchBorrowQuotesFromApi(
        'test rune with spaces',
        '1000',
        'bc1+special@chars',
      );

      expect(get).toHaveBeenCalledWith(
        '/api/liquidium/borrow/quotes?runeId=test%20rune%20with%20spaces&runeAmount=1000&address=bc1%2Bspecial%40chars',
      );
    });

    it('throws error from fetchWrapper for HTTP errors', async () => {
      const { FetchError } = jest.requireMock('../fetchWrapper');
      (get as jest.Mock).mockRejectedValue(
        new FetchError(
          'HTTP 404: Not Found',
          404,
          'Not Found',
          '/api/liquidium/borrow/quotes',
        ),
      );

      await expect(
        fetchBorrowQuotesFromApi('invalid-rune', '500', 'bc1test123'),
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('throws error for response with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Invalid parameters',
      };

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(errorResponse),
      );

      await expect(
        fetchBorrowQuotesFromApi('test-rune-id', 'invalid', 'bc1test123'),
      ).rejects.toThrow('Failed to fetch borrow quotes');
    });
  });

  describe('fetchBorrowRangesFromApi', () => {
    const mockRangeResponse: BorrowRangeResponse = {
      success: true,
      data: {
        runeId: 'test-rune-id',
        minAmount: '100',
        maxAmount: '1000',
        loanTermDays: [30, 60, 90],
        cached: false,
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    it('fetches borrow ranges successfully', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockRangeResponse),
      );

      const result = await fetchBorrowRangesFromApi(
        'test-rune-id',
        'bc1test123',
      );

      expect(get).toHaveBeenCalledWith(
        '/api/liquidium/borrow/ranges?runeId=test-rune-id&address=bc1test123',
      );
      expect(result).toEqual(mockRangeResponse);
    });

    it('properly encodes URL parameters', async () => {
      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockRangeResponse),
      );

      await fetchBorrowRangesFromApi('rune with spaces', 'bc1+special@chars');

      expect(get).toHaveBeenCalledWith(
        '/api/liquidium/borrow/ranges?runeId=rune%20with%20spaces&address=bc1%2Bspecial%40chars',
      );
    });

    it('throws error for network failures', async () => {
      (get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        fetchBorrowRangesFromApi('test-rune-id', 'bc1user123'),
      ).rejects.toThrow('Network error');
    });

    it('throws error for response with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Invalid rune ID',
      };

      (get as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(errorResponse),
      );

      await expect(
        fetchBorrowRangesFromApi('invalid-rune', 'bc1test123'),
      ).rejects.toThrow('Failed to fetch borrow ranges');
    });
  });

  describe('prepareLiquidiumBorrow', () => {
    const mockPrepareParams = {
      instant_offer_id: 'offer-123',
      fee_rate: 15,
      token_amount: '500',
      borrower_payment_address: 'bc1payment',
      borrower_payment_pubkey: '02pubkey1',
      borrower_ordinal_address: 'bc1ordinal',
      borrower_ordinal_pubkey: '02pubkey2',
      address: 'bc1user123',
    };

    const mockPrepareResponse: LiquidiumPrepareBorrowResponse = {
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

    it('prepares liquidium borrow transaction successfully', async () => {
      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockPrepareResponse),
      );

      const result = await prepareLiquidiumBorrow(mockPrepareParams);

      expect(post).toHaveBeenCalledWith(
        '/api/liquidium/borrow/prepare',
        mockPrepareParams,
      );
      expect(result).toEqual(mockPrepareResponse);
    });

    it('throws error for network failures', async () => {
      (post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(prepareLiquidiumBorrow(mockPrepareParams)).rejects.toThrow(
        'Network error',
      );
    });

    it('throws error for response with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Insufficient collateral',
      };

      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(errorResponse),
      );

      await expect(prepareLiquidiumBorrow(mockPrepareParams)).rejects.toThrow(
        'Failed to prepare borrow',
      );
    });
  });

  describe('submitLiquidiumBorrow', () => {
    const mockSubmitParams = {
      signed_psbt_base_64: 'cHNidAEBAA==signed',
      prepare_offer_id: 'prepare-456',
      address: 'bc1user123',
    };

    const mockSubmitResponse: LiquidiumSubmitBorrowResponse = {
      success: true,
      data: {
        loan_transaction_id: 'tx-789',
      },
    };

    it('submits liquidium borrow transaction successfully', async () => {
      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockSubmitResponse),
      );

      const result = await submitLiquidiumBorrow(mockSubmitParams);

      expect(post).toHaveBeenCalledWith(
        '/api/liquidium/borrow/submit',
        mockSubmitParams,
      );
      expect(result).toEqual(mockSubmitResponse);
    });

    it('handles JSON parse errors gracefully', async () => {
      const jsonError = new Error('Invalid JSON response');
      (post as jest.Mock).mockRejectedValue(jsonError);

      const result = await submitLiquidiumBorrow(mockSubmitParams);

      expect(result).toEqual({
        success: true,
        data: {
          loan_transaction_id: 'prepare-456',
        },
      });
    });

    it('throws error for response with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Transaction failed',
      };

      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(errorResponse),
      );

      await expect(submitLiquidiumBorrow(mockSubmitParams)).rejects.toThrow(
        'Failed to submit borrow',
      );
    });
  });

  describe('repayLiquidiumLoan', () => {
    const mockRepayResponse: RepayLiquidiumLoanResponse = {
      success: true,
      data: {
        psbt: 'cHNidAEBAA==repay',
        repaymentAmountSats: 1100,
        loanId: 'loan-123',
      },
    };

    it('repays liquidium loan successfully', async () => {
      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockRepayResponse),
      );

      const result = await repayLiquidiumLoan('loan-123', 'bc1user123');

      expect(post).toHaveBeenCalledWith('/api/liquidium/repay', {
        loanId: 'loan-123',
        address: 'bc1user123',
      });
      expect(result).toEqual(mockRepayResponse);
    });

    it('handles response with base64_psbt field mapping', async () => {
      const responseWithBase64Field = {
        success: true,
        data: {
          base64_psbt: 'cHNidAEBAA==mapped',
          repayment_amount_sats: 1200,
          offer_id: 'offer-mapped',
        },
      };

      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(responseWithBase64Field),
      );

      const result = await repayLiquidiumLoan('loan-123', 'bc1user123');

      expect(result.data).toEqual(
        expect.objectContaining({
          psbt: 'cHNidAEBAA==mapped',
          repaymentAmountSats: 1200,
          loanId: 'offer-mapped',
        }),
      );
    });

    it('throws error for response with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Loan not found',
      };

      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(errorResponse),
      );

      await expect(
        repayLiquidiumLoan('invalid-loan', 'bc1user123'),
      ).rejects.toThrow('Failed to repay loan');
    });
  });

  describe('submitRepayPsbt', () => {
    const mockSubmitRepayResponse: SubmitRepayResponse = {
      success: true,
      data: {
        repayment_transaction_id: 'tx-repay-456',
      },
    };

    it('submits repay PSBT successfully', async () => {
      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(mockSubmitRepayResponse),
      );

      const result = await submitRepayPsbt(
        'loan-123',
        'cHNidAEBAA==signed',
        'bc1user123',
      );

      expect(post).toHaveBeenCalledWith('/api/liquidium/repay', {
        loanId: 'loan-123',
        signedPsbt: 'cHNidAEBAA==signed',
        address: 'bc1user123',
      });
      expect(result).toEqual(mockSubmitRepayResponse);
    });

    it('throws error for network failures', async () => {
      (post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        submitRepayPsbt('loan-123', 'cHNidAEBAA==signed', 'bc1user123'),
      ).rejects.toThrow('Network error');
    });

    it('throws error for response with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Invalid PSBT',
      };

      (post as jest.Mock).mockResolvedValue(
        mockFetchWrapperResponse(errorResponse),
      );

      await expect(
        submitRepayPsbt('loan-123', 'invalid-psbt', 'bc1user123'),
      ).rejects.toThrow('Failed to submit repayment');
    });
  });
});
