import { Options } from '@effect/cli';
import { Effect, Option } from 'effect';
import { ChainMismatchError, MissingChainConfigError, RpcConnectionError, UnsupportedChainError } from '../../domain/errors.js';
import { resolveChainId } from '../../infrastructure/chain-resolver.js';
import { CHAIN_NAMES, isChainId, SUPPORTED_CHAIN_IDS, type ChainId } from '../../domain/types/eth.js';

const chainListStr = SUPPORTED_CHAIN_IDS.map(id => `${id} (${CHAIN_NAMES[id]})`).join(', ');

export const chainOption = Options.integer('chain').pipe(
    Options.optional,
    Options.withAlias('c'),
    Options.withDescription(`Chain ID (auto-detected from --rpc-url if omitted). Supported: ${chainListStr}`),
);

export const formatOption = Options.choice('format', ['json', 'human']).pipe(
    Options.withDefault('human'),
    Options.withAlias('f'),
    Options.withDescription('Output format: json or human-readable'),
);

export const rpcUrlOption = Options.text('rpc-url').pipe(Options.optional, Options.withDescription('Custom RPC URL for the chain'));

export const requiredRpcUrlOption = Options.text('rpc-url').pipe(
    Options.withDescription('RPC URL for the chain (required for on-chain reads)'),
);

/**
 * Resolve chain ID from the provided options.
 * If --chain is provided, use it directly (and verify against --rpc-url if both given).
 * If --rpc-url is provided without --chain, derive chain ID via eth_chainId.
 * Fails with a domain error if neither is provided, chain is unsupported, or they conflict.
 */
export const getChainId = (
    chain: Option.Option<number>,
    rpcUrl: Option.Option<string> | string | undefined,
): Effect.Effect<ChainId, UnsupportedChainError | RpcConnectionError | MissingChainConfigError | ChainMismatchError> =>
    Effect.gen(function* () {
        const chainValue = Option.getOrUndefined(chain);
        const rpcValue = typeof rpcUrl === 'string' ? rpcUrl : rpcUrl != null && Option.isSome(rpcUrl) ? Option.getOrUndefined(rpcUrl) : undefined;

        if (chainValue !== undefined) {
            if (!isChainId(chainValue)) {
                return yield* Effect.fail(
                    new UnsupportedChainError({ chainId: chainValue, message: `Unsupported chain ID: ${chainValue}` }),
                );
            }

            // Verify --chain matches --rpc-url if both are provided
            if (rpcValue) {
                const rpcChainId = yield* resolveChainId(rpcValue);
                if (rpcChainId !== chainValue) {
                    return yield* Effect.fail(
                        new ChainMismatchError({
                            providedChainId: chainValue,
                            rpcChainId,
                            message: `--chain ${chainValue} does not match RPC chain ID ${rpcChainId}`,
                        }),
                    );
                }
            }

            return chainValue;
        }

        if (rpcValue) {
            return yield* resolveChainId(rpcValue);
        }

        return yield* Effect.fail(
            new MissingChainConfigError({ message: 'Either --chain or --rpc-url must be provided' }),
        );
    });
