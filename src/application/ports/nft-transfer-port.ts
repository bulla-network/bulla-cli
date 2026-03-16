import { Context, Effect } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ApproveNftParams, TransferNftParams } from '../../domain/types/approve.js';
import type { UnsignedTransaction } from '../../domain/types/transaction.js';

export interface NftTransferService {
    readonly buildApproveNft: (
        params: ApproveNftParams,
    ) => Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError>;
    readonly buildTransferNft: (
        params: TransferNftParams,
    ) => Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError>;
}

export const NftTransferService = Context.GenericTag<NftTransferService>('@services/NftTransferService');
