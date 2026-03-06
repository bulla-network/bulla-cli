import { Command } from '@effect/cli';
import { Console, Effect } from 'effect';
import { InvoiceReaderService } from '../../application/ports/invoice-reader-port.js';
import { makeReaderLayer } from '../../infrastructure/layers.js';
import { formatViewResult } from '../formatters/view.js';
import type { OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, getChainId, requiredRpcUrlOption } from '../options/common.js';
import { claimIdOption } from '../options/invoice-options.js';

// ============================================================================
// GET INVOICE
// ============================================================================

export const invoiceGetCommand = Command.make(
    'get',
    {
        chain: chainOption,
        rpcUrl: requiredRpcUrlOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, rpcUrl, claimId, format }) =>
        Effect.gen(function* () {
            const chainId = yield* getChainId(chain, rpcUrl);
            if (!chainId) return;

            const readerLayer = makeReaderLayer(rpcUrl);
            const result = yield* InvoiceReaderService.pipe(
                Effect.flatMap(reader => reader.getInvoice(chainId, BigInt(claimId))),
                Effect.provide(readerLayer),
            );

            yield* Console.log(formatViewResult(result as unknown as Record<string, unknown>, format as OutputFormat));
        }),
).pipe(Command.withDescription('Read an invoice from on-chain by claim ID'));

// ============================================================================
// GET DEPOSIT NEEDED
// ============================================================================

export const invoiceDepositNeededCommand = Command.make(
    'deposit-needed',
    {
        chain: chainOption,
        rpcUrl: requiredRpcUrlOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, rpcUrl, claimId, format }) =>
        Effect.gen(function* () {
            const chainId = yield* getChainId(chain, rpcUrl);
            if (!chainId) return;

            const readerLayer = makeReaderLayer(rpcUrl);
            const amount = yield* InvoiceReaderService.pipe(
                Effect.flatMap(reader => reader.getTotalAmountNeededForPurchaseOrderDeposit(chainId, BigInt(claimId))),
                Effect.provide(readerLayer),
            );

            yield* Console.log(
                formatViewResult({ claimId, depositAmountNeeded: amount }, format as OutputFormat),
            );
        }),
).pipe(Command.withDescription('Get the total amount needed for a purchase order deposit'));

// ============================================================================
// EXPORT VIEW COMMANDS
// ============================================================================

export const invoiceViewCommands = [invoiceGetCommand, invoiceDepositNeededCommand] as const;
