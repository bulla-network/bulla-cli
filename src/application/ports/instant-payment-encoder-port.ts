import { Context, Effect } from 'effect';
import type { Hex } from '../../domain/types/eth.js';

export interface InstantPaymentEncoderService {
    /** Encode calldata for the instantPayment function. Pure computation, no I/O. */
    readonly encodeInstantPayment: (params: {
        readonly to: string;
        readonly amount: bigint;
        readonly tokenAddress: string;
        readonly description: string;
        readonly tag: string;
        readonly ipfsHash: string;
    }) => Effect.Effect<Hex>;
}

export const InstantPaymentEncoderService =
    Context.GenericTag<InstantPaymentEncoderService>('InstantPaymentEncoderService');
