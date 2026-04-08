import { Effect, Layer } from 'effect';
import { createPublicClient, http, zeroAddress } from 'viem';
import * as chains from 'viem/chains';
import { FrendLendReaderService } from '../../application/ports/frendlend-reader-port.js';
import { RegistryService } from '../../application/ports/registry-port.js';
import { LoanNotFoundError } from '../../domain/errors.js';
import type { ChainId, EthAddress, Hex } from '../../domain/types/eth.js';
import type { LoanOfferOnChain, LoanOnChain } from '../../domain/types/frendlend.js';
import { bullaFrendLendV2Abi } from '../abi/bulla-frendlend-v2.js';

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

export const makeFrendLendReaderLayer = (rpcUrl: string) =>
    Layer.effect(
        FrendLendReaderService,
        Effect.gen(function* () {
            const registry = yield* RegistryService;

            return {
                getLoan: (chainId: ChainId, claimId: bigint) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getFrendLendAddress(chainId);
                        const chain = chainMap[chainId];

                        const client = createPublicClient({
                            chain,
                            transport: http(rpcUrl),
                        });

                        const result = yield* Effect.tryPromise({
                            try: () =>
                                client.readContract({
                                    address: contractAddress as Hex,
                                    abi: bullaFrendLendV2Abi,
                                    functionName: 'getLoan',
                                    args: [claimId],
                                }),
                            catch: err =>
                                new LoanNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Failed to read loan ${claimId} on chain ${chainId}: ${err}`,
                                }),
                        });

                        // Contract returns zeroed data for non-existent claims
                        if (result.creditor === zeroAddress && result.debtor === zeroAddress) {
                            return yield* Effect.fail(
                                new LoanNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Loan with claim ID ${claimId} does not exist on chain ${chainId}`,
                                }),
                            );
                        }

                        return {
                            claimAmount: result.claimAmount,
                            paidAmount: result.paidAmount,
                            status: result.status,
                            binding: result.binding,
                            debtor: result.debtor.toLowerCase() as EthAddress,
                            creditor: result.creditor.toLowerCase() as EthAddress,
                            token: result.token.toLowerCase() as EthAddress,
                            controller: result.controller.toLowerCase() as EthAddress,
                            dueBy: result.dueBy,
                            acceptedAt: result.acceptedAt,
                            interestConfig: {
                                interestRateBps: result.interestConfig.interestRateBps,
                                numberOfPeriodsPerYear: result.interestConfig.numberOfPeriodsPerYear,
                            },
                            interestComputationState: {
                                accruedInterest: result.interestComputationState.accruedInterest,
                                latestPeriodNumber: result.interestComputationState.latestPeriodNumber,
                                protocolFeeBps: result.interestComputationState.protocolFeeBps,
                                totalGrossInterestPaid: result.interestComputationState.totalGrossInterestPaid,
                            },
                        } satisfies LoanOnChain;
                    }),
                getLoanOffer: (chainId: ChainId, offerId: bigint) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getFrendLendAddress(chainId);
                        const chain = chainMap[chainId];

                        const client = createPublicClient({
                            chain,
                            transport: http(rpcUrl),
                        });

                        const result = yield* Effect.tryPromise({
                            try: () =>
                                client.readContract({
                                    address: contractAddress as Hex,
                                    abi: bullaFrendLendV2Abi,
                                    functionName: 'getLoanOffer',
                                    args: [offerId],
                                }),
                            catch: err =>
                                new LoanNotFoundError({
                                    chainId,
                                    claimId: offerId,
                                    message: `Failed to read loan offer ${offerId} on chain ${chainId}: ${err}`,
                                }),
                        });

                        return {
                            params: {
                                termLength: result.params.termLength,
                                interestConfig: {
                                    interestRateBps: result.params.interestConfig.interestRateBps,
                                    numberOfPeriodsPerYear: result.params.interestConfig.numberOfPeriodsPerYear,
                                },
                                loanAmount: result.params.loanAmount,
                                creditor: result.params.creditor.toLowerCase() as EthAddress,
                                debtor: result.params.debtor.toLowerCase() as EthAddress,
                                description: result.params.description,
                                token: result.params.token.toLowerCase() as EthAddress,
                                impairmentGracePeriod: result.params.impairmentGracePeriod,
                                expiresAt: result.params.expiresAt,
                                callbackContract: result.params.callbackContract.toLowerCase() as EthAddress,
                                callbackSelector: result.params.callbackSelector,
                            },
                            requestedByCreditor: result.requestedByCreditor,
                        } satisfies LoanOfferOnChain;
                    }),
                getTotalAmountDue: (chainId: ChainId, claimId: bigint) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getFrendLendAddress(chainId);
                        const chain = chainMap[chainId];

                        const client = createPublicClient({
                            chain,
                            transport: http(rpcUrl),
                        });

                        // First verify the loan exists (contract returns zeroed data for non-existent claims)
                        const loan = yield* Effect.tryPromise({
                            try: () =>
                                client.readContract({
                                    address: contractAddress as Hex,
                                    abi: bullaFrendLendV2Abi,
                                    functionName: 'getLoan',
                                    args: [claimId],
                                }),
                            catch: err =>
                                new LoanNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Failed to read loan ${claimId} on chain ${chainId}: ${err}`,
                                }),
                        });

                        if (loan.creditor === zeroAddress && loan.debtor === zeroAddress) {
                            return yield* Effect.fail(
                                new LoanNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Loan with claim ID ${claimId} does not exist on chain ${chainId}`,
                                }),
                            );
                        }

                        const result = yield* Effect.tryPromise({
                            try: () =>
                                client.readContract({
                                    address: contractAddress as Hex,
                                    abi: bullaFrendLendV2Abi,
                                    functionName: 'getTotalAmountDue',
                                    args: [claimId],
                                }),
                            catch: err =>
                                new LoanNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Failed to read total amount due for claim ${claimId} on chain ${chainId}: ${err}`,
                                }),
                        });

                        return { remainingPrincipal: result[0], grossInterest: result[1] };
                    }),

                getLoans: (chainId: ChainId, claimIds: bigint[]) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getFrendLendAddress(chainId);
                        const chain = chainMap[chainId];
                        const client = createPublicClient({ chain, transport: http(rpcUrl) });

                        const results = yield* Effect.tryPromise({
                            try: () =>
                                client.multicall({
                                    contracts: claimIds.map(claimId => ({
                                        address: contractAddress as Hex,
                                        abi: bullaFrendLendV2Abi,
                                        functionName: 'getLoan' as const,
                                        args: [claimId] as const,
                                    })),
                                    allowFailure: false,
                                }),
                            catch: err =>
                                new LoanNotFoundError({
                                    chainId,
                                    claimId: claimIds[0]!,
                                    message: `Failed to batch-read loans on chain ${chainId}: ${err}`,
                                }),
                        });

                        return results.map((r, i) => {
                            if (r.creditor === zeroAddress && r.debtor === zeroAddress) {
                                throw new LoanNotFoundError({
                                    chainId,
                                    claimId: claimIds[i]!,
                                    message: `Loan with claim ID ${claimIds[i]!} does not exist on chain ${chainId}`,
                                });
                            }
                            return {
                                claimAmount: r.claimAmount,
                                paidAmount: r.paidAmount,
                                status: r.status,
                                binding: r.binding,
                                debtor: r.debtor.toLowerCase() as EthAddress,
                                creditor: r.creditor.toLowerCase() as EthAddress,
                                token: r.token.toLowerCase() as EthAddress,
                                controller: r.controller.toLowerCase() as EthAddress,
                                dueBy: r.dueBy,
                                acceptedAt: r.acceptedAt,
                                interestConfig: {
                                    interestRateBps: r.interestConfig.interestRateBps,
                                    numberOfPeriodsPerYear: r.interestConfig.numberOfPeriodsPerYear,
                                },
                                interestComputationState: {
                                    accruedInterest: r.interestComputationState.accruedInterest,
                                    latestPeriodNumber: r.interestComputationState.latestPeriodNumber,
                                    protocolFeeBps: r.interestComputationState.protocolFeeBps,
                                    totalGrossInterestPaid: r.interestComputationState.totalGrossInterestPaid,
                                },
                            } satisfies LoanOnChain;
                        });
                    }),

                getTotalAmountsDue: (chainId: ChainId, claimIds: bigint[]) =>
                    Effect.gen(function* () {
                        const contractAddress = yield* registry.getFrendLendAddress(chainId);
                        const chain = chainMap[chainId];
                        const client = createPublicClient({ chain, transport: http(rpcUrl) });

                        // Batch getLoan (validation) + getTotalAmountDue for each claim in one multicall
                        const contracts = claimIds.flatMap(claimId => [
                            {
                                address: contractAddress as Hex,
                                abi: bullaFrendLendV2Abi,
                                functionName: 'getLoan' as const,
                                args: [claimId] as const,
                            },
                            {
                                address: contractAddress as Hex,
                                abi: bullaFrendLendV2Abi,
                                functionName: 'getTotalAmountDue' as const,
                                args: [claimId] as const,
                            },
                        ]);

                        const results = yield* Effect.tryPromise({
                            try: () => client.multicall({ contracts, allowFailure: false }),
                            catch: err =>
                                new LoanNotFoundError({
                                    chainId,
                                    claimId: claimIds[0]!,
                                    message: `Failed to batch-read total amounts due on chain ${chainId}: ${err}`,
                                }),
                        });

                        // Results interleaved: [loan0, due0, loan1, due1, ...]
                        return claimIds.map((claimId, i) => {
                            const loan = results[i * 2] as { creditor: string; debtor: string };
                            if (loan.creditor === zeroAddress && loan.debtor === zeroAddress) {
                                throw new LoanNotFoundError({
                                    chainId,
                                    claimId,
                                    message: `Loan with claim ID ${claimId} does not exist on chain ${chainId}`,
                                });
                            }
                            const due = results[i * 2 + 1] as readonly [bigint, bigint];
                            return { remainingPrincipal: due[0], grossInterest: due[1] };
                        });
                    }),
            };
        }),
    );
