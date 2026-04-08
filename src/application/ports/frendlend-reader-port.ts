import { Context, Effect } from 'effect';
import type { ContractNotFoundError, LoanNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ChainId } from '../../domain/types/eth.js';
import type { LoanOfferOnChain, LoanOnChain } from '../../domain/types/frendlend.js';

/**
 * Port for reading FrendLend loan data from on-chain.
 * Implementations use a public RPC client to call getLoan / getLoanOffer.
 */
export interface FrendLendReaderService {
    getLoan(
        chainId: ChainId,
        claimId: bigint,
    ): Effect.Effect<LoanOnChain, LoanNotFoundError | UnsupportedChainError | ContractNotFoundError>;
    getLoanOffer(
        chainId: ChainId,
        offerId: bigint,
    ): Effect.Effect<LoanOfferOnChain, LoanNotFoundError | UnsupportedChainError | ContractNotFoundError>;
    getTotalAmountDue(
        chainId: ChainId,
        claimId: bigint,
    ): Effect.Effect<{ remainingPrincipal: bigint; grossInterest: bigint }, LoanNotFoundError | UnsupportedChainError | ContractNotFoundError>;

    getLoans(
        chainId: ChainId,
        claimIds: bigint[],
    ): Effect.Effect<LoanOnChain[], LoanNotFoundError | UnsupportedChainError | ContractNotFoundError>;

    getTotalAmountsDue(
        chainId: ChainId,
        claimIds: bigint[],
    ): Effect.Effect<
        { remainingPrincipal: bigint; grossInterest: bigint }[],
        LoanNotFoundError | UnsupportedChainError | ContractNotFoundError
    >;
}

export const FrendLendReaderService = Context.GenericTag<FrendLendReaderService>('@services/FrendLendReaderService');
