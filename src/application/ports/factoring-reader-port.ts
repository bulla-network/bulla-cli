import { Context, Effect } from 'effect';
import type { EthAddress } from '../../domain/types/eth.js';

/**
 * Port for reading on-chain factoring pool data.
 * Used by cancelQueuedRedemption to resolve the queue address and owner's queue indexes.
 */
export interface FactoringReaderService {
    readonly getRedemptionQueueAddress: (poolAddress: EthAddress) => Effect.Effect<EthAddress, Error>;
    readonly getQueuedRedemptionsForOwner: (queueAddress: EthAddress, owner: EthAddress) => Effect.Effect<readonly bigint[], Error>;
}

export const FactoringReaderService = Context.GenericTag<FactoringReaderService>('@services/FactoringReaderService');
