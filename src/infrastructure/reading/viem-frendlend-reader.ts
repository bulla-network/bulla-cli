import { Effect, Layer } from 'effect';
import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import { FrendLendReaderService } from '../../application/ports/frendlend-reader-port.js';
import { RegistryService } from '../../application/ports/registry-port.js';
import { LoanNotFoundError } from '../../domain/errors.js';
import type { ChainId, EthAddress } from '../../domain/types/eth.js';
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
                                    address: contractAddress as `0x${string}`,
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
                                    address: contractAddress as `0x${string}`,
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
            };
        }),
    );
