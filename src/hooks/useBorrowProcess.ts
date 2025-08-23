//
import { convertToRawAmount } from '@/utils/runeFormatting';
import { parseAmount } from '@/utils/formatters';
import { useState } from 'react';
import {
  LiquidiumPrepareBorrowResponse,
  LiquidiumSubmitBorrowResponse,
  prepareLiquidiumBorrow,
  submitLiquidiumBorrow,
} from '@/lib/api';
import type { RuneData } from '@/lib/runesData';

interface UseBorrowProcessParams {
  signPsbt: (
    tx: string,
    finalize?: boolean,
    broadcast?: boolean,
  ) => Promise<
    | {
        signedPsbtHex: string | undefined;
        signedPsbtBase64: string | undefined;
      }
    | undefined
  >;
  address: string;
  paymentAddress: string;
  publicKey: string;
  paymentPublicKey: string;
  collateralRuneInfo: RuneData | null;
}

export function useBorrowProcess({
  signPsbt,
  address,
  paymentAddress,
  publicKey,
  paymentPublicKey,
  collateralRuneInfo,
}: UseBorrowProcessParams) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loanProcessError, setLoanProcessError] = useState<string | null>(null);
  const [loanTxId, setLoanTxId] = useState<string | null>(null);

  const startLoan = async (
    selectedQuoteId: string | null,
    collateralAmount: string,
    feeRate: number,
  ) => {
    const parsed = parseAmount(collateralAmount);
    if (
      !selectedQuoteId ||
      !collateralAmount.trim() ||
      Number.isNaN(parsed) ||
      parsed <= 0
    ) {
      setLoanProcessError('Missing required information (quote or amount).');
      return;
    }

    setIsPreparing(true);
    setLoanProcessError(null);
    setLoanTxId(null);

    try {
      const decimals = collateralRuneInfo?.decimals ?? 0;
      let rawTokenAmount: string;
      try {
        rawTokenAmount = convertToRawAmount(collateralAmount, decimals);
      } catch {
        setLoanProcessError('Invalid collateral amount.');
        setIsPreparing(false);
        return;
      }

      const prepareResult: LiquidiumPrepareBorrowResponse =
        await prepareLiquidiumBorrow({
          instant_offer_id: selectedQuoteId,
          fee_rate: feeRate,
          token_amount: rawTokenAmount,
          borrower_payment_address: paymentAddress,
          borrower_payment_pubkey: paymentPublicKey,
          borrower_ordinal_address: address,
          borrower_ordinal_pubkey: publicKey,
          address,
        });

      if (
        !prepareResult.success ||
        !prepareResult.data?.base64_psbt ||
        !prepareResult.data?.prepare_offer_id
      ) {
        throw new Error(
          typeof prepareResult.error === 'string'
            ? prepareResult.error
            : 'Failed to prepare loan transaction.',
        );
      }

      setIsPreparing(false);
      setIsSigning(true);
      const psbtToSign = prepareResult.data.base64_psbt;
      const signResult = await signPsbt(psbtToSign);
      if (!signResult?.signedPsbtBase64) {
        throw new Error('User canceled the request');
      }
      const signedPsbtBase64 = signResult.signedPsbtBase64;

      setIsSigning(false);
      setIsSubmitting(true);
      const submitResult: LiquidiumSubmitBorrowResponse =
        await submitLiquidiumBorrow({
          signed_psbt_base_64: signedPsbtBase64,
          prepare_offer_id: prepareResult.data.prepare_offer_id,
          address,
        });

      if (!submitResult.success || !submitResult.data?.loan_transaction_id) {
        throw new Error(
          typeof submitResult.error === 'string'
            ? submitResult.error
            : 'Failed to submit loan transaction.',
        );
      }

      setLoanTxId(submitResult.data.loan_transaction_id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start loan.';
      setLoanProcessError(errorMessage);
    } finally {
      setIsPreparing(false);
      setIsSigning(false);
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setLoanTxId(null);
    setLoanProcessError(null);
  };

  return {
    startLoan,
    reset,
    isPreparing,
    isSigning,
    isSubmitting,
    loanProcessError,
    loanTxId,
  };
}
