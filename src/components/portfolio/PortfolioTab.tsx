import { useNavigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import LiquidiumLoansSection from '@/components/borrow/LiquidiumLoansSection';
import styles from '@/components/portfolio/PortfolioTab.module.css';
import RunesPortfolioTable from '@/components/portfolio/RunesPortfolioTable';
import { useSharedLaserEyes } from '@/context/LaserEyesContext';
import { useLiquidiumAuth } from '@/hooks/useLiquidiumAuth';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useRepayModal } from '@/hooks/useRepayModal';
import type { Asset } from '@/types/common';
import { formatSatsToBtc } from '@/utils/formatters';

const RepayModal = lazy(() => import('@/components/borrow/RepayModal'));

/**
 * Main component for the Portfolio tab.
 * Displays user's Rune balances and Liquidium loans.
 * Handles sorting, swapping, and loan repayment.
 */
export default function PortfolioTab() {
  const navigate = useNavigate();
  const { address, paymentAddress, signMessage, signPsbt } = useSharedLaserEyes();

  const {
    sortedBalances,
    totalBtcValue,
    totalUsdValue,
    sortField,
    sortDirection,
    handleSort,
    progress,
    stepText,
    isLoading,
    error,
  } = usePortfolioData(address);

  const {
    loans,
    isCheckingAuth,
    liquidiumAuthenticated,
    isAuthenticating,
    authError,
    isLoadingLiquidium,
    liquidiumError,
    handleLiquidiumAuth,
  } = useLiquidiumAuth({ address, paymentAddress, signMessage });

  const {
    isRepayingLoanId,
    repayModal,
    handleRepay,
    handleRepayModalClose,
    handleRepayModalConfirm,
  } = useRepayModal({ address, signPsbt });

  const handleSwap = (asset: Asset) => {
    void navigate({ to: '/swap', search: { rune: asset.name }, resetScroll: false });
  };

  if (!address) {
    return (
      <div className={styles.container}>
        <div>Connect your wallet to view your portfolio</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.progressContainer}>
          <div className={styles.progressBarOuter}>
            <div
              className={styles.progressBarInner}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div>{stepText}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className="errorText">Error loading portfolio</div>
      </div>
    );
  }

  if (!sortedBalances.length) {
    return (
      <div className={styles.container}>
        <div>No runes found in your wallet</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <RunesPortfolioTable
        balances={sortedBalances}
        totalBtcValue={totalBtcValue}
        totalUsdValue={totalUsdValue}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onSwap={handleSwap}
      />

      <div className={styles.sectionDivider}>
        <div className={`${styles.dividerLine} ${styles.top}`}></div>
        <div className={`${styles.dividerLine} ${styles.bottom}`}></div>
        <div className="heading" style={{ marginTop: '1rem' }}>
          Liquidium Loans
        </div>
      </div>

      <LiquidiumLoansSection
        loans={loans}
        isCheckingAuth={isCheckingAuth}
        liquidiumAuthenticated={liquidiumAuthenticated}
        isAuthenticating={isAuthenticating}
        authError={authError}
        isLoadingLiquidium={isLoadingLiquidium}
        liquidiumError={liquidiumError}
        isRepayingLoanId={isRepayingLoanId}
        onAuth={handleLiquidiumAuth}
        onRepay={handleRepay}
      />

      <Suspense fallback={null}>
        <RepayModal
          open={repayModal.open}
          repayAmount={
            repayModal.loan
              ? `${formatSatsToBtc(
                  repayModal.loan.loan_details.total_repayment_sats ??
                    repayModal.loan.loan_details.principal_amount_sats *
                      (1 + repayModal.loan.loan_details.discount.discount_rate),
                )} BTC`
              : '...'
          }
          psbtPreview={repayModal.repayInfo?.psbt?.slice(0, 32) || ''}
          loading={repayModal.loading}
          error={repayModal.error}
          onCancel={handleRepayModalClose}
          onConfirm={handleRepayModalConfirm}
        />
      </Suspense>
    </div>
  );
}
