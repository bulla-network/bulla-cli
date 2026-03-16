import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { ApproveEncoderService } from '../../application/ports/approve-encoder-port.js';
import type { Hex } from '../../domain/types/eth.js';
import type { ApproveCreateClaimParams, ApproveErc20Params, ApproveNftParams, TransferNftParams } from '../../domain/types/approve.js';
import { bullaApprovalRegistryAbi } from '../abi/bulla-approval-registry.js';
import { bullaClaimV2Abi } from '../abi/bulla-claim-v2.js';
import { erc20Abi } from '../abi/erc20.js';

const encodeApproveCreateClaim = (params: Omit<ApproveCreateClaimParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaApprovalRegistryAbi,
            functionName: 'approveCreateClaim',
            args: [params.controller, params.approvalType, params.approvalCount, params.isBindingAllowed],
        }),
    );

const encodeApproveNft = (params: Omit<ApproveNftParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaClaimV2Abi,
            functionName: 'approve',
            args: [params.to, params.claimId],
        }),
    );

const encodeApproveErc20 = (params: Omit<ApproveErc20Params, 'chainId' | 'token'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [params.spender, params.amount],
        }),
    );

const encodeTransferNft = (params: Omit<TransferNftParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaClaimV2Abi,
            functionName: 'safeTransferFrom',
            args: [params.from, params.to, params.claimId, '0x'],
        }),
    );

export const ViemApproveEncoderLive = Layer.succeed(ApproveEncoderService, {
    encodeApproveCreateClaim,
    encodeApproveNft,
    encodeApproveErc20,
    encodeTransferNft,
});
