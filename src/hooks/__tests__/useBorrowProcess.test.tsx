import { act, renderHook } from '@testing-library/react';
import type { RuneData } from '@/lib/runesData';
import { useBorrowProcess } from '../useBorrowProcess';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  prepareLiquidiumBorrow: jest.fn(),
  submitLiquidiumBorrow: jest.fn(),
}));

const { prepareLiquidiumBorrow, submitLiquidiumBorrow } =
  jest.requireMock('@/lib/api');

type HookProps = Parameters<typeof useBorrowProcess>[0];

// Mock fixtures
const mockRuneData: RuneData = {
  id: 'test-rune-id',
  name: 'TEST_RUNE',
  formatted_name: 'Test Rune',
  spacers: 0,
  number: 123,
  inscription_id: 'test-inscription-id',
  decimals: 8,
  mint_count_cap: '1000000',
  symbol: 'TR',
  etching_txid: 'test-etching-txid',
  amount_per_mint: '1000',
  timestamp_unix: '1640995200',
  premined_supply: '500000',
  mint_start_block: 800000,
  mint_end_block: 900000,
  current_supply: '750000',
  current_mint_count: 750,
};

const mockPrepareResponse = {
  success: true,
  data: {
    base64_psbt: 'test-psbt-base64',
    prepare_offer_id: 'prepare-offer-123',
  },
};

const mockSubmitResponse = {
  success: true,
  data: {
    loan_transaction_id: 'loan-tx-123',
  },
};

const mockSignResult = {
  signedPsbtHex: 'signed-hex',
  signedPsbtBase64: 'signed-base64',
};

// Test utilities
function createProps(overrides: Partial<HookProps> = {}): HookProps {
  return {
    signPsbt: jest.fn().mockResolvedValue(mockSignResult),
    address: 'test-ordinal-address',
    paymentAddress: 'test-payment-address',
    publicKey: 'test-public-key',
    paymentPublicKey: 'test-payment-public-key',
    collateralRuneInfo: mockRuneData,
    ...overrides,
  };
}

function setupSuccessfulMocks() {
  prepareLiquidiumBorrow.mockResolvedValue(mockPrepareResponse);
  submitLiquidiumBorrow.mockResolvedValue(mockSubmitResponse);
}

function setupErrorMocks(error: string) {
  prepareLiquidiumBorrow.mockResolvedValue({
    success: false,
    error,
  });
}

async function executeLoan(
  result: { current: ReturnType<typeof useBorrowProcess> },
  quoteId: string | null = 'quote-123',
  amount = '100',
  feeRate = 5,
) {
  await act(async () => {
    await result.current.startLoan(quoteId, amount, feeRate);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useBorrowProcess', () => {
  it('should initialize with correct default state', () => {
    const props = createProps();
    const { result } = renderHook(() => useBorrowProcess(props));

    expect(result.current.isPreparing).toBe(false);
    expect(result.current.isSigning).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.loanProcessError).toBe(null);
    expect(result.current.loanTxId).toBe(null);
    expect(typeof result.current.startLoan).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  // Parameterized validation tests
  test.each([
    { quoteId: null, amount: '100', description: 'missing quote ID' },
    {
      quoteId: 'quote-123',
      amount: '  ',
      description: 'empty collateral amount',
    },
    {
      quoteId: 'quote-123',
      amount: 'invalid-number',
      description: 'invalid collateral amount (NaN)',
    },
    {
      quoteId: 'quote-123',
      amount: '0',
      description: 'zero collateral amount',
    },
    {
      quoteId: 'quote-123',
      amount: '-5',
      description: 'negative collateral amount',
    },
  ])('should set error for $description', async ({ quoteId, amount }) => {
    const props = createProps();
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result, quoteId, amount);

    expect(result.current.loanProcessError).toBe(
      'Missing required information (quote or amount).',
    );
    expect(prepareLiquidiumBorrow).not.toHaveBeenCalled();
  });

  it('should complete full loan process successfully', async () => {
    setupSuccessfulMocks();
    const props = createProps();
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result, 'quote-123', '100.5', 10);

    expect(result.current.loanTxId).toBe('loan-tx-123');
    expect(result.current.loanProcessError).toBe(null);
    expect(result.current.isPreparing).toBe(false);
    expect(result.current.isSigning).toBe(false);
    expect(result.current.isSubmitting).toBe(false);

    expect(prepareLiquidiumBorrow).toHaveBeenCalledWith({
      instant_offer_id: 'quote-123',
      fee_rate: 10,
      token_amount: '10050000000', // 100.5 * 10^8 for 8 decimals
      borrower_payment_address: 'test-payment-address',
      borrower_payment_pubkey: 'test-payment-public-key',
      borrower_ordinal_address: 'test-ordinal-address',
      borrower_ordinal_pubkey: 'test-public-key',
      address: 'test-ordinal-address',
    });

    expect(props.signPsbt).toHaveBeenCalledWith('test-psbt-base64');
    expect(submitLiquidiumBorrow).toHaveBeenCalledWith({
      signed_psbt_base_64: 'signed-base64',
      prepare_offer_id: 'prepare-offer-123',
      address: 'test-ordinal-address',
    });
  });

  // Parameterized decimal tests
  test.each([
    { decimals: 0, amount: '150', expectedTokenAmount: '150' },
    { decimals: 8, amount: '1.5', expectedTokenAmount: '150000000' },
    { decimals: 18, amount: '1.5', expectedTokenAmount: '1500000000000000000' },
  ])(
    'should handle $decimals decimals correctly',
    async ({ decimals, amount, expectedTokenAmount }) => {
      setupSuccessfulMocks();
      const runeData = { ...mockRuneData, decimals };
      const props = createProps({ collateralRuneInfo: runeData });
      const { result } = renderHook(() => useBorrowProcess(props));

      await executeLoan(result, 'quote-123', amount);

      expect(prepareLiquidiumBorrow).toHaveBeenCalledWith(
        expect.objectContaining({ token_amount: expectedTokenAmount }),
      );
    },
  );

  // Parameterized error tests
  test.each([
    {
      setupMock: () => setupErrorMocks('Insufficient collateral'),
      expectedError: 'Insufficient collateral',
      description: 'API failure',
    },
    {
      setupMock: () =>
        prepareLiquidiumBorrow.mockResolvedValue({ success: true, data: null }),
      expectedError: 'Failed to prepare loan transaction.',
      description: 'missing response data',
    },
    {
      setupMock: () =>
        prepareLiquidiumBorrow.mockRejectedValue(
          new Error('Network connection failed'),
        ),
      expectedError: 'Network connection failed',
      description: 'network errors',
    },
    {
      setupMock: () =>
        prepareLiquidiumBorrow.mockRejectedValue('Unexpected error type'),
      expectedError: 'Failed to start loan.',
      description: 'unexpected errors',
    },
  ])('should handle $description', async ({ setupMock, expectedError }) => {
    setupMock();
    const props = createProps();
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result);

    expect(result.current.loanProcessError).toBe(expectedError);
    expect(result.current.loanTxId).toBe(null);
  });

  // Parameterized signing error tests
  test.each([
    { signResult: undefined, description: 'user canceling PSBT signing' },
    {
      signResult: { signedPsbtHex: 'hex-data', signedPsbtBase64: undefined },
      description: 'PSBT signing returning no base64',
    },
  ])('should handle $description', async ({ signResult }) => {
    prepareLiquidiumBorrow.mockResolvedValue(mockPrepareResponse);
    const props = createProps({
      signPsbt: jest.fn().mockResolvedValue(signResult),
    });
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result);

    expect(result.current.loanProcessError).toBe('User canceled the request');
  });

  it('should handle submit API failure', async () => {
    prepareLiquidiumBorrow.mockResolvedValue(mockPrepareResponse);
    submitLiquidiumBorrow.mockResolvedValue({
      success: false,
      error: 'Network error during submission',
    });
    const props = createProps();
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result);

    expect(result.current.loanProcessError).toBe(
      'Network error during submission',
    );
  });

  it('should reset state correctly', async () => {
    setupErrorMocks('Test error');
    const props = createProps();
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result);
    expect(result.current.loanProcessError).toBe('Test error');

    act(() => result.current.reset());

    expect(result.current.loanProcessError).toBe(null);
    expect(result.current.loanTxId).toBe(null);
  });

  it('should handle null collateralRuneInfo', async () => {
    setupSuccessfulMocks();
    const props = createProps({ collateralRuneInfo: null });
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result);

    expect(prepareLiquidiumBorrow).toHaveBeenCalledWith(
      expect.objectContaining({ token_amount: '100' }),
    );
  });

  it('should handle BigInt conversion errors gracefully', async () => {
    const originalBigInt = global.BigInt;
    (global as { BigInt: unknown }).BigInt = jest
      .fn()
      .mockImplementation(() => {
        throw new Error('BigInt conversion failed');
      });

    setupSuccessfulMocks();
    const props = createProps();
    const { result } = renderHook(() => useBorrowProcess(props));

    await executeLoan(result, 'quote-123', '100.5');

    expect(prepareLiquidiumBorrow).toHaveBeenCalledWith(
      expect.objectContaining({ token_amount: '10050000000' }),
    );

    global.BigInt = originalBigInt;
  });
});
