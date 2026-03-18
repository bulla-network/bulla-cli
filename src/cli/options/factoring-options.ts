import { Options } from '@effect/cli';

export const accountOption = Options.text('account').pipe(
    Options.withAlias('a'),
    Options.withDescription('Account address (e.g. investor or owner address)'),
);

export const poolAddressOption = Options.text('pool-address').pipe(
    Options.withAlias('p'),
    Options.withDescription('Factoring pool contract address'),
);

export const assetsOption = Options.text('assets').pipe(Options.withDescription('Amount of assets in token wei (e.g. 1000000 for 1 USDC)'));

export const sharesOption = Options.text('shares').pipe(Options.withDescription('Amount of pool shares in wei'));

export const factoringReceiverOption = Options.text('receiver').pipe(Options.withDescription('Receiver address'));

export const shareOwnerOption = Options.text('owner').pipe(Options.withDescription('Share owner address'));

export const factoringInvoiceIdOption = Options.text('invoice-id').pipe(Options.withDescription('Invoice ID (uint256)'));

export const factorerUpfrontBpsOption = Options.integer('upfront-bps').pipe(
    Options.withDescription('Factorer upfront fee in basis points'),
);

export const targetYieldBpsOption = Options.integer('target-yield-bps').pipe(Options.withDescription('Target yield in basis points'));

export const spreadBpsOption = Options.integer('spread-bps').pipe(Options.withDescription('Spread in basis points'));

export const upfrontBpsOption = Options.integer('upfront-bps').pipe(Options.withDescription('Upfront fee in basis points'));

export const invoiceValueOverrideOption = Options.text('invoice-value-override').pipe(
    Options.withDefault('0'),
    Options.withDescription('Initial invoice value override (0 = use actual value)'),
);

export const invoiceIndexOption = Options.text('index').pipe(Options.withDescription('Index into the active invoices array (uint256)'));

export const principalAmountOption = Options.text('principal-amount').pipe(Options.withDescription('Loan principal amount in token wei'));

export const poolTermLengthOption = Options.integer('term-length').pipe(Options.withDescription('Loan term length in seconds'));

export const periodsPerYearOption = Options.integer('periods-per-year').pipe(
    Options.withDescription('Number of interest periods per year'),
);

export const authTokenOption = Options.text('auth-token').pipe(
    Options.withDescription('JWT authentication token from the authenticate command'),
);

export const claimIdsOption = Options.text('claim-ids').pipe(
    Options.withDescription('Comma-separated list of claim IDs to underwrite'),
);

export const requestsFileOption = Options.text('requests-file').pipe(
    Options.withDescription('Path to JSON file containing tap-credit requests array'),
);
