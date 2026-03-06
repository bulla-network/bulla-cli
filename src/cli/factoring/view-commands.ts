import { Command, Options } from '@effect/cli';
import { Console, Effect } from 'effect';
import { FactoringReaderService } from '../../application/ports/factoring-reader-port.js';
import { EthAddress } from '../../domain/types/eth.js';
import { makeFactoringReaderLayer } from '../../infrastructure/reading/viem-factoring-reader.js';
import type { OutputFormat } from '../formatters/index.js';
import { formatViewResult } from '../formatters/view.js';
import { formatOption, requiredRpcUrlOption } from '../options/common.js';
import {
    assetsOption,
    factoringInvoiceIdOption,
    poolAddressOption,
    sharesOption,
    upfrontBpsOption,
} from '../options/factoring-options.js';

// ============================================================================
// OPTIONS
// ============================================================================

const offsetOption = Options.integer('offset').pipe(
    Options.withDefault(0),
    Options.withDescription('Pagination offset (default: 0)'),
);

const limitOption = Options.integer('limit').pipe(
    Options.withDefault(100),
    Options.withDescription('Pagination limit (default: 100)'),
);

// ============================================================================
// HELPERS
// ============================================================================

/** Validate and cast pool-address string to EthAddress branded type. */
const toPoolAddress = (raw: string): EthAddress => {
    const result = EthAddress(raw.toLowerCase() as `0x${string}`);
    return result;
};

// ============================================================================
// POOL-STATUS
// ============================================================================

const poolStatusCommand = Command.make(
    'pool-status',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        offset: offsetOption,
        limit: limitOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, offset, limit, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.viewPoolStatus(pool, BigInt(offset), BigInt(limit));
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(
                formatViewResult(
                    {
                        impairedInvoiceIds: result.impairedInvoiceIds as unknown as bigint[],
                        hasMore: result.hasMore,
                    },
                    format as OutputFormat,
                ),
            );
        }),
).pipe(Command.withDescription('View pool status including impaired invoices'));

// ============================================================================
// FUND-INFO
// ============================================================================

const fundInfoCommand = Command.make(
    'fund-info',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.getFundInfo(pool);
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult(result as unknown as Record<string, unknown>, format as OutputFormat));
        }),
).pipe(Command.withDescription('View fund info for a factoring pool'));

// ============================================================================
// PREVIEW-DEPOSIT
// ============================================================================

const previewDepositCommand = Command.make(
    'preview-deposit',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        assets: assetsOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, assets, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.previewDeposit(pool, BigInt(assets));
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult({ shares: result }, format as OutputFormat));
        }),
).pipe(Command.withDescription('Preview the shares received for a deposit amount'));

// ============================================================================
// PREVIEW-REDEEM
// ============================================================================

const previewRedeemCommand = Command.make(
    'preview-redeem',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        shares: sharesOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, shares, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.previewRedeem(pool, BigInt(shares));
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult({ assets: result }, format as OutputFormat));
        }),
).pipe(Command.withDescription('Preview the assets received for a redeem amount'));

// ============================================================================
// PREVIEW-UNFACTOR
// ============================================================================

const previewUnfactorCommand = Command.make(
    'preview-unfactor',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, invoiceId, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.previewUnfactor(pool, BigInt(invoiceId));
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult(result as unknown as Record<string, unknown>, format as OutputFormat));
        }),
).pipe(Command.withDescription('Preview the refund or payment amount for unfactoring an invoice'));

// ============================================================================
// KICKBACK
// ============================================================================

const kickbackCommand = Command.make(
    'kickback',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, invoiceId, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.calculateKickbackAmount(pool, BigInt(invoiceId));
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult(result as unknown as Record<string, unknown>, format as OutputFormat));
        }),
).pipe(Command.withDescription('Calculate the kickback amount for a funded invoice'));

// ============================================================================
// TARGET-FEES
// ============================================================================

const targetFeesCommand = Command.make(
    'target-fees',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        invoiceId: factoringInvoiceIdOption,
        upfrontBps: upfrontBpsOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, invoiceId, upfrontBps, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.calculateTargetFees(pool, BigInt(invoiceId), upfrontBps);
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult(result as unknown as Record<string, unknown>, format as OutputFormat));
        }),
).pipe(Command.withDescription('Calculate target fee breakdown for an invoice'));

// ============================================================================
// CAPITAL
// ============================================================================

const capitalCommand = Command.make(
    'capital',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.calculateCapitalAccount(pool);
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult({ capitalAccount: result }, format as OutputFormat));
        }),
).pipe(Command.withDescription('Calculate the capital account for a factoring pool'));

// ============================================================================
// ACCRUED-PROFITS
// ============================================================================

const accruedProfitsCommand = Command.make(
    'accrued-profits',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.calculateAccruedProfits(pool);
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult({ accruedProfits: result }, format as OutputFormat));
        }),
).pipe(Command.withDescription('Calculate accrued profits for a factoring pool'));

// ============================================================================
// QUEUE SUBCOMMANDS
// ============================================================================

const queueStatsCommand = Command.make(
    'stats',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.getQueueStats(pool);
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult(result as unknown as Record<string, unknown>, format as OutputFormat));
        }),
).pipe(Command.withDescription('View redemption queue statistics'));

const queueNextCommand = Command.make(
    'next',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.getNextRedemption(pool);
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult(result as unknown as Record<string, unknown>, format as OutputFormat));
        }),
).pipe(Command.withDescription('View the next queued redemption'));

const queueIsEmptyCommand = Command.make(
    'is-empty',
    {
        rpcUrl: requiredRpcUrlOption,
        poolAddress: poolAddressOption,
        format: formatOption,
    },
    ({ rpcUrl, poolAddress, format }) =>
        Effect.gen(function* () {
            const pool = toPoolAddress(poolAddress);
            const readerLayer = makeFactoringReaderLayer(rpcUrl);
            const result = yield* Effect.gen(function* () {
                const reader = yield* FactoringReaderService;
                return yield* reader.isQueueEmpty(pool);
            }).pipe(Effect.provide(readerLayer));
            yield* Console.log(formatViewResult({ isEmpty: result }, format as OutputFormat));
        }),
).pipe(Command.withDescription('Check if the redemption queue is empty'));

// ============================================================================
// QUEUE PARENT COMMAND
// ============================================================================

export const queueCommand = Command.make('queue', {}).pipe(
    Command.withDescription('Redemption queue operations'),
    Command.withSubcommands([queueStatsCommand, queueNextCommand, queueIsEmptyCommand]),
);

// ============================================================================
// EXPORT ALL FACTORING VIEW COMMANDS
// ============================================================================

export const factoringViewCommands = [
    poolStatusCommand,
    fundInfoCommand,
    previewDepositCommand,
    previewRedeemCommand,
    previewUnfactorCommand,
    kickbackCommand,
    targetFeesCommand,
    capitalCommand,
    accruedProfitsCommand,
] as const;
