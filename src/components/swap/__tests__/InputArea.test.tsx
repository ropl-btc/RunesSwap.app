/**
 * @jest-environment node
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { BTC_ASSET } from '@/types/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InputArea from '@/components/swap/InputArea';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement('img', props),
}));

describe('InputArea', () => {
  it('renders with assetSelectorEnabled and no onAssetChange', () => {
    expect(() => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      renderToString(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(InputArea, {
            label: 'Label',
            inputId: 'input',
            inputValue: '',
            onInputChange: () => {}, // Add mock onChange to prevent React warning
            assetSelectorEnabled: true,
            selectedAsset: BTC_ASSET,
            availableAssets: [BTC_ASSET],
            onPercentageClick: undefined,
            errorMessage: undefined,
          }),
        ),
      );
    }).not.toThrow();
  });
});
