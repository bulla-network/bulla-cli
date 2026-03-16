import { Context, Effect } from 'effect';
import type { Hex } from '../../domain/types/eth.js';
import type { ApproveCreateClaimParams, ApproveErc20Params, ApproveNftParams } from '../../domain/types/approve.js';

export interface ApproveEncoderService {
    encodeApproveCreateClaim(params: Omit<ApproveCreateClaimParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeApproveNft(params: Omit<ApproveNftParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeApproveErc20(params: Omit<ApproveErc20Params, 'chainId' | 'token'>): Effect.Effect<Hex, never, never>;
}

export const ApproveEncoderService = Context.GenericTag<ApproveEncoderService>('@services/ApproveEncoderService');
