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
import {
  AVAILABLE_WALLETS,
  useWalletConnection,
} from '@/hooks/useWalletConnection';

// Test data fixtures
const WALLET_FIXTURES = {
  providers: [
    UNISAT,
    XVERSE,
    LEATHER,
    OYL,
    MAGIC_EDEN,
    OKX,
    PHANTOM,
    WIZZ,
  ] as const,
  installErrorPatterns: [
    'not detected',
    'no bitcoin wallet installed',
    'not installed',
    'provider not available',
  ],
  installLinks: {
    [UNISAT]: 'https://unisat.io/download',
    [XVERSE]: 'https://www.xverse.app/download',
    [LEATHER]: 'https://leather.io/install-extension',
    [OYL]:
      'https://chromewebstore.google.com/detail/oyl-wallet-bitcoin-ordina/ilolmnhjbbggkmopnemiphomhaojndmb',
    [MAGIC_EDEN]: 'https://wallet.magiceden.io/download',
    [OKX]: 'https://web3.okx.com/en-eu/download',
    [ORANGE]:
      'https://chromewebstore.google.com/detail/orange-wallet/glmhknppefdmpemdmjnjlinpbclokhn?hl=en&authuser=0',
    [PHANTOM]: 'https://phantom.com/download',
    [WIZZ]: 'https://wizzwallet.io/',
  },
};

// Mock LaserEyes context
jest.mock('@/context/LaserEyesContext', () => ({
  useSharedLaserEyes: jest.fn(),
}));

const { useSharedLaserEyes } = jest.requireMock('@/context/LaserEyesContext');

// Test utilities
function createMockLaserEyes(overrides = {}) {
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

function mockClickOutside(
  result: { current: { dropdownRef: { current: HTMLDivElement | null } } },
  shouldClose: boolean,
) {
  const mockContains = jest.fn().mockReturnValue(!shouldClose);
  result.current.dropdownRef.current = {
    contains: mockContains,
  } as unknown as HTMLDivElement;

  act(() => {
    document.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  createMockLaserEyes();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useWalletConnection', () => {
  describe('initial state and integration', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useWalletConnection());

      expect(result.current).toMatchObject({
        isDropdownOpen: false,
        connectionError: null,
        installLink: null,
        connected: false,
        isConnecting: false,
        address: null,
        provider: null,
      });
    });

    it('passes through LaserEyes state', () => {
      createMockLaserEyes({
        connected: true,
        address: 'bc1test123',
        provider: 'unisat',
      });

      const { result } = renderHook(() => useWalletConnection());

      expect(result.current).toMatchObject({
        connected: true,
        address: 'bc1test123',
        provider: 'unisat',
      });
    });
  });

  describe('dropdown management', () => {
    it('toggles dropdown and clears errors', () => {
      const { result } = renderHook(() => useWalletConnection());

      act(() => result.current.toggleDropdown());
      expect(result.current.isDropdownOpen).toBe(true);

      act(() => result.current.toggleDropdown());
      expect(result.current.isDropdownOpen).toBe(false);
    });

    it('handles click outside to close dropdown', () => {
      const { result } = renderHook(() => useWalletConnection());

      act(() => result.current.toggleDropdown());
      mockClickOutside(result, true);
      expect(result.current.isDropdownOpen).toBe(false);
    });

    it('keeps dropdown open when clicking inside', () => {
      const { result } = renderHook(() => useWalletConnection());

      act(() => result.current.toggleDropdown());
      mockClickOutside(result, false);
      expect(result.current.isDropdownOpen).toBe(true);
    });
  });

  describe('wallet connection', () => {
    it('successfully connects and closes dropdown', async () => {
      const { mockConnect } = createMockLaserEyes({ hasUnisat: true });
      mockConnect.mockResolvedValue(undefined);
      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(UNISAT);
      });

      expect(mockConnect).toHaveBeenCalledWith(UNISAT);
      expect(result.current).toMatchObject({
        connectionError: null,
        installLink: null,
        isDropdownOpen: false,
      });
    });

    it('prevents connection when already connecting', async () => {
      const { mockConnect } = createMockLaserEyes({ isConnecting: true });
      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(UNISAT);
      });

      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('handles Unisat wallet not installed', async () => {
      createMockLaserEyes({ hasUnisat: false });
      const { result } = renderHook(() => useWalletConnection());

      await act(async () => {
        await result.current.handleConnect(UNISAT);
      });

      expect(result.current.connectionError).toBe(
        'Unisat wallet not installed.',
      );
      expect(result.current.installLink).toBe('https://unisat.io/download');
    });

    it.each(WALLET_FIXTURES.installErrorPatterns)(
      'handles install error pattern: "%s"',
      async (errorMessage) => {
        const { mockConnect } = createMockLaserEyes();
        mockConnect.mockRejectedValue(new Error(errorMessage));
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
      },
    );

    it('handles generic connection errors', async () => {
      const { mockConnect } = createMockLaserEyes();
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

    it('handles non-Error exceptions as wallet not installed', async () => {
      const { mockConnect } = createMockLaserEyes();
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
  });

  describe('disconnect and cleanup', () => {
    it('disconnects wallet and clears errors', () => {
      const { mockDisconnect } = createMockLaserEyes();
      const { result } = renderHook(() => useWalletConnection());

      act(() => result.current.handleDisconnect());

      expect(mockDisconnect).toHaveBeenCalled();
      expect(result.current).toMatchObject({
        connectionError: null,
        installLink: null,
      });
    });

    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener',
      );
      const { unmount } = renderHook(() => useWalletConnection());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function),
      );
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('wallet-specific install links', () => {
    it.each(WALLET_FIXTURES.providers)(
      'provides correct install link for %s',
      async (provider) => {
        const { mockConnect } = createMockLaserEyes();
        mockConnect.mockRejectedValue(new Error('not installed'));
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
        expect(result.current.installLink).toBe(
          WALLET_FIXTURES.installLinks[provider],
        );
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
