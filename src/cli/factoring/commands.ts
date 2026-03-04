import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import {
    buildApproveInvoice,
    buildCancelQueuedRedemption,
    buildDeposit,
    buildFundInvoice,
    buildOfferLoan,
    buildRedeem,
    buildUnfactorInvoice,
    buildWithdraw,
} from '../../application/services/factoring-service.js';
import { sendTransaction } from '../../application/services/transaction-utils.js';
import type { Hex } from '../../domain/types/eth.js';
import { makeSignerLayer } from '../../infrastructure/layers.js';
import { makeFactoringReaderLayer } from '../../infrastructure/reading/viem-factoring-reader.js';
import { formatResult, formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, requiredRpcUrlOption, rpcUrlOption } from '../options/common.js';
import {
    assetsOption,
    factorerUpfrontBpsOption,
    factoringInvoiceIdOption,
    factoringReceiverOption,
    invoiceValueOverrideOption,
    periodsPerYearOption,
    poolAddressOption,
    poolTermLengthOption,
    principalAmountOption,
    shareOwnerOption,
    sharesOption,
    spreadBpsOption,
    targetYieldBpsOption,
    upfrontBpsOption,
} from '../options/factoring-options.js';
import { debtorOption, descriptionOption } from '../options/invoice-options.js';
import { privateKeyOption } from '../options/pay-options.js';
import {
    validateApproveInvoiceParams,
    validateCancelQueuedRedemptionParams,
    validateDepositParams,
    validateFundInvoiceParams,
    validateOfferLoanParams,
    validateRedeemParams,
    validateUnfactorInvoiceParams,
    validateWithdrawParams,
} from './validation.js';

// ============================================================================
// DEPOSIT
// ============================================================================

const depositBuildCommand = Command.make(
    'build',
    { chain: chainOption, poolAddress: poolAddressOption, assets: assetsOption, receiver: factoringReceiverOption, format: formatOption },
    ({ chain, poolAddress, assets, receiver, format }) =>
        Effect.gen(function* () {
            const params = yield* validateDepositParams(chain, poolAddress, assets, receiver);
            const tx = yield* buildDeposit(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned deposit transaction'));

const depositExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        assets: assetsOption,
        receiver: factoringReceiverOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, assets, receiver, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateDepositParams(chain, poolAddress, assets, receiver);
            const tx = yield* buildDeposit(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a deposit transaction'));

const depositCommand = Command.make('deposit', {}).pipe(
    Command.withDescription('Deposit assets into a factoring pool'),
    Command.withSubcommands([depositBuildCommand, depositExecuteCommand]),
);

// ============================================================================
// REDEEM
// ============================================================================

const redeemBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        shares: sharesOption,
        receiver: factoringReceiverOption,
        owner: shareOwnerOption,
        format: formatOption,
    },
    ({ chain, poolAddress, shares, receiver, owner, format }) =>
        Effect.gen(function* () {
            const params = yield* validateRedeemParams(chain, poolAddress, shares, receiver, owner);
            const tx = yield* buildRedeem(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned redeem transaction'));

const redeemExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        shares: sharesOption,
        receiver: factoringReceiverOption,
        owner: shareOwnerOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, shares, receiver, owner, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateRedeemParams(chain, poolAddress, shares, receiver, owner);
            const tx = yield* buildRedeem(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a redeem transaction'));

const redeemCommand = Command.make('redeem', {}).pipe(
    Command.withDescription('Redeem pool shares for assets'),
    Command.withSubcommands([redeemBuildCommand, redeemExecuteCommand]),
);

// ============================================================================
// WITHDRAW
// ============================================================================

const withdrawBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        assets: assetsOption,
        receiver: factoringReceiverOption,
        owner: shareOwnerOption,
        format: formatOption,
    },
    ({ chain, poolAddress, assets, receiver, owner, format }) =>
        Effect.gen(function* () {
            const params = yield* validateWithdrawParams(chain, poolAddress, assets, receiver, owner);
            const tx = yield* buildWithdraw(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned withdraw transaction'));

const withdrawExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        assets: assetsOption,
        receiver: factoringReceiverOption,
        owner: shareOwnerOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, assets, receiver, owner, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateWithdrawParams(chain, poolAddress, assets, receiver, owner);
            const tx = yield* buildWithdraw(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a withdraw transaction'));

const withdrawCommand = Command.make('withdraw', {}).pipe(
    Command.withDescription('Withdraw assets from a factoring pool'),
    Command.withSubcommands([withdrawBuildCommand, withdrawExecuteCommand]),
);

// ============================================================================
// APPROVE INVOICE
// ============================================================================

const approveInvoiceBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        targetYieldBps: targetYieldBpsOption,
        spreadBps: spreadBpsOption,
        upfrontBps: upfrontBpsOption,
        invoiceValueOverride: invoiceValueOverrideOption,
        format: formatOption,
    },
    ({ chain, poolAddress, invoiceId, targetYieldBps, spreadBps, upfrontBps, invoiceValueOverride, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveInvoiceParams(
                chain,
                poolAddress,
                invoiceId,
                targetYieldBps,
                spreadBps,
                upfrontBps,
                invoiceValueOverride,
            );
            const tx = yield* buildApproveInvoice(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned approveInvoice transaction'));

const approveInvoiceExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        targetYieldBps: targetYieldBpsOption,
        spreadBps: spreadBpsOption,
        upfrontBps: upfrontBpsOption,
        invoiceValueOverride: invoiceValueOverrideOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, invoiceId, targetYieldBps, spreadBps, upfrontBps, invoiceValueOverride, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveInvoiceParams(
                chain,
                poolAddress,
                invoiceId,
                targetYieldBps,
                spreadBps,
                upfrontBps,
                invoiceValueOverride,
            );
            const tx = yield* buildApproveInvoice(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an approveInvoice transaction'));

const approveInvoiceCommand = Command.make('approve-invoice', {}).pipe(
    Command.withDescription('Approve an invoice for factoring (underwriter)'),
    Command.withSubcommands([approveInvoiceBuildCommand, approveInvoiceExecuteCommand]),
);

// ============================================================================
// FUND INVOICE
// ============================================================================

const fundInvoiceBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        upfrontBps: factorerUpfrontBpsOption,
        receiver: factoringReceiverOption,
        format: formatOption,
    },
    ({ chain, poolAddress, invoiceId, upfrontBps, receiver, format }) =>
        Effect.gen(function* () {
            const params = yield* validateFundInvoiceParams(chain, poolAddress, invoiceId, upfrontBps, receiver);
            const tx = yield* buildFundInvoice(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned fundInvoice transaction'));

const fundInvoiceExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        upfrontBps: factorerUpfrontBpsOption,
        receiver: factoringReceiverOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, invoiceId, upfrontBps, receiver, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateFundInvoiceParams(chain, poolAddress, invoiceId, upfrontBps, receiver);
            const tx = yield* buildFundInvoice(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a fundInvoice transaction'));

const fundInvoiceCommand = Command.make('fund-invoice', {}).pipe(
    Command.withDescription('Fund an approved invoice from the pool'),
    Command.withSubcommands([fundInvoiceBuildCommand, fundInvoiceExecuteCommand]),
);

// ============================================================================
// UNFACTOR INVOICE
// ============================================================================

const unfactorInvoiceBuildCommand = Command.make(
    'build',
    { chain: chainOption, poolAddress: poolAddressOption, invoiceId: factoringInvoiceIdOption, format: formatOption },
    ({ chain, poolAddress, invoiceId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateUnfactorInvoiceParams(chain, poolAddress, invoiceId);
            const tx = yield* buildUnfactorInvoice(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned unfactorInvoice transaction'));

const unfactorInvoiceExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, invoiceId, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateUnfactorInvoiceParams(chain, poolAddress, invoiceId);
            const tx = yield* buildUnfactorInvoice(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an unfactorInvoice transaction'));

const unfactorInvoiceCommand = Command.make('unfactor-invoice', {}).pipe(
    Command.withDescription('Reverse a factored invoice'),
    Command.withSubcommands([unfactorInvoiceBuildCommand, unfactorInvoiceExecuteCommand]),
);

// ============================================================================
// OFFER LOAN
// ============================================================================

const offerLoanBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        debtor: debtorOption,
        targetYieldBps: targetYieldBpsOption,
        spreadBps: spreadBpsOption,
        principalAmount: principalAmountOption,
        termLength: poolTermLengthOption,
        periodsPerYear: periodsPerYearOption,
        description: descriptionOption,
        format: formatOption,
    },
    ({ chain, poolAddress, debtor, targetYieldBps, spreadBps, principalAmount, termLength, periodsPerYear, description, format }) =>
        Effect.gen(function* () {
            const params = yield* validateOfferLoanParams(
                chain,
                poolAddress,
                debtor,
                targetYieldBps,
                spreadBps,
                principalAmount,
                termLength,
                periodsPerYear,
                description,
            );
            const tx = yield* buildOfferLoan(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned offerLoan transaction'));

const offerLoanExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        debtor: debtorOption,
        targetYieldBps: targetYieldBpsOption,
        spreadBps: spreadBpsOption,
        principalAmount: principalAmountOption,
        termLength: poolTermLengthOption,
        periodsPerYear: periodsPerYearOption,
        description: descriptionOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({
        chain,
        poolAddress,
        debtor,
        targetYieldBps,
        spreadBps,
        principalAmount,
        termLength,
        periodsPerYear,
        description,
        privateKey,
        rpcUrl,
        format,
    }) =>
        Effect.gen(function* () {
            const params = yield* validateOfferLoanParams(
                chain,
                poolAddress,
                debtor,
                targetYieldBps,
                spreadBps,
                principalAmount,
                termLength,
                periodsPerYear,
                description,
            );
            const tx = yield* buildOfferLoan(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an offerLoan transaction'));

const offerLoanCommand = Command.make('offer-loan', {}).pipe(
    Command.withDescription('Offer a loan from the factoring pool'),
    Command.withSubcommands([offerLoanBuildCommand, offerLoanExecuteCommand]),
);

// ============================================================================
// CANCEL QUEUED REDEMPTION
// ============================================================================

const cancelRedemptionBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        owner: shareOwnerOption,
        rpcUrl: requiredRpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, owner, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateCancelQueuedRedemptionParams(chain, poolAddress, owner);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const tx = yield* buildCancelQueuedRedemption(params).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned cancelQueuedRedemption transaction (requires --rpc-url)'));

const cancelRedemptionExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        poolAddress: poolAddressOption,
        owner: shareOwnerOption,
        privateKey: privateKeyOption,
        rpcUrl: requiredRpcUrlOption,
        format: formatOption,
    },
    ({ chain, poolAddress, owner, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateCancelQueuedRedemptionParams(chain, poolAddress, owner);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const tx = yield* buildCancelQueuedRedemption(params).pipe(Effect.provide(readerLayer));
            const signerLayer = makeSignerLayer(privateKey as Hex, rpcUrl);
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a cancelQueuedRedemption transaction (requires --rpc-url)'));

const cancelRedemptionCommand = Command.make('cancel-redemption', {}).pipe(
    Command.withDescription('Cancel a queued redemption for an owner'),
    Command.withSubcommands([cancelRedemptionBuildCommand, cancelRedemptionExecuteCommand]),
);

// ============================================================================
// EXPORT ALL FACTORING COMMANDS
// ============================================================================

export const factoringCommands = [
    depositCommand,
    redeemCommand,
    withdrawCommand,
    approveInvoiceCommand,
    fundInvoiceCommand,
    unfactorInvoiceCommand,
    offerLoanCommand,
    cancelRedemptionCommand,
] as const;
