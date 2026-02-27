import { Effect, Layer } from 'effect';
import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import { InvoiceReaderService } from '../../application/ports/invoice-reader-port.js';
import { RegistryService } from '../../application/ports/registry-port.js';
import { InvoiceNotFoundError } from '../../domain/errors.js';
import type { ChainId, EthAddress } from '../../domain/types/eth.js';
import type { InvoiceOnChain } from '../../domain/types/invoice.js';
import { bullaInvoiceAbi } from '../abi/bulla-invoice.js';

const chainMap: Partial<Record<ChainId, chains.Chain>> = {
    1: chains.mainnet,
    10: chains.optimism,
    56: chains.bsc,
    100: chains.gnosis,
    137: chains.polygon,
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
                                    address: contractAddress as `0x${string}`,
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
            };
        }),
    );
