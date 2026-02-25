import { Options } from '@effect/cli';

export const toOption = Options.text('to').pipe(Options.withDescription('Recipient Ethereum address (0x-prefixed)'));

export const amountOption = Options.text('amount').pipe(
    Options.withDescription("Amount in the token's smallest unit (e.g. wei for ETH, 10^6 units for USDC)"),
);

export const tokenOption = Options.text('token').pipe(
    Options.withDefault('0x0000000000000000000000000000000000000000'),
    Options.withAlias('t'),
    Options.withDescription('ERC20 token address. Omit or use 0x0...0 for native currency'),
);

export const descriptionOption = Options.text('description').pipe(
    Options.withAlias('d'),
    Options.withDescription('Human-readable payment description'),
);

export const tagsOption = Options.text('tags').pipe(
    Options.withDefault(''),
    Options.withDescription('Comma-separated tags for categorization'),
);

export const ipfsHashOption = Options.text('ipfs-hash').pipe(
    Options.withDefault(''),
    Options.withDescription('IPFS hash for attached documents'),
);

export const privateKeyOption = Options.text('private-key').pipe(
    Options.withDescription('Private key for signing (hex, 0x-prefixed). Required for execute mode.'),
);
