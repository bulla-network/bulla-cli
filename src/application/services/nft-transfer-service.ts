import { Effect, Layer } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ChainId, EthAddress } from '../../domain/types/eth.js';
import type { ApproveNftParams, TransferNftParams } from '../../domain/types/approve.js';
import type { UnsignedTransaction } from '../../domain/types/transaction.js';
import { ApproveEncoderService } from '../ports/approve-encoder-port.js';
import { NftTransferService } from '../ports/nft-transfer-port.js';
import { RegistryService } from '../ports/registry-port.js';

/**
 * Create an NftTransferService layer that targets a specific controller contract.
 * For invoice claims, pass registry => registry.getInvoiceAddress.
 * For frendlend claims, pass registry => registry.getFrendLendAddress.
 * For uncontrolled claims, pass registry => registry.getClaimAddress.
 */
export const makeNftTransferServiceLayer = (
    getContractAddress: (
        registry: RegistryService,
        chainId: ChainId,
    ) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError>,
) =>
    Layer.effect(
        NftTransferService,
        Effect.gen(function* () {
            const registry = yield* RegistryService;
            const encoder = yield* ApproveEncoderService;

            return {
                buildApproveNft: (
                    params: ApproveNftParams,
                ): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError> =>
                    Effect.gen(function* () {
                        const contractAddress = yield* getContractAddress(registry, params.chainId);
                        const data = yield* encoder.encodeApproveNft(params);
                        return { to: contractAddress, value: '0', data, operation: 0 as const };
                    }),

                buildTransferNft: (
                    params: TransferNftParams,
                ): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError> =>
                    Effect.gen(function* () {
                        const contractAddress = yield* getContractAddress(registry, params.chainId);
                        const data = yield* encoder.encodeTransferNft(params);
                        return { to: contractAddress, value: '0', data, operation: 0 as const };
                    }),
            };
        }),
    );

/** NftTransferService targeting BullaInvoice controller */
export const InvoiceNftTransferServiceLive = makeNftTransferServiceLayer((registry, chainId) =>
    registry.getInvoiceAddress(chainId),
);

/** NftTransferService targeting BullaFrendLendV2 controller */
export const FrendLendNftTransferServiceLive = makeNftTransferServiceLayer((registry, chainId) =>
    registry.getFrendLendAddress(chainId),
);

/** NftTransferService targeting BullaClaimV2 (uncontrolled claims) */
export const ClaimNftTransferServiceLive = makeNftTransferServiceLayer((registry, chainId) =>
    registry.getClaimAddress(chainId),
);
