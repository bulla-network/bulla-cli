import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import {
    buildAcceptPurchaseOrder,
    buildCancelInvoice,
    buildCreateInvoice,
    buildDeliverPurchaseOrder,
    buildImpairInvoice,
    buildMarkInvoiceAsPaid,
    buildPayInvoice,
    buildSetPaidInvoiceCallback,
    buildUpdateBinding,
    sendAcceptPurchaseOrder,
    sendCancelInvoice,
    sendCreateInvoice,
    sendDeliverPurchaseOrder,
    sendImpairInvoice,
    sendMarkInvoiceAsPaid,
    sendPayInvoice,
    sendSetPaidInvoiceCallback,
    sendUpdateBinding,
} from '../../application/services/invoice-service.js';
import type { Hex } from '../../domain/types/eth.js';
import { makeReaderLayer, makeSignerLayer } from '../../infrastructure/layers.js';
import { formatResult, formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, requiredRpcUrlOption, rpcUrlOption } from '../options/common.js';
import {
    bindingOption,
    callbackContractOption,
    callbackSelectorOption,
    claimAmountOption,
    claimIdOption,
    creditorOption,
    debtorOption,
    deliveryDateOption,
    depositAmountOption,
    descriptionOption,
    dueByOption,
    impairmentGracePeriodOption,
    interestRateBpsOption,
    noteOption,
    paymentAmountOption,
    periodsPerYearOption,
} from '../options/invoice-options.js';
import { privateKeyOption, tokenOption } from '../options/pay-options.js';
import {
    validateAcceptPurchaseOrderParams,
    validateCancelInvoiceParams,
    validateCreateInvoiceParams,
    validateDeliverPurchaseOrderParams,
    validateImpairInvoiceParams,
    validateMarkInvoiceAsPaidParams,
    validatePayInvoiceParams,
    validateSetPaidInvoiceCallbackParams,
    validateUpdateBindingParams,
} from './validation.js';

// ============================================================================
// CREATE INVOICE
// ============================================================================

export const invoiceCreateBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        debtor: debtorOption,
        creditor: creditorOption,
        claimAmount: claimAmountOption,
        token: tokenOption,
        dueBy: dueByOption,
        deliveryDate: deliveryDateOption,
        description: descriptionOption,
        binding: bindingOption,
        interestRateBps: interestRateBpsOption,
        periodsPerYear: periodsPerYearOption,
        impairmentGracePeriod: impairmentGracePeriodOption,
        depositAmount: depositAmountOption,
        format: formatOption,
    },
    ({
        chain,
        debtor,
        creditor,
        claimAmount,
        token,
        dueBy,
        deliveryDate,
        description,
        binding,
        interestRateBps,
        periodsPerYear,
        impairmentGracePeriod,
        depositAmount,
        format,
    }) =>
        Effect.gen(function* () {
            const params = yield* validateCreateInvoiceParams(
                chain,
                debtor,
                creditor,
                claimAmount,
                token,
                dueBy,
                deliveryDate,
                description,
                binding,
                interestRateBps,
                periodsPerYear,
                impairmentGracePeriod,
                depositAmount,
            );
            const tx = yield* buildCreateInvoice(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned createInvoice transaction (no private key required)'));

export const invoiceCreateExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        debtor: debtorOption,
        creditor: creditorOption,
        claimAmount: claimAmountOption,
        token: tokenOption,
        dueBy: dueByOption,
        deliveryDate: deliveryDateOption,
        description: descriptionOption,
        binding: bindingOption,
        interestRateBps: interestRateBpsOption,
        periodsPerYear: periodsPerYearOption,
        impairmentGracePeriod: impairmentGracePeriodOption,
        depositAmount: depositAmountOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({
        chain,
        debtor,
        creditor,
        claimAmount,
        token,
        dueBy,
        deliveryDate,
        description,
        binding,
        interestRateBps,
        periodsPerYear,
        impairmentGracePeriod,
        depositAmount,
        privateKey,
        rpcUrl,
        format,
    }) =>
        Effect.gen(function* () {
            const params = yield* validateCreateInvoiceParams(
                chain,
                debtor,
                creditor,
                claimAmount,
                token,
                dueBy,
                deliveryDate,
                description,
                binding,
                interestRateBps,
                periodsPerYear,
                impairmentGracePeriod,
                depositAmount,
            );
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendCreateInvoice(params).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a createInvoice transaction (requires private key)'));

export const invoiceCreateCommand = Command.make('create', {}).pipe(
    Command.withDescription('Create a new invoice'),
    Command.withSubcommands([invoiceCreateBuildCommand, invoiceCreateExecuteCommand]),
);

// ============================================================================
// PAY INVOICE
// ============================================================================

export const invoicePayBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        paymentAmount: paymentAmountOption,
        rpcUrl: requiredRpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, paymentAmount, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validatePayInvoiceParams(chain, claimId, paymentAmount);
            const tx = yield* buildPayInvoice(params).pipe(Effect.provide(makeReaderLayer(rpcUrl)));
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned payInvoice transaction (no private key required)'));

export const invoicePayExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        paymentAmount: paymentAmountOption,
        privateKey: privateKeyOption,
        rpcUrl: requiredRpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, paymentAmount, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validatePayInvoiceParams(chain, claimId, paymentAmount);
            const signerLayer = makeSignerLayer(privateKey as Hex, rpcUrl);
            const readerLayer = makeReaderLayer(rpcUrl);
            const result = yield* sendPayInvoice(params).pipe(Effect.provide(signerLayer), Effect.provide(readerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a payInvoice transaction (requires private key)'));

export const invoicePayCommand = Command.make('pay', {}).pipe(
    Command.withDescription('Pay an existing invoice'),
    Command.withSubcommands([invoicePayBuildCommand, invoicePayExecuteCommand]),
);

// ============================================================================
// CANCEL INVOICE
// ============================================================================

export const invoiceCancelBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        note: noteOption,
        format: formatOption,
    },
    ({ chain, claimId, note, format }) =>
        Effect.gen(function* () {
            const params = yield* validateCancelInvoiceParams(chain, claimId, note);
            const tx = yield* buildCancelInvoice(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned cancelInvoice transaction (no private key required)'));

export const invoiceCancelExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        note: noteOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, note, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateCancelInvoiceParams(chain, claimId, note);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendCancelInvoice(params).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a cancelInvoice transaction (requires private key)'));

export const invoiceCancelCommand = Command.make('cancel', {}).pipe(
    Command.withDescription('Cancel an invoice'),
    Command.withSubcommands([invoiceCancelBuildCommand, invoiceCancelExecuteCommand]),
);

// ============================================================================
// IMPAIR INVOICE
// ============================================================================

export const invoiceImpairBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateImpairInvoiceParams(chain, claimId);
            const tx = yield* buildImpairInvoice(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned impairInvoice transaction (no private key required)'));

export const invoiceImpairExecuteCommand = Command.make(
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
            const params = yield* validateImpairInvoiceParams(chain, claimId);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendImpairInvoice(params).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an impairInvoice transaction (requires private key)'));

export const invoiceImpairCommand = Command.make('impair', {}).pipe(
    Command.withDescription('Mark an invoice as impaired'),
    Command.withSubcommands([invoiceImpairBuildCommand, invoiceImpairExecuteCommand]),
);

// ============================================================================
// MARK INVOICE AS PAID
// ============================================================================

export const invoiceMarkPaidBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateMarkInvoiceAsPaidParams(chain, claimId);
            const tx = yield* buildMarkInvoiceAsPaid(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned markInvoiceAsPaid transaction (no private key required)'));

export const invoiceMarkPaidExecuteCommand = Command.make(
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
            const params = yield* validateMarkInvoiceAsPaidParams(chain, claimId);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendMarkInvoiceAsPaid(params).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a markInvoiceAsPaid transaction (requires private key)'));

export const invoiceMarkPaidCommand = Command.make('mark-paid', {}).pipe(
    Command.withDescription('Mark an invoice as paid'),
    Command.withSubcommands([invoiceMarkPaidBuildCommand, invoiceMarkPaidExecuteCommand]),
);

// ============================================================================
// UPDATE BINDING
// ============================================================================

export const invoiceUpdateBindingBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        binding: bindingOption,
        format: formatOption,
    },
    ({ chain, claimId, binding, format }) =>
        Effect.gen(function* () {
            const params = yield* validateUpdateBindingParams(chain, claimId, binding);
            const tx = yield* buildUpdateBinding(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned updateBinding transaction (no private key required)'));

export const invoiceUpdateBindingExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        binding: bindingOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, binding, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateUpdateBindingParams(chain, claimId, binding);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendUpdateBinding(params).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an updateBinding transaction (requires private key)'));

export const invoiceUpdateBindingCommand = Command.make('update-binding', {}).pipe(
    Command.withDescription('Update invoice binding status'),
    Command.withSubcommands([invoiceUpdateBindingBuildCommand, invoiceUpdateBindingExecuteCommand]),
);

// ============================================================================
// SET PAID INVOICE CALLBACK
// ============================================================================

export const invoiceSetCallbackBuildCommand = Command.make(
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
            const params = yield* validateSetPaidInvoiceCallbackParams(chain, claimId, callbackContract, callbackSelector);
            const tx = yield* buildSetPaidInvoiceCallback(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned setPaidInvoiceCallback transaction (no private key required)'));

export const invoiceSetCallbackExecuteCommand = Command.make(
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
            const params = yield* validateSetPaidInvoiceCallbackParams(chain, claimId, callbackContract, callbackSelector);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendSetPaidInvoiceCallback(params).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a setPaidInvoiceCallback transaction (requires private key)'));

export const invoiceSetCallbackCommand = Command.make('set-callback', {}).pipe(
    Command.withDescription('Set callback for when an invoice is paid'),
    Command.withSubcommands([invoiceSetCallbackBuildCommand, invoiceSetCallbackExecuteCommand]),
);

// ============================================================================
// ACCEPT PURCHASE ORDER
// ============================================================================

export const invoiceAcceptPoBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        depositAmount: depositAmountOption,
        rpcUrl: requiredRpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, depositAmount, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateAcceptPurchaseOrderParams(chain, claimId, depositAmount);
            const tx = yield* buildAcceptPurchaseOrder(params).pipe(Effect.provide(makeReaderLayer(rpcUrl)));
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned acceptPurchaseOrder transaction (no private key required)'));

export const invoiceAcceptPoExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        depositAmount: depositAmountOption,
        privateKey: privateKeyOption,
        rpcUrl: requiredRpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, depositAmount, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateAcceptPurchaseOrderParams(chain, claimId, depositAmount);
            const signerLayer = makeSignerLayer(privateKey as Hex, rpcUrl);
            const readerLayer = makeReaderLayer(rpcUrl);
            const result = yield* sendAcceptPurchaseOrder(params).pipe(Effect.provide(signerLayer), Effect.provide(readerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an acceptPurchaseOrder transaction (requires private key)'));

export const invoiceAcceptPoCommand = Command.make('accept-po', {}).pipe(
    Command.withDescription('Accept a purchase order'),
    Command.withSubcommands([invoiceAcceptPoBuildCommand, invoiceAcceptPoExecuteCommand]),
);

// ============================================================================
// DELIVER PURCHASE ORDER
// ============================================================================

export const invoiceDeliverPoBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateDeliverPurchaseOrderParams(chain, claimId);
            const tx = yield* buildDeliverPurchaseOrder(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned deliverPurchaseOrder transaction (no private key required)'));

export const invoiceDeliverPoExecuteCommand = Command.make(
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
            const params = yield* validateDeliverPurchaseOrderParams(chain, claimId);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendDeliverPurchaseOrder(params).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send a deliverPurchaseOrder transaction (requires private key)'));

export const invoiceDeliverPoCommand = Command.make('deliver-po', {}).pipe(
    Command.withDescription('Mark a purchase order as delivered'),
    Command.withSubcommands([invoiceDeliverPoBuildCommand, invoiceDeliverPoExecuteCommand]),
);

// ============================================================================
// EXPORT ALL INVOICE COMMANDS
// ============================================================================

export const invoiceCommands = [
    invoiceCreateCommand,
    invoicePayCommand,
    invoiceCancelCommand,
    invoiceImpairCommand,
    invoiceMarkPaidCommand,
    invoiceUpdateBindingCommand,
    invoiceSetCallbackCommand,
    invoiceAcceptPoCommand,
    invoiceDeliverPoCommand,
] as const;
