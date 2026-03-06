import { Effect } from 'effect';
import { createPublicClient, http } from 'viem';
import { RpcConnectionError, UnsupportedChainError } from '../domain/errors.js';
import { isChainId, type ChainId } from '../domain/types/eth.js';

/** Derive chain ID from an RPC URL by calling eth_chainId. */
export const resolveChainId = (rpcUrl: string): Effect.Effect<ChainId, UnsupportedChainError | RpcConnectionError> =>
    Effect.gen(function* () {
        const client = createPublicClient({ transport: http(rpcUrl) });

        const rawChainId = yield* Effect.tryPromise({
            try: () => client.getChainId(),
            catch: (err) => new RpcConnectionError({ rpcUrl, message: `Failed to connect to RPC: ${err}` }),
        });

        if (!isChainId(rawChainId)) {
            return yield* Effect.fail(
                new UnsupportedChainError({ chainId: rawChainId, message: `Unsupported chain ID: ${rawChainId}` }),
            );
        }

        return rawChainId;
    });
