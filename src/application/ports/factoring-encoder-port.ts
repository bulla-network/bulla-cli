import { Context, Effect } from 'effect';
import type { Hex } from '../../domain/types/eth.js';
import type {
    ApproveInvoiceParams,
    DepositParams,
    FundInvoiceParams,
    PoolOfferLoanParams,
    RedeemParams,
    UnfactorInvoiceParams,
    WithdrawParams,
} from '../../domain/types/factoring.js';

/**
 * Port for encoding BullaFactoringV2_1-related transactions.
 * Implementations can use viem, ethers, or any other encoding library.
 */
export interface FactoringEncoderService {
    encodeDeposit(params: Omit<DepositParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never>;
    encodeRedeem(params: Omit<RedeemParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never>;
    encodeWithdraw(params: Omit<WithdrawParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never>;
    encodeApproveInvoice(params: Omit<ApproveInvoiceParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never>;
    encodeFundInvoice(params: Omit<FundInvoiceParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never>;
    encodeUnfactorInvoice(params: Omit<UnfactorInvoiceParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never>;
    encodeOfferLoan(params: Omit<PoolOfferLoanParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never>;
    encodeCancelQueuedRedemption(queueIndex: bigint): Effect.Effect<Hex, never, never>;
}

export const FactoringEncoderService = Context.GenericTag<FactoringEncoderService>('@services/FactoringEncoderService');
