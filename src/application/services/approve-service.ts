import { Effect } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ApproveCreateClaimParams, ApproveErc20Params, ApproveNftParams } from '../../domain/types/approve.js';
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

export const buildApproveNft = (
    params: ApproveNftParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | ApproveEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* ApproveEncoderService;

        const contractAddress = yield* registry.getClaimAddress(params.chainId);
        const data = yield* encoder.encodeApproveNft(params);

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
