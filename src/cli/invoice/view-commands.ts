import { Command } from '@effect/cli';
import { Console, Effect } from 'effect';
import { InvoiceReaderService } from '../../application/ports/invoice-reader-port.js';
import { makeReaderLayer } from '../../infrastructure/layers.js';
import { formatViewResult, formatViewResults } from '../formatters/view.js';
import type { OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, getChainId, requiredRpcUrlOption } from '../options/common.js';
import { claimIdsOption, parseClaimIds } from '../options/invoice-options.js';

// ============================================================================
// GET INVOICE
// ============================================================================

export const invoiceGetCommand = Command.make(
    'get',
    {
        chain: chainOption,
        rpcUrl: requiredRpcUrlOption,
        claimIds: claimIdsOption,
        format: formatOption,
    },
    ({ chain, rpcUrl, claimIds: rawIds, format }) =>
        Effect.gen(function* () {
            const chainId = yield* getChainId(chain, rpcUrl);
            if (!chainId) return;

            const ids = parseClaimIds(rawIds);
            const readerLayer = makeReaderLayer(rpcUrl);
            const results = yield* InvoiceReaderService.pipe(
                Effect.flatMap(reader => reader.getInvoices(chainId, ids)),
                Effect.provide(readerLayer),
            );

            const data = results.map((r, i) => ({ claimId: ids[i]!.toString(), ...r }) as unknown as Record<string, unknown>);
            yield* Console.log(data.length === 1 ? formatViewResult(data[0]!, format as OutputFormat) : formatViewResults(data, format as OutputFormat));
        }),
).pipe(Command.withDescription('Read invoice(s) from on-chain by claim ID(s)'));

// ============================================================================
// GET DEPOSIT NEEDED
// ============================================================================

export const invoiceDepositNeededCommand = Command.make(
    'deposit-needed',
    {
        chain: chainOption,
        rpcUrl: requiredRpcUrlOption,
        claimIds: claimIdsOption,
        format: formatOption,
    },
    ({ chain, rpcUrl, claimIds: rawIds, format }) =>
        Effect.gen(function* () {
            const chainId = yield* getChainId(chain, rpcUrl);
            if (!chainId) return;

            const ids = parseClaimIds(rawIds);
            const readerLayer = makeReaderLayer(rpcUrl);
            const amounts = yield* InvoiceReaderService.pipe(
                Effect.flatMap(reader => reader.getDepositAmountsNeeded(chainId, ids)),
                Effect.provide(readerLayer),
            );

            const data = amounts.map((amount, i) => ({ claimId: ids[i]!.toString(), depositAmountNeeded: amount }));
            yield* Console.log(
                data.length === 1
                    ? formatViewResult(data[0]!, format as OutputFormat)
                    : formatViewResults(data, format as OutputFormat),
            );
        }),
).pipe(Command.withDescription('Get the total amount needed for purchase order deposit(s)'));

// ============================================================================
// TOTAL AMOUNT DUE
// ============================================================================

export const invoiceTotalDueCommand = Command.make(
    'total-due',
    {
        chain: chainOption,
        rpcUrl: requiredRpcUrlOption,
        claimIds: claimIdsOption,
        format: formatOption,
    },
    ({ chain, rpcUrl, claimIds: rawIds, format }) =>
        Effect.gen(function* () {
            const chainId = yield* getChainId(chain, rpcUrl);
            if (!chainId) return;

            const ids = parseClaimIds(rawIds);
            const readerLayer = makeReaderLayer(rpcUrl);
            const results = yield* InvoiceReaderService.pipe(
                Effect.flatMap(reader => reader.getTotalAmountsDue(chainId, ids)),
                Effect.provide(readerLayer),
            );

            const data = results.map((r, i) => ({
                claimId: ids[i]!.toString(),
                remainingPrincipal: r.remainingPrincipal.toString(),
                grossInterest: r.grossInterest.toString(),
            }));
            yield* Console.log(
                data.length === 1
                    ? formatViewResult(data[0]!, format as OutputFormat)
                    : formatViewResults(data, format as OutputFormat),
            );
        }),
).pipe(Command.withDescription('Get the total amount due (remaining principal + gross interest) for invoice(s)'));

// ============================================================================
// EXPORT VIEW COMMANDS
// ============================================================================

export const invoiceViewCommands = [invoiceGetCommand, invoiceDepositNeededCommand, invoiceTotalDueCommand] as const;
