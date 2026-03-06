import { Context, Effect } from 'effect';
import type { EthAddress } from '../../domain/types/eth.js';
import type { FundInfo, KickbackInfo, PoolStatus, QueuedRedemption, QueueStats, TargetFeeBreakdown, UnfactorPreview } from '../../domain/types/factoring.js';

/**
 * Port for reading on-chain factoring pool data.
 * Used by cancelQueuedRedemption to resolve the queue address and owner's queue index.
 */
export interface FactoringReaderService {
    readonly getRedemptionQueueAddress: (poolAddress: EthAddress) => Effect.Effect<EthAddress, Error>;
    readonly getQueuedRedemptionForOwner: (queueAddress: EthAddress, owner: EthAddress) => Effect.Effect<bigint, Error>;
    readonly getFundInfo: (poolAddress: EthAddress) => Effect.Effect<FundInfo, Error>;
    readonly viewPoolStatus: (poolAddress: EthAddress, offset: bigint, limit: bigint) => Effect.Effect<PoolStatus, Error>;
    readonly previewDeposit: (poolAddress: EthAddress, assets: bigint) => Effect.Effect<bigint, Error>;
    readonly previewRedeem: (poolAddress: EthAddress, shares: bigint) => Effect.Effect<bigint, Error>;
    readonly previewUnfactor: (poolAddress: EthAddress, invoiceId: bigint) => Effect.Effect<UnfactorPreview, Error>;
    readonly calculateKickbackAmount: (poolAddress: EthAddress, invoiceId: bigint) => Effect.Effect<KickbackInfo, Error>;
    readonly calculateTargetFees: (poolAddress: EthAddress, invoiceId: bigint, factorerUpfrontBps: number) => Effect.Effect<TargetFeeBreakdown, Error>;
    readonly calculateCapitalAccount: (poolAddress: EthAddress) => Effect.Effect<bigint, Error>;
    readonly calculateAccruedProfits: (poolAddress: EthAddress) => Effect.Effect<bigint, Error>;
    readonly getQueueStats: (poolAddress: EthAddress) => Effect.Effect<QueueStats, Error>;
    readonly getNextRedemption: (poolAddress: EthAddress) => Effect.Effect<QueuedRedemption, Error>;
    readonly isQueueEmpty: (poolAddress: EthAddress) => Effect.Effect<boolean, Error>;
}

export const FactoringReaderService = Context.GenericTag<FactoringReaderService>('@services/FactoringReaderService');
