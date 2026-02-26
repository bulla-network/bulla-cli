import { Context, Effect } from 'effect';
import type { EthAddress, Hex, ChainId } from '../../domain/types/eth.js';
import type { SignerRequiredError } from '../../domain/errors.js';

export interface SignerService {
    readonly getAddress: () => Effect.Effect<EthAddress, SignerRequiredError>;
    readonly signAndSend: (
        chainId: ChainId,
        tx: { readonly to: string; readonly value: string; readonly data: Hex },
    ) => Effect.Effect<Hex, SignerRequiredError>;
}

export const SignerService = Context.GenericTag<SignerService>('SignerService');
