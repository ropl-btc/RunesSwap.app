# RunesSwap Coding Guide

This file provides instructions for automated coding agents working with the **RunesSwap.app** repository.

## Overview

RunesSwap.app is a Next.js application written in **TypeScript**. It offers a swap and borrowing interface for Bitcoin Runes with a Windows‑98 style theme.

The application integrates the following external services:

*   **CoinGecko:** For fetching the current price of Bitcoin.
*   **Liquidium:** For handling borrowing and loan management.
*   **Ordiscan:** For fetching on-chain UTXO and Rune data.
*   **SatsTerminal:** For swap execution and PSBT handling.
*   **mempool.space:** For fetching recommended Bitcoin fee rates.
*   **Supabase:** For caching, and data storage.

The main source code lives in `src/` and uses the Next.js App Router.
API routes under `src/app/api` act as a thin backend to proxy and cache requests to the above services. Server data is fetched with React Query, and client state is handled by Zustand. Type definitions are organised under `src/types`.

## Repository Layout

```text
/ (repo root)
├── src/                 # Application source code
│   ├── app/             # Next.js pages and API routes
│   │   ├── api/         # Serverless API endpoints
│   │   └── ...
│   ├── components/      # React components (SwapTab, BorrowTab, etc.)
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # API client utilities, data helpers
│   │   └── api/         # Service-specific API modules
│   ├── store/           # Zustand stores
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Helper functions
├── public/              # Static assets and fonts
└── ...                  # Config files and scripts
```

A `.env.example` file shows all environment variables needed for development.

**Security Note:** Never use `NEXT_PUBLIC_` prefix for sensitive API keys as it exposes them to the client-side. Use server-side environment variables for authentication tokens.

## Development

Install dependencies and start the development server with **pnpm**:

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`.

## Testing and Linting

*   Unit tests use **Jest** with the `ts-jest` preset:

    ```bash
    pnpm test
    ```
*   Linting uses **ESLint** and Prettier:

    ```bash
    pnpm lint
    ```

The pre‑commit hook runs `lint-staged`, the test suite, and a production build. Commit messages are checked by **commitlint** and must follow the Conventional Commits format.

## Architecture Notes

*   Uses **Next.js App Router** for routing.
*   API routes wrap external services and return standardized responses via helpers in `src/lib/apiUtils.ts`.
*   API client methods are organized into modules under `src/lib/api/`.
*   React components under `src/components` implement the swap, borrow, portfolio and info tabs.
*   State is managed with React Query (server data) and Zustand (client state); shared contexts live in `src/context`.
*   Path alias `@/*` resolves to `./src/*` (configured in `tsconfig.json` and Jest).
*   Styles use CSS Modules plus global variables for the Windows 98 theme.
*   The README is rendered through `src/app/docs` for in‑app documentation.
