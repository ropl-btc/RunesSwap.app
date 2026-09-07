import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import RouteError from '@/app/error';
import appCss from '@/app/globals.css?url';
import NotFound from '@/app/not-found';
import { Providers } from '@/app/providers';
import Layout from '@/components/layout/Layout';

const title = 'RunesSwap.app | Swap Bitcoin Runes';
const description =
  'Swap Bitcoin Runes instantly with RunesSwap.app, the aggregator for Bitcoin Runes swaps. Connect your wallet, view live prices, and trade securely with low fees—almost always getting the best exchange rate.';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title },
      { name: 'description', content: description },
      { name: 'keywords', content: 'bitcoin,runes,swap,dex,inscriptions,ordiscan,sats,runeswap' },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:url', content: 'https://www.runesswap.app' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:site_name', content: 'RunesSwap.app' },
      { property: 'og:image', content: 'https://runesswap.app/icons/runesswap_logo.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://runesswap.app/icons/runesswap_logo.png' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  shellComponent: Document,
  component: App,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
});

function App() {
  return (
    <Providers>
      <Layout>
        <Outlet />
      </Layout>
    </Providers>
  );
}

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {import.meta.env.PROD && (
          <script
            type="module"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token":"b0a6014ed2eb41b6a34ddb6f700c60ac"}'
          />
        )}
      </body>
    </html>
  );
}
