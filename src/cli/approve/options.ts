import { Options } from '@effect/cli';

export const controllerOption = Options.text('controller').pipe(
    Options.withDescription('Controller contract address (e.g. BullaInvoice or BullaFrendLendV2)'),
);

export const approvalTypeOption = Options.choice('approval-type', ['unapproved', 'creditor-only', 'debtor-only', 'approved']).pipe(
    Options.withDescription('Approval type: unapproved, creditor-only, debtor-only, or approved'),
);

export const approvalCountOption = Options.text('approval-count').pipe(
    Options.withDefault('18446744073709551615'),
    Options.withDescription('Number of claims the controller can create (default: unlimited)'),
);

export const bindingAllowedOption = Options.boolean('binding-allowed').pipe(
    Options.withDefault(false),
    Options.withDescription('Whether the controller can create bound claims (default: false)'),
);

export const approveToOption = Options.text('to').pipe(
    Options.withDescription('Address to approve for the NFT'),
);

export const approveClaimIdOption = Options.text('claim-id').pipe(
    Options.withDescription('Claim/token ID to approve'),
);

export const erc20TokenOption = Options.text('token').pipe(
    Options.withDescription('ERC20 token contract address'),
);

export const spenderOption = Options.text('spender').pipe(
    Options.withDescription('Address to approve as spender'),
);

export const approveAmountOption = Options.text('amount').pipe(
    Options.withDescription("Amount to approve (in the token's smallest unit)"),
);
