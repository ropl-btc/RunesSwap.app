import React from 'react';

import styles from '@/components/portfolio/PortfolioTab.module.css';
import Button from '@/components/ui/Button';

/**
 * Props for the RepayModal component.
 */
interface RepayModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** The amount to repay. */
  repayAmount: string;
  /** Preview of the PSBT string. */
  psbtPreview: string;
  /** Whether repayment is processing. */
  loading: boolean;
  /** Error message if repayment fails. */
  error: string | null;
  /** Callback to cancel repayment. */
  onCancel: () => void;
  /** Callback to confirm repayment. */
  onConfirm: () => void;
}

/**
 * Modal component for confirming loan repayment.
 * Displays repayment amount and PSBT preview.
 *
 * @param props - Component props.
 */
const RepayModal: React.FC<RepayModalProps> = ({
  open,
  repayAmount,
  psbtPreview,
  loading,
  error,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div
      className={styles.repayModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="repay-modal-title"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={styles.repayModalWindow}>
        <h3 id="repay-modal-title" className="heading">
          Confirm Repayment
        </h3>
        <div>
          Repayment Amount: <b>{repayAmount}</b>
        </div>
        <div
          className="smallText"
          style={{ margin: '8px 0', wordBreak: 'break-all' }}
        >
          PSBT:{' '}
          <code title="Full PSBT (truncated for display)">
            {psbtPreview}...
          </code>
        </div>
        {error && (
          <div className="errorText" style={{ margin: '8px 0' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Sign & Repay'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RepayModal;
