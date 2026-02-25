import { Brand } from 'effect';

// -- EthAddress: a 0x-prefixed 42-character hex string
export type EthAddress = string & Brand.Brand<'EthAddress'>;

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export const EthAddress = Brand.refined<EthAddress>(
    (s): s is EthAddress => ETH_ADDRESS_RE.test(s),
    s => Brand.error(`Invalid Ethereum address: ${s}`),
);

// -- Hex: a 0x-prefixed hex string (for calldata, tx hashes, etc.)
export type Hex = `0x${string}`;

// -- ChainId: supported chain identifiers
export const SUPPORTED_CHAIN_IDS = [1, 10, 56, 100, 137, 151, 8453, 42161, 42220, 43114, 11155111] as const;
export type ChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export const isChainId = (n: number): n is ChainId => (SUPPORTED_CHAIN_IDS as readonly number[]).includes(n);

// -- Chain name mapping for display
export const CHAIN_NAMES: Record<ChainId, string> = {
    1: 'Ethereum Mainnet',
    10: 'Optimism',
    56: 'BNB Chain',
    100: 'Gnosis Chain',
    137: 'Polygon',
    151: 'RedBelly',
    8453: 'Base',
    42161: 'Arbitrum',
    42220: 'Celo',
    43114: 'Avalanche',
    11155111: 'Sepolia',
};
