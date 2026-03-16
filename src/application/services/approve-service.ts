import { Effect } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ChainId, EthAddress } from '../../domain/types/eth.js';
import type { ApproveCreateClaimParams, ApproveErc20Params, ApproveNftParams, TransferNftParams } from '../../domain/types/approve.js';
import type { UnsignedTransaction } from '../../domain/types/transaction.js';
import { ApproveEncoderService } from '../ports/approve-encoder-port.js';
import { RegistryService } from '../ports/registry-port.js';

export const buildApproveCreateClaim = (
    params: ApproveCreateClaimParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | ApproveEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* ApproveEncoderService;

        const contractAddress = yield* registry.getApprovalRegistryAddress(params.chainId);
        const data = yield* encoder.encodeApproveCreateClaim(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build an ERC721 approve transaction targeting a specific contract.
 * For controlled claims, the target is the controller contract (BullaInvoice, BullaFrendLendV2).
 * For uncontrolled claims, the target is BullaClaimV2 directly.
 */
export const buildApproveNft = (
    params: ApproveNftParams,
    getContractAddress: (chainId: ChainId) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError, RegistryService>,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | ApproveEncoderService> =>
    Effect.gen(function* () {
        const encoder = yield* ApproveEncoderService;

        const contractAddress = yield* getContractAddress(params.chainId);
        const data = yield* encoder.encodeApproveNft(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/** Registry lookup for invoice controller address */
export const getInvoiceControllerAddress = (chainId: ChainId) =>
    RegistryService.pipe(Effect.flatMap(r => r.getInvoiceAddress(chainId)));

/** Registry lookup for frendlend controller address */
export const getFrendLendControllerAddress = (chainId: ChainId) =>
    RegistryService.pipe(Effect.flatMap(r => r.getFrendLendAddress(chainId)));

/** Registry lookup for BullaClaimV2 address (uncontrolled claims) */
export const getClaimContractAddress = (chainId: ChainId) =>
    RegistryService.pipe(Effect.flatMap(r => r.getClaimAddress(chainId)));

/**
 * Build an ERC721 transferFrom transaction targeting a specific contract.
 * For controlled claims, the target is the controller contract.
 * For uncontrolled claims, the target is BullaClaimV2 directly.
 */
export const buildTransferNft = (
    params: TransferNftParams,
    getContractAddress: (chainId: ChainId) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError, RegistryService>,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | ApproveEncoderService> =>
    Effect.gen(function* () {
        const encoder = yield* ApproveEncoderService;

        const contractAddress = yield* getContractAddress(params.chainId);
        const data = yield* encoder.encodeTransferNft(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

export const buildApproveErc20 = (
    params: ApproveErc20Params,
): Effect.Effect<UnsignedTransaction, never, ApproveEncoderService> =>
    Effect.gen(function* () {
        const encoder = yield* ApproveEncoderService;

        const data = yield* encoder.encodeApproveErc20(params);

        return {
            to: params.token,
            value: '0',
            data,
            operation: 0 as const,
        };
    });
