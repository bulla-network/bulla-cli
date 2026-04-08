import { Effect, Layer } from 'effect';
import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import { InvoiceReaderService } from '../../application/ports/invoice-reader-port.js';
import { RegistryService } from '../../application/ports/registry-port.js';
import { InvoiceNotFoundError } from '../../domain/errors.js';
import type { ChainId, EthAddress, Hex } from '../../domain/types/eth.js';
import type { InvoiceOnChain } from '../../domain/types/invoice.js';
import { bullaInvoiceAbi } from '../abi/bulla-invoice.js';

const chainMap: Record<ChainId, chains.Chain> = {
    1: chains.mainnet,
    10: chains.optimism,
    56: chains.bsc,
    100: chains.gnosis,
    137: chains.polygon,
    151: chains.redbellyMainnet,
    8453: chains.base,
    42161: chains.arbitrum,
    42220: chains.celo,
    43114: chains.avalanche,
    11155111: chains.sepolia,
};

export const makeInvoiceReaderLayer = (rpcUrl: string) =>
    Layer.effect(
        InvoiceReaderService,
        Effect.gen(function* () {
            const registry = yield* RegistryService;

            return {
                getInvoice: (chainId: ChainId, claimId: bigint) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getInvoiceAddress(chainId);
                        const chain = chainMap[chainId];

                        const client = createPublicClient({
                            chain,
                            transport: http(rpcUrl),
                        });

                        const result = yield* Effect.tryPromise({
                            try: () =>
                                client.readContract({
                                    address: contractAddress as Hex,
                                    abi: bullaInvoiceAbi,
                                    functionName: 'getInvoice',
                                    args: [claimId],
                                }),
                            catch: err =>
                                new InvoiceNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Failed to read invoice ${claimId} on chain ${chainId}: ${err}`,
                                }),
                        });

                        return {
                            claimAmount: result.claimAmount,
                            paidAmount: result.paidAmount,
                            dueBy: result.dueBy,
                            creditor: result.creditor.toLowerCase() as EthAddress,
                            debtor: result.debtor.toLowerCase() as EthAddress,
                            token: result.token.toLowerCase() as EthAddress,
                            status: result.status,
                            binding: result.binding,
                            purchaseOrder: {
                                deliveryDate: result.purchaseOrder.deliveryDate,
                                depositAmount: result.purchaseOrder.depositAmount,
                                isDelivered: result.purchaseOrder.isDelivered,
                            },
                            lateFeeConfig: {
                                interestRateBps: result.lateFeeConfig.interestRateBps,
                                numberOfPeriodsPerYear: result.lateFeeConfig.numberOfPeriodsPerYear,
                            },
                        } satisfies InvoiceOnChain;
                    }),

                getTotalAmountNeededForPurchaseOrderDeposit: (chainId: ChainId, claimId: bigint) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getInvoiceAddress(chainId);
                        const chain = chainMap[chainId];

                        const client = createPublicClient({
                            chain,
                            transport: http(rpcUrl),
                        });

                        const { result } = yield* Effect.tryPromise({
                            try: () =>
                                client.simulateContract({
                                    address: contractAddress as Hex,
                                    abi: bullaInvoiceAbi,
                                    functionName: 'getTotalAmountNeededForPurchaseOrderDeposit',
                                    args: [claimId],
                                }),
                            catch: err =>
                                new InvoiceNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Failed to simulate getTotalAmountNeededForPurchaseOrderDeposit for claim ${claimId} on chain ${chainId}: ${err}`,
                                }),
                        });

                        return result;
                    }),

                getTotalAmountDue: (chainId: ChainId, claimId: bigint) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getInvoiceAddress(chainId);
                        const chain = chainMap[chainId];

                        const client = createPublicClient({
                            chain,
                            transport: http(rpcUrl),
                        });

                        const result = yield* Effect.tryPromise({
                            try: () =>
                                client.readContract({
                                    address: contractAddress as Hex,
                                    abi: bullaInvoiceAbi,
                                    functionName: 'getTotalAmountDue',
                                    args: [claimId],
                                }),
                            catch: err =>
                                new InvoiceNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Failed to read total amount due for claim ${claimId} on chain ${chainId}: ${err}`,
                                }),
                        });

                        return { remainingPrincipal: result[0], grossInterest: result[1] };
                    }),

                getInvoices: (chainId: ChainId, claimIds: bigint[]) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getInvoiceAddress(chainId);
                        const chain = chainMap[chainId];
                        const client = createPublicClient({ chain, transport: http(rpcUrl) });

                        const results = yield* Effect.tryPromise({
                            try: () =>
                                client.multicall({
                                    contracts: claimIds.map(claimId => ({
                                        address: contractAddress as Hex,
                                        abi: bullaInvoiceAbi,
                                        functionName: 'getInvoice' as const,
                                        args: [claimId] as const,
                                    })),
                                    allowFailure: false,
                                }),
                            catch: err =>
                                new InvoiceNotFoundError({
                                    chainId,
                                    claimId: claimIds[0]!,
                                    message: `Failed to batch-read invoices on chain ${chainId}: ${err}`,
                                }),
                        });

                        return results.map(r => ({
                            claimAmount: r.claimAmount,
                            paidAmount: r.paidAmount,
                            dueBy: r.dueBy,
                            creditor: r.creditor.toLowerCase() as EthAddress,
                            debtor: r.debtor.toLowerCase() as EthAddress,
                            token: r.token.toLowerCase() as EthAddress,
                            status: r.status,
                            binding: r.binding,
                            purchaseOrder: {
                                deliveryDate: r.purchaseOrder.deliveryDate,
                                depositAmount: r.purchaseOrder.depositAmount,
                                isDelivered: r.purchaseOrder.isDelivered,
                            },
                            lateFeeConfig: {
                                interestRateBps: r.lateFeeConfig.interestRateBps,
                                numberOfPeriodsPerYear: r.lateFeeConfig.numberOfPeriodsPerYear,
                            },
                        }) satisfies InvoiceOnChain);
                    }),

                getDepositAmountsNeeded: (chainId: ChainId, claimIds: bigint[]) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getInvoiceAddress(chainId);
                        const chain = chainMap[chainId];
                        const client = createPublicClient({ chain, transport: http(rpcUrl) });

                        const results = yield* Effect.tryPromise({
                            try: () =>
                                client.multicall({
                                    contracts: claimIds.map(claimId => ({
                                        address: contractAddress as Hex,
                                        abi: bullaInvoiceAbi,
                                        functionName: 'getTotalAmountNeededForPurchaseOrderDeposit' as const,
                                        args: [claimId] as const,
                                    })),
                                    allowFailure: false,
                                }),
                            catch: err =>
                                new InvoiceNotFoundError({
                                    chainId,
                                    claimId: claimIds[0]!,
                                    message: `Failed to batch-read deposit amounts on chain ${chainId}: ${err}`,
                                }),
                        });

                        return results as bigint[];
                    }),

                getTotalAmountsDue: (chainId: ChainId, claimIds: bigint[]) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getInvoiceAddress(chainId);
                        const chain = chainMap[chainId];
                        const client = createPublicClient({ chain, transport: http(rpcUrl) });

                        const results = yield* Effect.tryPromise({
                            try: () =>
                                client.multicall({
                                    contracts: claimIds.map(claimId => ({
                                        address: contractAddress as Hex,
                                        abi: bullaInvoiceAbi,
                                        functionName: 'getTotalAmountDue' as const,
                                        args: [claimId] as const,
                                    })),
                                    allowFailure: false,
                                }),
                            catch: err =>
                                new InvoiceNotFoundError({
                                    chainId,
                                    claimId: claimIds[0]!,
                                    message: `Failed to batch-read total amounts due on chain ${chainId}: ${err}`,
                                }),
                        });

                        return results.map(r => ({
                            remainingPrincipal: r[0],
                            grossInterest: r[1],
                        }));
                    }),
            };
        }),
    );
