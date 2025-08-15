'use client';

import { useQuery } from '@tanstack/react-query';
//
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useBorrowProcess } from '@/hooks/useBorrowProcess';
import useBorrowQuotes from '@/hooks/useBorrowQuotes';
import { useLiquidiumAuth } from '@/hooks/useLiquidiumAuth';
import { useRuneBalance } from '@/hooks/useRuneBalance';
import { useRuneInfo } from '@/hooks/useRuneInfo';
import { useRuneMarketData } from '@/hooks/useRuneMarketData';
import { QUERY_KEYS, fetchRuneBalancesFromApi } from '@/lib/api';
import { Asset } from '@/types/common';
import { type RuneBalance as OrdiscanRuneBalance } from '@/types/ordiscan';
import { percentageOfRawAmount } from '@/utils/amountFormatting';
import { formatUsd } from '@/utils/formatters';
import BorrowQuotesList from '@/components/borrow/BorrowQuotesList';
import BorrowSuccessMessage from '@/components/borrow/BorrowSuccessMessage';
import CollateralInput from '@/components/borrow/CollateralInput';
import { FormattedRuneAmount } from '@/components/formatters/FormattedRuneAmount';
import { Loading } from '@/components/loading/Loading';
import Button from '@/components/ui/Button';
import FeeSelector from '@/components/ui/FeeSelector';
import styles from '@/components/borrow/BorrowTab.module.css';

interface BorrowTabProps {
  connected: boolean;
  address: string | null;
  paymentAddress: string | null;
  publicKey: string | null;
  paymentPublicKey: string | null;
  signPsbt: (
    tx: string,
    finalize?: boolean,
    broadcast?: boolean,
  ) => Promise<
    | {
        signedPsbtHex: string | undefined;
        signedPsbtBase64: string | undefined;
        txId?: string;
      }
    | undefined
  >;
  signMessage:
    | ((message: string, address: string) => Promise<string>)
    | undefined;
  btcPriceUsd: number | undefined;
  isBtcPriceLoading: boolean;
  btcPriceError: Error | null;
  cachedPopularRunes?: Record<string, unknown>[] | undefined;
  isPopularRunesLoading?: boolean | undefined;
  popularRunesError?: Error | null | undefined;
}

export function BorrowTab({
  connected,
  address,
  paymentAddress,
  publicKey,
  paymentPublicKey,
  signPsbt,
  signMessage,
  cachedPopularRunes = [],
  isPopularRunesLoading = false,
  popularRunesError = null,
}: BorrowTabProps) {
  const router = useRouter();
  const [collateralAsset, setCollateralAsset] = useState<Asset | null>(null);
  const [collateralAmount, setCollateralAmount] = useState('');
  const [feeRate, setFeeRate] = useState(0);

  const { data: runeBalances, isLoading: isRuneBalancesLoading } = useQuery<
    OrdiscanRuneBalance[],
    Error
  >({
    queryKey: [QUERY_KEYS.RUNE_BALANCES, address],
    queryFn: () => fetchRuneBalancesFromApi(address!),
    enabled: !!connected && !!address,
    staleTime: 30000,
  });

  const { data: collateralRuneInfo, isLoading: isCollateralRuneInfoLoading } =
    useRuneInfo(collateralAsset?.isBTC ? null : collateralAsset?.name, {
      enabled: !!collateralAsset && !collateralAsset.isBTC,
    });

  const { data: collateralRuneMarketInfo } = useRuneMarketData(
    collateralAsset?.isBTC ? null : collateralAsset?.name,
    {
      enabled: !!collateralAsset && !collateralAsset.isBTC,
      staleTime: 5 * 60 * 1000,
    },
  );

  const {
    popularRunes,
    isPopularLoading,
    popularError,
    quotes,
    isQuotesLoading,
    quotesError,
    selectedQuoteId,
    setSelectedQuoteId,
    minMaxRange,
    borrowRangeError,
    resetQuotes,
    handleGetQuotes,
  } = useBorrowQuotes({
    collateralAsset,
    collateralAmount,
    address,
    collateralRuneInfo: collateralRuneInfo ?? null,
    cachedPopularRunes,
    isPopularRunesLoading,
    popularRunesError,
  });

  const {
    isCheckingAuth,
    liquidiumAuthenticated,
    isAuthenticating,
    authError,
    handleLiquidiumAuth,
  } = useLiquidiumAuth({ address, paymentAddress, signMessage });

  const {
    startLoan,
    reset: resetLoanProcess,
    isPreparing,
    isSigning,
    isSubmitting,
    loanProcessError,
    loanTxId,
  } = useBorrowProcess({
    signPsbt,
    address: address ?? '',
    paymentAddress: paymentAddress ?? '',
    publicKey: publicKey ?? '',
    paymentPublicKey: paymentPublicKey ?? '',
    collateralRuneInfo: collateralRuneInfo ?? null,
  });

  // Use centralized balance calculation hook at top level
  const collateralRawBalance = useRuneBalance(
    collateralAsset?.name,
    runeBalances,
  );

  const handleSelectCollateral = (asset: Asset) => {
    setCollateralAsset(asset);
    setCollateralAmount('');
    resetQuotes();
    setSelectedQuoteId(null);
    resetLoanProcess();
  };

  const isLoading = isQuotesLoading || isPreparing || isSigning || isSubmitting;
  const canGetQuotes =
    connected &&
    collateralAsset &&
    parseFloat(collateralAmount) > 0 &&
    !isLoading &&
    liquidiumAuthenticated;
  const canStartLoan = connected && selectedQuoteId && !isLoading && !loanTxId;

  const availableBalanceDisplay =
    connected && collateralAsset && !collateralAsset.isBTC ? (
      isRuneBalancesLoading || isCollateralRuneInfoLoading ? (
        <Loading variant="dots" message="Loading balance" />
      ) : (
        <FormattedRuneAmount
          runeName={collateralAsset.name}
          rawAmount={collateralRawBalance}
        />
      )
    ) : null;

  const usdValue =
    collateralAmount &&
    parseFloat(collateralAmount) > 0 &&
    collateralRuneMarketInfo?.price_in_usd
      ? formatUsd(
          parseFloat(collateralAmount) * collateralRuneMarketInfo.price_in_usd,
        )
      : undefined;

  return (
    <div className={styles.borrowTabContainer}>
      <h1 className="heading">Borrow Against Runes</h1>

      <CollateralInput
        connected={connected}
        collateralAsset={collateralAsset}
        onCollateralAssetChange={handleSelectCollateral}
        collateralAmount={collateralAmount}
        onCollateralAmountChange={(value) => {
          setCollateralAmount(value);
          resetQuotes();
          setSelectedQuoteId(null);
        }}
        availableAssets={popularRunes}
        isAssetsLoading={isPopularLoading}
        assetsError={popularError}
        disabled={isLoading}
        availableBalance={availableBalanceDisplay}
        usdValue={usdValue}
        minMaxRange={minMaxRange || undefined}
        onPercentageClick={(percentage) => {
          if (!connected || !collateralAsset) return;
          const rawBalance = collateralRawBalance;
          if (!rawBalance) return;
          const decimals = collateralRuneInfo?.decimals ?? 0;
          const formattedAmount = percentageOfRawAmount(
            rawBalance,
            decimals,
            percentage,
          );
          setCollateralAmount(formattedAmount);
          resetQuotes();
          setSelectedQuoteId(null);
        }}
      />

      {borrowRangeError && (
        <div className="errorText" style={{ marginBottom: 8 }}>
          {borrowRangeError}
        </div>
      )}

      {isCheckingAuth ? (
        <Button disabled>Checking Liquidium connection...</Button>
      ) : !liquidiumAuthenticated ? (
        <>
          <Button onClick={handleLiquidiumAuth} disabled={isAuthenticating}>
            {isAuthenticating ? 'Authenticating...' : 'Connect to Liquidium'}
          </Button>
          {authError && <div className="errorText">{authError}</div>}
        </>
      ) : (
        <Button onClick={handleGetQuotes} disabled={!canGetQuotes || isLoading}>
          {isQuotesLoading ? 'Fetching Quotes...' : 'Get Loan Quotes'}
        </Button>
      )}

      {quotesError && <div className="errorText">{quotesError}</div>}
      {quotes.length > 0 && (
        <BorrowQuotesList
          quotes={quotes}
          selectedQuoteId={selectedQuoteId}
          onSelectQuote={setSelectedQuoteId}
        />
      )}

      {selectedQuoteId && (
        <>
          <FeeSelector onChange={setFeeRate} />
          <Button
            onClick={() =>
              startLoan(selectedQuoteId, collateralAmount, feeRate)
            }
            disabled={!canStartLoan}
          >
            {isPreparing
              ? 'Preparing...'
              : isSigning
                ? 'Waiting for Signature...'
                : isSubmitting
                  ? 'Submitting...'
                  : 'Start Loan'}
          </Button>
        </>
      )}

      {loanProcessError && (
        <div className={`errorText ${styles.messageWithIcon}`}>
          <Image
            src="/icons/msg_error-0.png"
            alt="Error"
            className={styles.messageIcon}
            width={16}
            height={16}
          />
          <span>Error: {loanProcessError}</span>
        </div>
      )}

      <BorrowSuccessMessage
        loanTxId={loanTxId}
        onViewPortfolio={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('tabChange', { detail: { tab: 'portfolio' } }),
            );
          }
          router.push('/?tab=portfolio', { scroll: false });
        }}
        onStartAnother={() => {
          resetLoanProcess();
          setSelectedQuoteId(null);
          resetQuotes();
        }}
      />
    </div>
  );
}

export default BorrowTab;
