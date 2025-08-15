import React from 'react';
import { LiquidiumLoanOffer } from '@/types/liquidium';
import { formatSatsToBtc } from '@/utils/formatters';
import { FormattedLiquidiumCollateral } from '@/components/formatters/FormattedLiquidiumCollateral';
import styles from '@/components/portfolio/PortfolioTab.module.css';
import Button from '@/components/ui/Button';
import Big from 'big.js';

interface LiquidiumLoansSectionProps {
  loans: LiquidiumLoanOffer[];
  isCheckingAuth: boolean;
  liquidiumAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  isLoadingLiquidium: boolean;
  liquidiumError: string | null;
  isRepayingLoanId: string | null;
  onAuth: () => void;
  onRepay: (loan: LiquidiumLoanOffer) => void;
}

const LiquidiumLoansSection: React.FC<LiquidiumLoansSectionProps> = ({
  loans,
  isCheckingAuth,
  liquidiumAuthenticated,
  isAuthenticating,
  authError,
  isLoadingLiquidium,
  liquidiumError,
  isRepayingLoanId,
  onAuth,
  onRepay,
}) => (
  <div className={styles.liquidiumContainer}>
    <div className={`${styles.liquidiumHeader} ${styles.grid6col}`}>
      <div style={{ fontWeight: 'bold' }}>Collateral</div>
      <div style={{ fontWeight: 'bold' }}>Principal</div>
      <div style={{ fontWeight: 'bold' }}>Status</div>
      <div style={{ fontWeight: 'bold' }}>Due Date</div>
      <div style={{ fontWeight: 'bold' }}>Repayment</div>
      <div style={{ fontWeight: 'bold' }}>Action</div>
    </div>
    <div className={styles.listContent}>
      {isCheckingAuth ? (
        <div>Checking Liquidium connection...</div>
      ) : !liquidiumAuthenticated ? (
        <div className={styles.liquidiumAuth}>
          <Button onClick={onAuth} disabled={isAuthenticating}>
            {isAuthenticating ? 'Authenticating...' : 'Connect to Liquidium'}
          </Button>
          {authError && <div className="errorText">{authError}</div>}
        </div>
      ) : isLoadingLiquidium ? (
        <div>Loading Liquidium loans...</div>
      ) : liquidiumError ? (
        <div className="errorText">{liquidiumError}</div>
      ) : !loans.length ? (
        <div>No Liquidium loans found</div>
      ) : (
        loans.map((loan) => (
          <div
            key={loan.id}
            className={`${styles.liquidiumItem} ${styles.grid6col}`}
          >
            <div>
              <FormattedLiquidiumCollateral
                runeId={loan.collateral_details.rune_id}
                runeAmount={loan.collateral_details.rune_amount}
                runeDivisibility={loan.collateral_details.rune_divisibility}
              />
            </div>
            <div className={styles.btcValueContainer}>
              <div className={styles.btcAmount}>
                {formatSatsToBtc(loan.loan_details.principal_amount_sats)}
              </div>
              <div className={styles.btcLabel}>BTC</div>
            </div>
            <div className={styles.statusContainer}>
              <span
                className={`${styles.loanStatus} ${loan.loan_details.state === 'ACTIVE' ? styles.statusActive : ''}`}
              >
                {loan.loan_details.state}
              </span>
            </div>
            <div>
              {new Date(
                loan.loan_details.loan_term_end_date,
              ).toLocaleDateString()}
            </div>
            <div className={styles.btcValueContainer}>
              <div className={styles.btcAmount}>
                {formatSatsToBtc(
                  loan.loan_details.total_repayment_sats ??
                    new Big(loan.loan_details.principal_amount_sats)
                      .times(
                        new Big(1).plus(
                          loan.loan_details.discount?.discount_rate ?? 0,
                        ),
                      )
                      .round(0, Big.roundUp) // round up to the nearest satoshi to avoid undercharging
                      .toNumber(),
                )}
              </div>
              <div className={styles.btcLabel}>BTC</div>
            </div>
            <div>
              {loan.loan_details.state === 'ACTIVE' && (
                <Button
                  onClick={() => onRepay(loan)}
                  disabled={true}
                  className={styles.repayButtonDisabled}
                  title="Coming soon..."
                >
                  {isRepayingLoanId === loan.id ? 'Repaying...' : 'Repay'}
                </Button>
              )}
              {loan.loan_details.state === 'ACTIVATING' && (
                <Button disabled>Activating...</Button>
              )}
              {loan.loan_details.state === 'REPAYING' && (
                <Button disabled>Processing...</Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default LiquidiumLoansSection;
