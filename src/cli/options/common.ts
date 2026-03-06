import { Options } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
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
 * If --chain is provided, use it directly.
 * If --rpc-url is provided without --chain, derive chain ID via eth_chainId.
 * If neither is provided, log an error and return undefined.
 */
export const getChainId = (
    chain: Option.Option<number>,
    rpcUrl: Option.Option<string> | string | undefined,
): Effect.Effect<ChainId | undefined> =>
    Effect.gen(function* () {
        const chainValue = Option.getOrUndefined(chain);
        const rpcValue = typeof rpcUrl === 'string' ? rpcUrl : Option.isSome(rpcUrl as Option.Option<string>) ? Option.getOrUndefined(rpcUrl as Option.Option<string>) : undefined;

        if (chainValue !== undefined) {
            if (!isChainId(chainValue)) {
                yield* Console.error(`Unsupported chain ID: ${chainValue}`);
                return undefined;
            }
            return chainValue;
        }

        if (rpcValue) {
            const result = yield* Effect.either(resolveChainId(rpcValue));
            if (result._tag === 'Left') {
                yield* Console.error(result.left.message);
                return undefined;
            }
            return result.right;
        }

        yield* Console.error('Either --chain or --rpc-url must be provided');
        return undefined;
    });
