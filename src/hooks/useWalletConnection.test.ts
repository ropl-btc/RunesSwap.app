import {
  LEATHER,
  MAGIC_EDEN,
  OKX,
  ORANGE,
  OYL,
  PHANTOM,
  type ProviderType,
  UNISAT,
  WIZZ,
  XVERSE,
} from '@omnisat/lasereyes';
import { act, renderHook } from '@testing-library/react';
import { AVAILABLE_WALLETS, useWalletConnection } from './useWalletConnection';

// Mock the LaserEyes context
jest.mock('@/context/LaserEyesContext', () => ({
  useSharedLaserEyes: jest.fn(),
}));

const { useSharedLaserEyes } = jest.requireMock('@/context/LaserEyesContext');

// DOM environment is handled by jest-environment-jsdom

function mockLaserEyes(
  overrides: Partial<ReturnType<typeof useSharedLaserEyes>> = {},
) {
  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();

  (useSharedLaserEyes as jest.Mock).mockReturnValue({
    connect: mockConnect,
    disconnect: mockDisconnect,
    connected: false,
    isConnecting: false,
    address: null,
    provider: null,
    hasUnisat: false,
    ...overrides,
  });

  return { mockConnect, mockDisconnect };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLaserEyes();
  // Mock console.error to suppress expected error logs in tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console.error
  jest.restoreAllMocks();
});

describe('useWalletConnection', () => {
  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useWalletConnection());

      expect(result.current.isDropdownOpen).toBe(false);
      expect(result.current.connectionError).toBe(null);
      expect(result.current.installLink).toBe(null);
      expect(result.current.connected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.address).toBe(null);
      expect(result.current.provider).toBe(null);
    });

    it('passes through LaserEyes state correctly', () => {
      mockLaserEyes({
        connected: true,
        isConnecting: false,
        address: 'bc1test123',
        provider: 'unisat',
      });

      const { result } = renderHook(() => useWalletConnection());

      expect(result.current.connected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.address).toBe('bc1test123');
      expect(result.current.provider).toBe('unisat');
    });
  });

  describe('toggleDropdown', () => {
    it('toggles dropdown state', () => {
      const { result } = renderHook(() => useWalletConnection());

      expect(result.current.isDropdownOpen).toBe(false);

      act(() => {
        result.current.toggleDropdown();
      });

      expect(result.current.isDropdownOpen).toBe(true);

      act(() => {
        result.current.toggleDropdown();
      });

      expect(result.current.isDropdownOpen).toBe(false);
    });

    it('clears errors when toggling dropdown', () => {
      const { result } = renderHook(() => useWalletConnection());

      // Set some error state first
      act(() => {
        result.current.handleConnect(UNISAT);
      });

      expect(result.current.connectionError).toBe(
        'Unisat wallet not installed.',
      );

      act(() => {
        result.current.toggleDropdown();
      });

      expect(result.current.connectionError).toBe(null);
      expect(result.current.installLink).toBe(null);
    });
  });

  describe('handleConnect', () => {
    it('successfully connects to wallet', async () => {
      const { mockConnect } = mockLaserEyes({
        hasUnisat: true,
      });
      mockConnect.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(UNISAT);
      });

      expect(mockConnect).toHaveBeenCalledWith(UNISAT);
      expect(result.current.connectionError).toBe(null);
      expect(result.current.installLink).toBe(null);
      expect(result.current.isDropdownOpen).toBe(false);
    });

    it('handles wallet not installed (Unisat specific check)', async () => {
      mockLaserEyes({
        hasUnisat: false,
      });

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(UNISAT);
      });

      expect(result.current.connectionError).toBe(
        'Unisat wallet not installed.',
      );
      expect(result.current.installLink).toBe('https://unisat.io/download');
    });

    it('handles connection error with wallet-specific patterns', async () => {
      const { mockConnect } = mockLaserEyes({
        hasUnisat: true,
      });
      mockConnect.mockRejectedValue(new Error('not detected'));

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(UNISAT);
      });

      expect(result.current.connectionError).toBe(
        'Unisat wallet not installed.',
      );
      expect(result.current.installLink).toBe('https://unisat.io/download');
    });

    it('handles connection error with common patterns', async () => {
      const { mockConnect } = mockLaserEyes();
      mockConnect.mockRejectedValue(new Error('provider not available'));

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(XVERSE);
      });

      expect(result.current.connectionError).toBe(
        'Xverse wallet not installed.',
      );
      expect(result.current.installLink).toBe(
        'https://www.xverse.app/download',
      );
    });

    it('handles generic connection error', async () => {
      const { mockConnect } = mockLaserEyes();
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(XVERSE);
      });

      expect(result.current.connectionError).toBe(
        'Failed to connect to Xverse: Connection failed',
      );
      expect(result.current.installLink).toBe(null);
    });

    it('handles non-Error exceptions', async () => {
      const { mockConnect } = mockLaserEyes();
      mockConnect.mockRejectedValue('string error');

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(XVERSE);
      });

      expect(result.current.connectionError).toBe(
        'Xverse wallet not installed.',
      );
      expect(result.current.installLink).toBe(
        'https://www.xverse.app/download',
      );
    });

    it('returns early if already connecting', async () => {
      const { mockConnect } = mockLaserEyes({
        isConnecting: true,
      });

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(UNISAT);
      });

      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('clears previous errors before connecting', async () => {
      const { mockConnect } = mockLaserEyes();
      mockConnect.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWalletConnection());

      // Set some error state first
      act(() => {
        result.current.toggleDropdown();
      });

      await act(async () => {
        await result.current.handleConnect(XVERSE);
      });

      expect(result.current.connectionError).toBe(null);
      expect(result.current.installLink).toBe(null);
    });

    it('uses provider name as fallback for unknown wallets', async () => {
      const { mockConnect } = mockLaserEyes();
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(WIZZ);
      });

      expect(result.current.connectionError).toBe(
        'Failed to connect to Wizz: Connection failed',
      );
    });
  });

  describe('handleDisconnect', () => {
    it('disconnects wallet and clears errors', () => {
      const { mockDisconnect } = mockLaserEyes();

      const { result } = renderHook(() => useWalletConnection());

      // Set some error state first
      act(() => {
        result.current.toggleDropdown();
      });

      act(() => {
        result.current.handleDisconnect();
      });

      expect(mockDisconnect).toHaveBeenCalled();
      expect(result.current.connectionError).toBe(null);
      expect(result.current.installLink).toBe(null);
    });
  });

  describe('click outside functionality', () => {
    it('closes dropdown when clicking outside', () => {
      const { result } = renderHook(() => useWalletConnection());

      // Open dropdown
      act(() => {
        result.current.toggleDropdown();
      });

      expect(result.current.isDropdownOpen).toBe(true);

      // Mock the dropdownRef to not contain the target (click outside)
      const mockContains = jest.fn().mockReturnValue(false);
      result.current.dropdownRef.current = {
        contains: mockContains,
      } as unknown as HTMLDivElement;

      // Simulate click outside
      act(() => {
        const event = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(result.current.isDropdownOpen).toBe(false);
    });

    it('does not close dropdown when clicking inside', () => {
      const { result } = renderHook(() => useWalletConnection());

      // Open dropdown
      act(() => {
        result.current.toggleDropdown();
      });

      expect(result.current.isDropdownOpen).toBe(true);

      // Mock the dropdownRef to contain the target
      const mockContains = jest.fn().mockReturnValue(true);
      result.current.dropdownRef.current = {
        contains: mockContains,
      } as unknown as HTMLDivElement;

      // Simulate click inside
      act(() => {
        const event = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(result.current.isDropdownOpen).toBe(true);
    });

    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener',
      );

      const { unmount } = renderHook(() => useWalletConnection());

      // Event listener should not be removed yet
      expect(removeEventListenerSpy).not.toHaveBeenCalled();

      // Unmount the hook to trigger cleanup
      unmount();

      // Now the event listener should be removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('wallet error patterns', () => {
    it.each([
      [UNISAT, 'not detected', 'https://unisat.io/download'],
      [
        XVERSE,
        'no bitcoin wallet installed',
        'https://www.xverse.app/download',
      ],
      [
        LEATHER,
        "leather isn't installed",
        'https://leather.io/install-extension',
      ],
      [
        OYL,
        "oyl isn't installed",
        'https://chromewebstore.google.com/detail/oyl-wallet-bitcoin-ordina/ilolmnhjbbggkmopnemiphomhaojndmb',
      ],
      [
        MAGIC_EDEN,
        'no bitcoin wallet installed',
        'https://wallet.magiceden.io/download',
      ],
      [
        OKX,
        'cannot read properties of undefined',
        'https://web3.okx.com/en-eu/download',
      ],
      [
        ORANGE,
        'no orange bitcoin wallet installed',
        'https://chromewebstore.google.com/detail/orange-wallet/glmhbknppefdmpemdmjnjlinpbclokhn?hl=en&authuser=0',
      ],
      [PHANTOM, "phantom isn't installed", 'https://phantom.com/download'],
      [WIZZ, 'wallet is not installed', 'https://wizzwallet.io/'],
    ])(
      'handles %s wallet error pattern "%s"',
      async (provider, errorMessage, expectedLink) => {
        const { mockConnect } = mockLaserEyes();
        mockConnect.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useWalletConnection());

        await act(async () => {
          await result.current.handleConnect(provider as ProviderType);
        });

        const walletName =
          AVAILABLE_WALLETS.find((w) => w.provider === provider)?.name ||
          provider;
        expect(result.current.connectionError).toBe(
          `${walletName} wallet not installed.`,
        );
        expect(result.current.installLink).toBe(expectedLink);
      },
    );
  });

  describe('AVAILABLE_WALLETS constant', () => {
    it('exports correct wallet configuration', () => {
      expect(AVAILABLE_WALLETS).toEqual([
        { name: 'Xverse', provider: XVERSE },
        { name: 'Unisat', provider: UNISAT },
        { name: 'Leather', provider: LEATHER },
        { name: 'OKX', provider: OKX },
        { name: 'Magic Eden', provider: MAGIC_EDEN },
        { name: 'OYL', provider: OYL },
        { name: 'Orange', provider: ORANGE },
        {
          name: 'Phantom',
          provider: PHANTOM,
          disclaimer:
            'Runes are not supported in Phantom wallet. Use with caution.',
        },
        { name: 'Wizz', provider: WIZZ },
      ]);
    });
  });
});
