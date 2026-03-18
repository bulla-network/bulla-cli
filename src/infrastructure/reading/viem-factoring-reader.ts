import { Effect, Layer } from 'effect';
import { createPublicClient, http } from 'viem';
import { FactoringReaderService } from '../../application/ports/factoring-reader-port.js';
import type { EthAddress, Hex } from '../../domain/types/eth.js';
import type { FundInfo, KickbackInfo, PoolStatus, QueuedRedemption, QueueStats, TargetFeeBreakdown, UnfactorPreview } from '../../domain/types/factoring.js';
import { bullaFactoringV2_1Abi } from '../abi/bulla-factoring-v2-1.js';
import { redemptionQueueAbi } from '../abi/redemption-queue.js';

export const makeFactoringReaderLayer = (rpcUrl: string) =>
    Layer.succeed(FactoringReaderService, {
        getRedemptionQueueAddress: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'getRedemptionQueue',
                    });
                },
                catch: err => new Error(`Failed to read redemption queue address from pool ${poolAddress}: ${err}`),
            }).pipe(Effect.map(addr => addr.toLowerCase() as EthAddress)),

        getQueuedRedemptionForOwner: (queueAddress: EthAddress, owner: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: queueAddress as Hex,
                        abi: redemptionQueueAbi,
                        functionName: 'getQueuedRedemptionsForOwner',
                        args: [owner as Hex],
                    });
                },
                catch: err => new Error(`Failed to read queued redemption for ${owner} from queue ${queueAddress}: ${err}`),
            }).pipe(
                Effect.flatMap(indexes =>
                    indexes.length === 0
                        ? Effect.fail(new Error(`No queued redemption found for ${owner} on queue ${queueAddress}`))
                        : Effect.succeed(indexes[0]!),
                ),
            ),

        getFundInfo: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'getFundInfo',
                    });
                },
                catch: err => new Error(`Failed to read fund info from pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map((result): FundInfo => ({
                    name: result.name,
                    creationTimestamp: result.creationTimestamp,
                    fundBalance: result.fundBalance,
                    deployedCapital: result.deployedCapital,
                    capitalAccount: result.capitalAccount,
                    price: result.price,
                    tokensAvailableForRedemption: result.tokensAvailableForRedemption,
                    adminFeeBps: result.adminFeeBps,
                    targetYieldBps: result.targetYieldBps,
                })),
            ),

        viewPoolStatus: (poolAddress: EthAddress, offset: bigint, limit: bigint) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'viewPoolStatus',
                        args: [offset, limit],
                    });
                },
                catch: err => new Error(`Failed to read pool status from pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map(([impairedInvoiceIds, hasMore]): PoolStatus => ({
                    impairedInvoiceIds,
                    hasMore,
                })),
            ),

        previewDeposit: (poolAddress: EthAddress, assets: bigint) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'previewDeposit',
                        args: [assets],
                    });
                },
                catch: err => new Error(`Failed to preview deposit on pool ${poolAddress}: ${err}`),
            }),

        previewRedeem: (poolAddress: EthAddress, shares: bigint) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'previewRedeem',
                        args: [shares],
                    });
                },
                catch: err => new Error(`Failed to preview redeem on pool ${poolAddress}: ${err}`),
            }),

        previewUnfactor: (poolAddress: EthAddress, invoiceId: bigint) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'previewUnfactor',
                        args: [invoiceId],
                    });
                },
                catch: err => new Error(`Failed to preview unfactor for invoice ${invoiceId} on pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map((totalRefundOrPaymentAmount): UnfactorPreview => ({
                    totalRefundOrPaymentAmount,
                })),
            ),

        calculateKickbackAmount: (poolAddress: EthAddress, invoiceId: bigint) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'calculateKickbackAmount',
                        args: [invoiceId],
                    });
                },
                catch: err => new Error(`Failed to calculate kickback amount for invoice ${invoiceId} on pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map(([kickbackAmount, trueInterest, trueSpreadAmount, trueAdminFee]): KickbackInfo => ({
                    kickbackAmount,
                    trueInterest,
                    trueSpreadAmount,
                    trueAdminFee,
                })),
            ),

        calculateTargetFees: (poolAddress: EthAddress, invoiceId: bigint, factorerUpfrontBps: number) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'calculateTargetFees',
                        args: [invoiceId, factorerUpfrontBps],
                    });
                },
                catch: err => new Error(`Failed to calculate target fees for invoice ${invoiceId} on pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map(([fundedAmountGross, adminFee, targetInterest, targetSpreadAmount, protocolFee, netFundedAmount]): TargetFeeBreakdown => ({
                    fundedAmountGross,
                    adminFee,
                    targetInterest,
                    targetSpreadAmount,
                    protocolFee,
                    netFundedAmount,
                })),
            ),

        calculateCapitalAccount: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'calculateCapitalAccount',
                    });
                },
                catch: err => new Error(`Failed to calculate capital account for pool ${poolAddress}: ${err}`),
            }),

        calculateAccruedProfits: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'calculateAccruedProfits',
                    });
                },
                catch: err => new Error(`Failed to calculate accrued profits for pool ${poolAddress}: ${err}`),
            }),

        getQueueStats: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'getRedemptionQueue',
                    });
                },
                catch: err => new Error(`Failed to read redemption queue address from pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map(addr => addr.toLowerCase() as EthAddress),
                Effect.flatMap(queueAddress =>
                    Effect.tryPromise({
                        try: () => {
                            const client = createPublicClient({ transport: http(rpcUrl) });
                            return client.readContract({
                                address: queueAddress as Hex,
                                abi: redemptionQueueAbi,
                                functionName: 'getQueueStats',
                            });
                        },
                        catch: err => new Error(`Failed to read queue stats from queue ${queueAddress}: ${err}`),
                    }),
                ),
                Effect.map(([queueLength, totalShares, totalAssets]): QueueStats => ({
                    queueLength,
                    totalShares,
                    totalAssets,
                })),
            ),

        getNextRedemption: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'getRedemptionQueue',
                    });
                },
                catch: err => new Error(`Failed to read redemption queue address from pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map(addr => addr.toLowerCase() as EthAddress),
                Effect.flatMap(queueAddress =>
                    Effect.tryPromise({
                        try: () => {
                            const client = createPublicClient({ transport: http(rpcUrl) });
                            return client.readContract({
                                address: queueAddress as Hex,
                                abi: redemptionQueueAbi,
                                functionName: 'getNextRedemption',
                            });
                        },
                        catch: err => new Error(`Failed to read next redemption from queue ${queueAddress}: ${err}`),
                    }),
                ),
                Effect.map((result): QueuedRedemption => ({
                    owner: result.owner.toLowerCase() as EthAddress,
                    shares: result.shares,
                    assets: result.assets,
                })),
            ),

        isQueueEmpty: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'getRedemptionQueue',
                    });
                },
                catch: err => new Error(`Failed to read redemption queue address from pool ${poolAddress}: ${err}`),
            }).pipe(
                Effect.map(addr => addr.toLowerCase() as EthAddress),
                Effect.flatMap(queueAddress =>
                    Effect.tryPromise({
                        try: () => {
                            const client = createPublicClient({ transport: http(rpcUrl) });
                            return client.readContract({
                                address: queueAddress as Hex,
                                abi: redemptionQueueAbi,
                                functionName: 'isQueueEmpty',
                            });
                        },
                        catch: err => new Error(`Failed to check if queue is empty on queue ${queueAddress}: ${err}`),
                    }),
                ),
            ),

        pricePerShare: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'pricePerShare',
                    });
                },
                catch: err => new Error(`Failed to read price per share from pool ${poolAddress}: ${err}`),
            }),

        balanceOf: (poolAddress: EthAddress, account: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'balanceOf',
                        args: [account as Hex],
                    });
                },
                catch: err => new Error(`Failed to read balance for ${account} from pool ${poolAddress}: ${err}`),
            }),

        totalAssets: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'totalAssets',
                    });
                },
                catch: err => new Error(`Failed to read total assets from pool ${poolAddress}: ${err}`),
            }),

        totalSupply: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'totalSupply',
                    });
                },
                catch: err => new Error(`Failed to read total supply from pool ${poolAddress}: ${err}`),
            }),

        activeInvoiceAt: (poolAddress: EthAddress, index: bigint) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'activeInvoices',
                        args: [index],
                    });
                },
                catch: err => new Error(`Failed to read active invoice at index ${index} from pool ${poolAddress}: ${err}`),
            }),

        maxRedeem: (poolAddress: EthAddress, owner: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'maxRedeem',
                        args: [owner as Hex],
                    });
                },
                catch: err => new Error(`Failed to read max redeem for ${owner} from pool ${poolAddress}: ${err}`),
            }),

        paidInvoicesGain: (poolAddress: EthAddress) =>
            Effect.tryPromise({
                try: () => {
                    const client = createPublicClient({ transport: http(rpcUrl) });
                    return client.readContract({
                        address: poolAddress as Hex,
                        abi: bullaFactoringV2_1Abi,
                        functionName: 'paidInvoicesGain',
                    });
                },
                catch: err => new Error(`Failed to read paid invoices gain from pool ${poolAddress}: ${err}`),
            }),
    });
