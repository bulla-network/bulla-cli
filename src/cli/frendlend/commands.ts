import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import { NftTransferService } from '../../application/ports/nft-transfer-port.js';
import { FrendLendNftTransferServiceLive } from '../../application/services/nft-transfer-service.js';
import {
    buildAcceptLoan,
    buildImpairLoan,
    buildMarkLoanAsPaid,
    buildOfferLoan,
    buildPayLoan,
    buildRejectLoanOffer,
    buildSetPaidLoanCallback,
} from '../../application/services/frendlend-service.js';
import { sendTransaction } from '../../application/services/transaction-utils.js';
import type { Hex } from '../../domain/types/eth.js';
import { makeSignerLayer } from '../../infrastructure/layers.js';
import { formatResult, formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import {
    callbackContractDefaultOption,
    callbackSelectorDefaultOption,
    expiresAtOption,
    loanAmountOption,
    offerIdOption,
    receiverOption,
    termLengthOption,
} from '../options/frendlend-options.js';
import {
    callbackContractOption,
    callbackSelectorOption,
    claimIdOption,
    creditorOption,
    debtorOption,
    descriptionOption,
    impairmentGracePeriodOption,
    interestRateBpsOption,
    paymentAmountOption,
    periodsPerYearOption,
} from '../options/invoice-options.js';
import { approveClaimIdOption, approveFromOption, approveToOption } from '../approve/options.js';
import { validateApproveNftParams, validateTransferNftParams } from '../approve/validation.js';
import { privateKeyOption, tokenOption } from '../options/pay-options.js';
import {
    validateAcceptLoanParams,
    validateImpairLoanParams,
    validateMarkLoanAsPaidParams,
    validateOfferLoanParams,
    validatePayLoanParams,
    validateRejectLoanOfferParams,
    validateSetLoanCallbackParams,
} from './validation.js';

// ============================================================================
// OFFER LOAN
// ============================================================================

export const frendlendOfferLoanBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        creditor: creditorOption,
        debtor: debtorOption,
        loanAmount: loanAmountOption,
        token: tokenOption,
        termLength: termLengthOption,
        interestRateBps: interestRateBpsOption,
        periodsPerYear: periodsPerYearOption,
        impairmentGracePeriod: impairmentGracePeriodOption,
        expiresAt: expiresAtOption,
        description: descriptionOption,
        callbackContract: callbackContractDefaultOption,
        callbackSelector: callbackSelectorDefaultOption,
        format: formatOption,
    },
    ({
        chain,
        creditor,
        debtor,
        loanAmount,
        token,
        termLength,
        interestRateBps,
        periodsPerYear,
        impairmentGracePeriod,
        expiresAt,
        description,
        callbackContract,
        callbackSelector,
        format,
    }) =>
        Effect.gen(function* () {
            const params = yield* validateOfferLoanParams(
                chain,
                creditor,
                debtor,
                loanAmount,
                token,
                termLength,
                interestRateBps,
                periodsPerYear,
                impairmentGracePeriod,
                expiresAt,
                description,
                callbackContract,
                callbackSelector,
            );
            const tx = yield* buildOfferLoan(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned offerLoan transaction (no private key required)'));

export const frendlendOfferLoanExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        creditor: creditorOption,
        debtor: debtorOption,
        loanAmount: loanAmountOption,
        token: tokenOption,
        termLength: termLengthOption,
        interestRateBps: interestRateBpsOption,
        periodsPerYear: periodsPerYearOption,
        impairmentGracePeriod: impairmentGracePeriodOption,
        expiresAt: expiresAtOption,
        description: descriptionOption,
        callbackContract: callbackContractDefaultOption,
        callbackSelector: callbackSelectorDefaultOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({
        chain,
        creditor,
        debtor,
        loanAmount,
        token,
        termLength,
        interestRateBps,
        periodsPerYear,
        impairmentGracePeriod,
        expiresAt,
        description,
        callbackContract,
        callbackSelector,
        privateKey,
        rpcUrl,
        format,
    }) =>
        Effect.gen(function* () {
            const params = yield* validateOfferLoanParams(
                chain,
                creditor,
                debtor,
                loanAmount,
                token,
                termLength,
                interestRateBps,
                periodsPerYear,
                impairmentGracePeriod,
                expiresAt,
                description,
                callbackContract,
                callbackSelector,
            );
            const tx = yield* buildOfferLoan(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an offerLoan transaction (requires private key)'));

export const frendlendOfferLoanCommand = Command.make('offer-loan', {}).pipe(
    Command.withDescription('Create a new loan offer'),
    Command.withSubcommands([frendlendOfferLoanBuildCommand, frendlendOfferLoanExecuteCommand]),
);

// ============================================================================
// REJECT LOAN OFFER
// ============================================================================

export const frendlendRejectOfferBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        offerId: offerIdOption,
        format: formatOption,
    },
    ({ chain, offerId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateRejectLoanOfferParams(chain, offerId);
            const tx = yield* buildRejectLoanOffer(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned rejectLoanOffer transaction (no private key required)'));

export const frendlendRejectOfferExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        offerId: offerIdOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, offerId, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateRejectLoanOfferParams(chain, offerId);
            const tx = yield* buildRejectLoanOffer(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a rejectLoanOffer transaction (requires private key)'));

export const frendlendRejectOfferCommand = Command.make('reject-offer', {}).pipe(
    Command.withDescription('Reject or rescind a loan offer'),
    Command.withSubcommands([frendlendRejectOfferBuildCommand, frendlendRejectOfferExecuteCommand]),
);

// ============================================================================
// ACCEPT LOAN
// ============================================================================

export const frendlendAcceptLoanBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        offerId: offerIdOption,
        receiver: receiverOption,
        format: formatOption,
    },
    ({ chain, offerId, receiver, format }) =>
        Effect.gen(function* () {
            const params = yield* validateAcceptLoanParams(chain, offerId, Option.getOrUndefined(receiver));
            const tx = yield* buildAcceptLoan(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned acceptLoan transaction (no private key required)'));

export const frendlendAcceptLoanExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        offerId: offerIdOption,
        receiver: receiverOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, offerId, receiver, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateAcceptLoanParams(chain, offerId, Option.getOrUndefined(receiver));
            const tx = yield* buildAcceptLoan(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an acceptLoan transaction (requires private key)'));

export const frendlendAcceptLoanCommand = Command.make('accept-loan', {}).pipe(
    Command.withDescription('Accept a loan offer'),
    Command.withSubcommands([frendlendAcceptLoanBuildCommand, frendlendAcceptLoanExecuteCommand]),
);

// ============================================================================
// PAY LOAN
// ============================================================================

export const frendlendPayLoanBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        paymentAmount: paymentAmountOption,
        format: formatOption,
    },
    ({ chain, claimId, paymentAmount, format }) =>
        Effect.gen(function* () {
            const params = yield* validatePayLoanParams(chain, claimId, paymentAmount);
            const tx = yield* buildPayLoan(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned payLoan transaction (no private key required)'));

export const frendlendPayLoanExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        paymentAmount: paymentAmountOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, paymentAmount, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validatePayLoanParams(chain, claimId, paymentAmount);
            const tx = yield* buildPayLoan(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a payLoan transaction (requires private key)'));

export const frendlendPayLoanCommand = Command.make('pay-loan', {}).pipe(
    Command.withDescription('Pay a loan'),
    Command.withSubcommands([frendlendPayLoanBuildCommand, frendlendPayLoanExecuteCommand]),
);

// ============================================================================
// IMPAIR LOAN
// ============================================================================

export const frendlendImpairLoanBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateImpairLoanParams(chain, claimId);
            const tx = yield* buildImpairLoan(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned impairLoan transaction (no private key required)'));

export const frendlendImpairLoanExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateImpairLoanParams(chain, claimId);
            const tx = yield* buildImpairLoan(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an impairLoan transaction (requires private key)'));

export const frendlendImpairLoanCommand = Command.make('impair-loan', {}).pipe(
    Command.withDescription('Mark a loan as impaired'),
    Command.withSubcommands([frendlendImpairLoanBuildCommand, frendlendImpairLoanExecuteCommand]),
);

// ============================================================================
// MARK LOAN AS PAID
// ============================================================================

export const frendlendMarkPaidBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateMarkLoanAsPaidParams(chain, claimId);
            const tx = yield* buildMarkLoanAsPaid(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned markLoanAsPaid transaction (no private key required)'));

export const frendlendMarkPaidExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateMarkLoanAsPaidParams(chain, claimId);
            const tx = yield* buildMarkLoanAsPaid(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a markLoanAsPaid transaction (requires private key)'));

export const frendlendMarkPaidCommand = Command.make('mark-paid', {}).pipe(
    Command.withDescription('Mark a loan as paid'),
    Command.withSubcommands([frendlendMarkPaidBuildCommand, frendlendMarkPaidExecuteCommand]),
);

// ============================================================================
// SET PAID LOAN CALLBACK
// ============================================================================

export const frendlendSetCallbackBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        callbackContract: callbackContractOption,
        callbackSelector: callbackSelectorOption,
        format: formatOption,
    },
    ({ chain, claimId, callbackContract, callbackSelector, format }) =>
        Effect.gen(function* () {
            const params = yield* validateSetLoanCallbackParams(chain, claimId, callbackContract, callbackSelector);
            const tx = yield* buildSetPaidLoanCallback(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned setPaidLoanCallback transaction (no private key required)'));

export const frendlendSetCallbackExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        callbackContract: callbackContractOption,
        callbackSelector: callbackSelectorOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, callbackContract, callbackSelector, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateSetLoanCallbackParams(chain, claimId, callbackContract, callbackSelector);
            const tx = yield* buildSetPaidLoanCallback(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a setPaidLoanCallback transaction (requires private key)'));

export const frendlendSetCallbackCommand = Command.make('set-callback', {}).pipe(
    Command.withDescription('Set callback for when a loan is paid'),
    Command.withSubcommands([frendlendSetCallbackBuildCommand, frendlendSetCallbackExecuteCommand]),
);

// ============================================================================
// APPROVE NFT (ERC721 approve on BullaClaimV2)
// ============================================================================

export const frendlendApproveNftBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        to: approveToOption,
        claimId: approveClaimIdOption,
        format: formatOption,
    },
    ({ chain, to, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveNftParams(chain, to, claimId);
            const nftService = yield* NftTransferService;
            const tx = yield* nftService.buildApproveNft(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }).pipe(Effect.provide(FrendLendNftTransferServiceLive)),
).pipe(Command.withDescription('Build an unsigned ERC721 approve transaction for a loan claim NFT'));

export const frendlendApproveNftExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        to: approveToOption,
        claimId: approveClaimIdOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, to, claimId, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveNftParams(chain, to, claimId);
            const nftService = yield* NftTransferService;
            const tx = yield* nftService.buildApproveNft(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }).pipe(Effect.provide(FrendLendNftTransferServiceLive)),
).pipe(Command.withDescription('Sign and send an ERC721 approve transaction for a loan claim NFT'));

export const frendlendApproveNftCommand = Command.make('approve-nft', {}).pipe(
    Command.withDescription('Approve an address for a specific loan claim NFT (via BullaFrendLendV2 controller)'),
    Command.withSubcommands([frendlendApproveNftBuildCommand, frendlendApproveNftExecuteCommand]),
);

// ============================================================================
// TRANSFER NFT (ERC721 transferFrom via BullaFrendLendV2 controller)
// ============================================================================

export const frendlendTransferNftBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        from: approveFromOption,
        to: approveToOption,
        claimId: approveClaimIdOption,
        format: formatOption,
    },
    ({ chain, from, to, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateTransferNftParams(chain, from, to, claimId);
            const nftService = yield* NftTransferService;
            const tx = yield* nftService.buildTransferNft(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }).pipe(Effect.provide(FrendLendNftTransferServiceLive)),
).pipe(Command.withDescription('Build an unsigned safeTransferFrom transaction for a loan claim NFT'));

export const frendlendTransferNftExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        from: approveFromOption,
        to: approveToOption,
        claimId: approveClaimIdOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, from, to, claimId, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateTransferNftParams(chain, from, to, claimId);
            const nftService = yield* NftTransferService;
            const tx = yield* nftService.buildTransferNft(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }).pipe(Effect.provide(FrendLendNftTransferServiceLive)),
).pipe(Command.withDescription('Sign and send a safeTransferFrom transaction for a loan claim NFT'));

export const frendlendTransferNftCommand = Command.make('transfer-nft', {}).pipe(
    Command.withDescription('Transfer a loan claim NFT to another address (via BullaFrendLendV2 controller)'),
    Command.withSubcommands([frendlendTransferNftBuildCommand, frendlendTransferNftExecuteCommand]),
);

// ============================================================================
// EXPORT ALL FRENDLEND COMMANDS
// ============================================================================

export const frendlendCommands = [
    frendlendOfferLoanCommand,
    frendlendRejectOfferCommand,
    frendlendAcceptLoanCommand,
    frendlendPayLoanCommand,
    frendlendImpairLoanCommand,
    frendlendMarkPaidCommand,
    frendlendSetCallbackCommand,
    frendlendApproveNftCommand,
    frendlendTransferNftCommand,
] as const;
