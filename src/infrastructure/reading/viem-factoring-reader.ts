import { Effect, Layer } from 'effect';
import { createPublicClient, http } from 'viem';
import { FactoringReaderService } from '../../application/ports/factoring-reader-port.js';
import type { EthAddress } from '../../domain/types/eth.js';
import { bullaFactoringV2_1Abi } from '../abi/bulla-factoring-v2-1.js';
import { redemptionQueueAbi } from '../abi/redemption-queue.js';

export const makeFactoringReaderLayer = (rpcUrl: string) =>
    Layer.succeed(FactoringReaderService, {
        getRedemptionQueueAddress: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as `0x${string}`,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'getRedemptionQueue',
                    });
                },
                catch: err => new Error(`Failed to read redemption queue address from pool ${poolAddress}: ${err}`),
            }).pipe(Effect.map(addr => addr.toLowerCase() as EthAddress)),

        getQueuedRedemptionsForOwner: (queueAddress: EthAddress, owner: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: queueAddress as `0x${string}`,
                        abi: redemptionQueueAbi,
                        functionName: 'getQueuedRedemptionsForOwner',
                        args: [owner as `0x${string}`],
                    });
                },
                catch: err => new Error(`Failed to read queued redemptions for ${owner} from queue ${queueAddress}: ${err}`),
            }),
    });
