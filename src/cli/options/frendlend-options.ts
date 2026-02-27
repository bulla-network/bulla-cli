import { Options } from '@effect/cli';

export const offerIdOption = Options.integer('offer-id').pipe(Options.withDescription('The ID of the loan offer'));

export const termLengthOption = Options.integer('term-length').pipe(
    Options.withDescription('Loan term length in seconds'),
);

export const loanAmountOption = Options.text('amount').pipe(Options.withDescription('The loan amount (in token wei)'));

export const expiresAtOption = Options.integer('expires-at').pipe(
    Options.withDefault(0),
    Options.withDescription('Offer expiration as Unix timestamp (0 = no expiry)'),
);

export const receiverOption = Options.text('receiver').pipe(
    Options.optional,
    Options.withDescription('Custom receiver address for accepted loan (optional)'),
);

export const callbackContractDefaultOption = Options.text('callback-contract').pipe(
    Options.withDefault('0x0000000000000000000000000000000000000000'),
    Options.withDescription('Address of callback contract on loan acceptance (default: no callback)'),
);

export const callbackSelectorDefaultOption = Options.text('callback-selector').pipe(
    Options.withDefault('0x00000000'),
    Options.withDescription('Function selector (bytes4) for callback (default: no callback)'),
);
