import { Options } from '@effect/cli';

// Common invoice options
export const claimIdOption = Options.integer('claim-id').pipe(Options.withDescription('The ID of the invoice/claim'));

export const debtorOption = Options.text('debtor').pipe(Options.withDescription('The debtor address (who owes the payment)'));

export const creditorOption = Options.text('creditor').pipe(Options.withDescription('The creditor address (who receives the payment)'));

export const claimAmountOption = Options.text('amount').pipe(Options.withDescription('The invoice amount (in token wei)'));

export const dueByOption = Options.integer('due-by').pipe(
    Options.withDefault(0),
    Options.withDescription('Due date as Unix timestamp (0 = no due date)'),
);

export const deliveryDateOption = Options.integer('delivery-date').pipe(
    Options.withDefault(0),
    Options.withDescription('Delivery date for purchase order as Unix timestamp (0 = no purchase order)'),
);

export const descriptionOption = Options.text('description').pipe(Options.withDefault(''), Options.withDescription('Invoice description'));

export const bindingOption = Options.integer('binding').pipe(
    Options.withDefault(0),
    Options.withDescription('Claim binding: 0=Unbound, 1=BindingPending, 2=Bound'),
);

// Interest/late fee options (flattened)
export const interestRateBpsOption = Options.integer('interest-rate-bps').pipe(
    Options.withDefault(0),
    Options.withDescription('Interest rate in basis points (1% = 100 bps, 0 = no interest)'),
);

export const periodsPerYearOption = Options.integer('periods-per-year').pipe(
    Options.withDefault(0),
    Options.withDescription('Number of compounding periods per year (0 = simple interest, 1-365 for compound)'),
);

export const impairmentGracePeriodOption = Options.integer('impairment-grace-period').pipe(
    Options.withDefault(0),
    Options.withDescription('Grace period in seconds after due date before invoice can be marked impaired'),
);

export const depositAmountOption = Options.text('deposit-amount').pipe(
    Options.withDefault('0'),
    Options.withDescription('Deposit amount for purchase order (in token wei, 0 = no deposit)'),
);

// Payment options
export const paymentAmountOption = Options.text('payment-amount').pipe(Options.withDescription('Payment amount (in token wei)'));

// Metadata options
export const tokenURIOption = Options.text('token-uri').pipe(
    Options.withDefault(''),
    Options.withDescription('Token URI for NFT metadata'),
);

export const attachmentURIOption = Options.text('attachment-uri').pipe(
    Options.withDefault(''),
    Options.withDescription('Attachment URI (e.g., IPFS link to invoice PDF)'),
);

// Cancel options
export const noteOption = Options.text('note').pipe(Options.withDefault(''), Options.withDescription('Cancellation note'));

// Callback options
export const callbackContractOption = Options.text('callback-contract').pipe(Options.withDescription('Address of callback contract'));

export const callbackSelectorOption = Options.text('callback-selector').pipe(
    Options.withDescription('Function selector (bytes4) as hex string (e.g., 0x12345678)'),
);
