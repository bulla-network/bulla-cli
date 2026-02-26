import { Options } from '@effect/cli';
import { CHAIN_NAMES, SUPPORTED_CHAIN_IDS } from '../../domain/types/eth.js';

const chainListStr = SUPPORTED_CHAIN_IDS.map(id => `${id} (${CHAIN_NAMES[id]})`).join(', ');

export const chainOption = Options.integer('chain').pipe(
    Options.withAlias('c'),
    Options.withDescription(`Chain ID. Supported: ${chainListStr}`),
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
