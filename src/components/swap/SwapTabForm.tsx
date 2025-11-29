import React from 'react';
import type { QuoteResponse } from 'satsterminal-sdk';

import type { SwapStep } from '@/components/swap';
import {
  PriceInfoPanel,
  SwapButton,
  SwapDirectionButton,
  SwapStatusMessages,
} from '@/components/swap';
import { InputArea } from '@/components/swap/InputArea';
import styles from '@/components/swap/SwapTab.module.css';
import type { Asset } from '@/types/common';

/**
 * Props for the SwapTabForm component.
 */
interface SwapTabFormProps {
  /** Whether the wallet is connected. */
  connected: boolean;
  /** The input asset. */
  assetIn: Asset | null;
  /** The output asset. */
  assetOut: Asset | null;
  /** The input amount string. */
  inputAmount: string;
  /** The output amount string. */
  outputAmount: string;
  /** Callback when input amount changes. */
  onInputAmountChange: (val: string) => void;
  /** Callback when input asset is selected. */
  onSelectAssetIn: (asset: Asset) => void;
  /** Callback when output asset is selected. */
  onSelectAssetOut: (asset: Asset) => void;
  /** Callback to swap direction. */
  onSwapDirection: () => void;
  /** Callback when percentage shortcut is clicked. */
  onPercentageClick: (percentage: number) => void;
  /** List of available Runes. */
  availableRunes: Asset[];
  /** Whether Runes are loading. */
  isLoadingRunes: boolean;
  /** Error loading Runes. */
  currentRunesError: string | null;
  /** Display element for available balance. */
  availableBalanceNode: React.ReactNode;
  /** USD value of input amount. */
  inputUsdValue?: string | null;
  /** USD value of output amount. */
  outputUsdValue?: string | null;
  /** Exchange rate string. */
  exchangeRate: string | null;
  /** Whether quote is loading. */
  isQuoteLoading: boolean;
  /** Whether swap is in progress. */
  isSwapping: boolean;
  /** Quote error message. */
  quoteError: string | null;
  /** Swap error message. */
  swapError: string | null;
  /** Current quote response. */
  quote: QuoteResponse | null;
  /** Whether quote has expired. */
  quoteExpired: boolean;
  /** Current swap step. */
  swapStep: SwapStep;
  /** Transaction ID of successful swap. */
  txId: string | null;
  /** Loading dots animation string. */
  loadingDots: string;
  /** Callback to fetch quote. */
  onFetchQuote: () => void;
  /** Callback to execute swap. */
  onSwap: () => void;
  /** Debounced input amount. */
  debouncedInputAmount: number;
  /** Whether price chart is shown. */
  showPriceChart: boolean;
  /** Callback to show price chart. */
  onShowPriceChart:
    | ((
        assetName?: string | undefined,
        shouldToggle?: boolean | undefined,
      ) => void)
    | undefined;
  /** Whether preselected Rune is loading. */
  isPreselectedRuneLoading: boolean;
  /** Fee selector component. */
  feeSelector: React.ReactNode;
}

/**
 * Component that renders the form for the Swap tab.
 * Contains input fields, asset selectors, buttons, and status messages.
 *
 * @param props - Component props.
 */
export default function SwapTabForm({
  connected,
  assetIn,
  assetOut,
  inputAmount,
  outputAmount,
  onInputAmountChange,
  onSelectAssetIn,
  onSelectAssetOut,
  onSwapDirection,
  onPercentageClick,
  availableRunes,
  isLoadingRunes,
  currentRunesError,
  availableBalanceNode,
  inputUsdValue,
  outputUsdValue,
  exchangeRate,
  isQuoteLoading,
  isSwapping,
  quoteError,
  swapError,
  quote,
  quoteExpired,
  swapStep,
  txId,
  loadingDots,
  onFetchQuote,
  onSwap,
  debouncedInputAmount,
  showPriceChart,
  onShowPriceChart,
  isPreselectedRuneLoading,
  feeSelector,
}: SwapTabFormProps) {
  return (
    <div className={styles.swapTabContainer}>
      <h1 className="heading">Swap</h1>
      <InputArea
        label="You Pay"
        inputId="input-amount"
        inputValue={inputAmount}
        onInputChange={onInputAmountChange}
        placeholder="0.0"
        min="0"
        step="0.001"
        assetSelectorEnabled
        selectedAsset={assetIn}
        onAssetChange={onSelectAssetIn}
        availableAssets={availableRunes}
        showBtcInSelector
        isAssetsLoading={isLoadingRunes}
        assetsError={currentRunesError}
        showPercentageShortcuts={connected && !!assetIn}
        onPercentageClick={onPercentageClick}
        availableBalance={availableBalanceNode}
        usdValue={inputUsdValue || undefined}
        errorMessage={undefined}
      />
      <SwapDirectionButton
        assetIn={assetIn}
        assetOut={assetOut}
        disabled={!assetIn || !assetOut || isSwapping || isQuoteLoading}
        onClick={onSwapDirection}
      />
      <InputArea
        label="You Receive (Estimated)"
        inputId="output-amount"
        inputValue={isQuoteLoading ? `Loading${loadingDots}` : outputAmount}
        placeholder="0.0"
        readOnly
        assetSelectorEnabled
        selectedAsset={assetOut}
        onAssetChange={onSelectAssetOut}
        availableAssets={availableRunes}
        showBtcInSelector
        isAssetsLoading={isLoadingRunes}
        assetsError={currentRunesError}
        isPreselectedAssetLoading={isPreselectedRuneLoading}
        onPercentageClick={undefined}
        usdValue={outputUsdValue || undefined}
        errorMessage={quoteError && !isQuoteLoading ? quoteError : undefined}
        bottomContent={
          quoteError && !isQuoteLoading ? (
            <div
              className="smallText"
              style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
            >
              Please retry the swap, reconnect your wallet, or try a different
              amount.
            </div>
          ) : undefined
        }
      />
      <PriceInfoPanel
        assetIn={assetIn}
        assetOut={assetOut}
        exchangeRate={exchangeRate}
        isQuoteLoading={isQuoteLoading}
        quoteError={quoteError}
        debouncedInputAmount={debouncedInputAmount}
        loadingDots={loadingDots}
        showPriceChart={showPriceChart}
        onShowPriceChart={onShowPriceChart}
      />
      {feeSelector}
      <SwapButton
        connected={connected}
        assetIn={assetIn}
        assetOut={assetOut}
        inputAmount={inputAmount}
        isQuoteLoading={isQuoteLoading}
        isSwapping={isSwapping}
        quoteError={quoteError}
        quote={quote}
        quoteExpired={quoteExpired}
        swapStep={swapStep}
        txId={txId}
        loadingDots={loadingDots}
        onFetchQuote={onFetchQuote}
        onSwap={onSwap}
      />
      <SwapStatusMessages
        isSwapping={isSwapping}
        swapStep={swapStep}
        swapError={swapError}
        txId={txId}
        loadingDots={loadingDots}
      />
    </div>
  );
}
