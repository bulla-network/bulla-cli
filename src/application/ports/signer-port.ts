import { Context, Effect } from 'effect';
import type { SignerRequiredError, TransactionFailedError } from '../../domain/errors.js';
import type { ChainId, EthAddress, Hex } from '../../domain/types/eth.js';

/** The outcome of a mined transaction. */
export interface MinedReceipt {
    readonly status: 'success' | 'reverted';
    readonly blockNumber: bigint;
}

export interface SignerService {
    readonly getAddress: () => Effect.Effect<EthAddress, SignerRequiredError>;
    readonly signAndSend: (
        chainId: ChainId,
        tx: { readonly to: string; readonly value: string; readonly data: Hex },
    ) => Effect.Effect<Hex, SignerRequiredError>;
    /**
     * Wait until the transaction is mined and return its receipt. Fails with TransactionFailedError
     * if no receipt arrives (timeout or RPC error). A reverted transaction is returned, not failed:
     * the caller decides what a revert means.
     */
    readonly waitForReceipt: (chainId: ChainId, txHash: Hex) => Effect.Effect<MinedReceipt, TransactionFailedError>;
}

export const SignerService = Context.GenericTag<SignerService>('SignerService');
