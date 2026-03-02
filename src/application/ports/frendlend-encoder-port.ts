import { Context, Effect } from 'effect';
import type { Hex } from '../../domain/types/eth.js';
import type { ClaimMetadata } from '../../domain/types/invoice.js';
import type {
    AcceptLoanParams,
    LoanOperationParams,
    OfferLoanParams,
    PayLoanParams,
    RejectLoanOfferParams,
    SetLoanCallbackParams,
} from '../../domain/types/frendlend.js';

/**
 * Port for encoding FrendLend-related transactions.
 * Implementations can use viem, ethers, or any other encoding library.
 */
export interface FrendLendEncoderService {
    encodeOfferLoan(params: Omit<OfferLoanParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeOfferLoanWithMetadata(
        params: Omit<OfferLoanParams, 'chainId'>,
        metadata: ClaimMetadata,
    ): Effect.Effect<Hex, never, never>;
    encodeRejectLoanOffer(params: Omit<RejectLoanOfferParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeAcceptLoan(params: Omit<AcceptLoanParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodePayLoan(params: Omit<PayLoanParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeImpairLoan(params: Omit<LoanOperationParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeMarkLoanAsPaid(params: Omit<LoanOperationParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeSetPaidLoanCallback(params: Omit<SetLoanCallbackParams, 'chainId'>): Effect.Effect<Hex, never, never>;
}

export const FrendLendEncoderService = Context.GenericTag<FrendLendEncoderService>('@services/FrendLendEncoderService');
