import { Context, Effect } from 'effect';
import type { ContractNotFoundError, InvoiceNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ChainId } from '../../domain/types/eth.js';
import type { InvoiceOnChain } from '../../domain/types/invoice.js';

/**
 * Port for reading invoice data from on-chain.
 * Implementations use a public RPC client to call getInvoice.
 */
export interface InvoiceReaderService {
    getInvoice(
        chainId: ChainId,
        claimId: bigint,
    ): Effect.Effect<InvoiceOnChain, InvoiceNotFoundError | UnsupportedChainError | ContractNotFoundError>;

    getTotalAmountNeededForPurchaseOrderDeposit(
        chainId: ChainId,
        claimId: bigint,
    ): Effect.Effect<bigint, InvoiceNotFoundError | UnsupportedChainError | ContractNotFoundError>;

    getTotalAmountDue(
        chainId: ChainId,
        claimId: bigint,
    ): Effect.Effect<
        { remainingPrincipal: bigint; grossInterest: bigint },
        InvoiceNotFoundError | UnsupportedChainError | ContractNotFoundError
    >;

    getInvoices(
        chainId: ChainId,
        claimIds: bigint[],
    ): Effect.Effect<InvoiceOnChain[], InvoiceNotFoundError | UnsupportedChainError | ContractNotFoundError>;

    getDepositAmountsNeeded(
        chainId: ChainId,
        claimIds: bigint[],
    ): Effect.Effect<bigint[], InvoiceNotFoundError | UnsupportedChainError | ContractNotFoundError>;

    getTotalAmountsDue(
        chainId: ChainId,
        claimIds: bigint[],
    ): Effect.Effect<
        { remainingPrincipal: bigint; grossInterest: bigint }[],
        InvoiceNotFoundError | UnsupportedChainError | ContractNotFoundError
    >;
}

export const InvoiceReaderService = Context.GenericTag<InvoiceReaderService>('@services/InvoiceReaderService');
