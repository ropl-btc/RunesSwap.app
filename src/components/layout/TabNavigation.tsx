import { ClientOnly, Link, useLocation } from '@tanstack/react-router';
import { createClientOnlyFn } from '@tanstack/react-start';
import { lazy, Suspense } from 'react';
import styles from '@/app/page.module.css';

const ConnectWalletButton = lazy(
  createClientOnlyFn(() => import('@/components/wallet/ConnectWalletButton')),
);

const TAB_ROUTES = [
  { tab: 'swap', href: '/swap', label: 'Swap' },
  { tab: 'borrow', href: '/borrow', label: 'Borrow' },
  { tab: 'runesInfo', href: '/runes-info', label: 'Runes Info' },
  { tab: 'yourTxs', href: '/your-txs', label: 'Your TXs' },
  { tab: 'portfolio', href: '/portfolio', label: 'Portfolio' },
] as const;

/**
 * Union type representing the available tabs in the application.
 */
export type ActiveTab = (typeof TAB_ROUTES)[number]['tab'];

/**
 * Renders the top tab navigation as route links.
 *
 * Active styling is derived from the current pathname.
 */
export default function TabNavigation() {
  const { pathname } = useLocation();

  return (
    <div className={styles.headerContainer}>
      <div className={styles.tabsInHeader}>
        {TAB_ROUTES.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.tab}
              to={route.href}
              className={`${styles.pageTabButton} ${isActive ? styles.pageTabActive : ''}`}
            >
              {route.label}
            </Link>
          );
        })}
      </div>
      <div className={styles.connectButtonContainer}>
        <ClientOnly>
          <Suspense fallback={null}>
            <ConnectWalletButton />
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  );
}
