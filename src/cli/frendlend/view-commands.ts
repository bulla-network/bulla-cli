import { Command } from '@effect/cli';
import { Console, Effect, Layer } from 'effect';
import { FrendLendReaderService } from '../../application/ports/frendlend-reader-port.js';
import { BuildModeLayers, makeFrendLendReader } from '../../infrastructure/layers.js';
import type { OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, getChainId, requiredRpcUrlOption } from '../options/common.js';
import { offerIdOption } from '../options/frendlend-options.js';
import { claimIdsOption, parseClaimIds } from '../options/invoice-options.js';
import type { LoanOfferOnChain, LoanOnChain } from '../../domain/types/frendlend.js';

// ============================================================================
// FORMAT HELPERS
// ============================================================================

const bigintReplacer = (_key: string, value: unknown): unknown => (typeof value === 'bigint' ? value.toString() : value);

const formatLoanAsJson = (loan: LoanOnChain): string => JSON.stringify(loan, bigintReplacer, 2);

const formatLoanAsHuman = (loan: LoanOnChain): string => {
    const lines = [
        '--- Loan Details ---',
        `  Claim Amount:    ${loan.claimAmount.toString()}`,
        `  Paid Amount:     ${loan.paidAmount.toString()}`,
        `  Status:          ${loan.status}`,
        `  Binding:         ${loan.binding}`,
        `  Debtor:          ${loan.debtor}`,
        `  Creditor:        ${loan.creditor}`,
        `  Token:           ${loan.token}`,
        `  Controller:      ${loan.controller}`,
        `  Due By:          ${loan.dueBy.toString()}`,
        `  Accepted At:     ${loan.acceptedAt.toString()}`,
        `  Interest Rate:   ${loan.interestConfig.interestRateBps} bps`,
        `  Periods/Year:    ${loan.interestConfig.numberOfPeriodsPerYear}`,
        `  Accrued Interest:      ${loan.interestComputationState.accruedInterest.toString()}`,
        `  Latest Period:         ${loan.interestComputationState.latestPeriodNumber.toString()}`,
        `  Protocol Fee:          ${loan.interestComputationState.protocolFeeBps} bps`,
        `  Gross Interest Paid:   ${loan.interestComputationState.totalGrossInterestPaid.toString()}`,
    ];
    return lines.join('\n');
};

const formatLoansAsJson = (loans: LoanOnChain[]): string => JSON.stringify(loans, bigintReplacer, 2);

const formatLoansAsHuman = (loans: LoanOnChain[]): string =>
    loans.map(loan => formatLoanAsHuman(loan)).join('\n\n');

const formatLoanOfferAsJson = (offer: LoanOfferOnChain): string => JSON.stringify(offer, bigintReplacer, 2);

const formatLoanOfferAsHuman = (offer: LoanOfferOnChain): string => {
    const p = offer.params;
    const lines = [
        '--- Loan Offer Details ---',
        `  Loan Amount:             ${p.loanAmount.toString()}`,
        `  Term Length:             ${p.termLength.toString()} seconds`,
        `  Interest Rate:           ${p.interestConfig.interestRateBps} bps`,
        `  Periods/Year:            ${p.interestConfig.numberOfPeriodsPerYear}`,
        `  Creditor:                ${p.creditor}`,
        `  Debtor:                  ${p.debtor}`,
        `  Token:                   ${p.token}`,
        `  Description:             ${p.description}`,
        `  Impairment Grace Period: ${p.impairmentGracePeriod.toString()} seconds`,
        `  Expires At:              ${p.expiresAt.toString()}`,
        `  Callback Contract:       ${p.callbackContract}`,
        `  Callback Selector:       ${p.callbackSelector}`,
        `  Requested By Creditor:   ${offer.requestedByCreditor}`,
    ];
    return lines.join('\n');
};

const formatTotalDueAsJson = (data: { remainingPrincipal: bigint; grossInterest: bigint }): string =>
    JSON.stringify(data, bigintReplacer, 2);

const formatTotalDueAsHuman = (data: { remainingPrincipal: bigint; grossInterest: bigint }): string => {
    const lines = [
        '--- Total Amount Due ---',
        `  Remaining Principal: ${data.remainingPrincipal.toString()}`,
        `  Gross Interest:      ${data.grossInterest.toString()}`,
    ];
    return lines.join('\n');
};

const formatTotalDuesAsJson = (data: { remainingPrincipal: bigint; grossInterest: bigint }[]): string =>
    JSON.stringify(data, bigintReplacer, 2);

const formatTotalDuesAsHuman = (data: { remainingPrincipal: bigint; grossInterest: bigint }[]): string =>
    data.map(d => formatTotalDueAsHuman(d)).join('\n\n');

// ============================================================================
// GET LOAN
// ============================================================================

export const frendlendGetLoanCommand = Command.make(
    'get-loan',
    {
        chain: chainOption,
        rpcUrl: requiredRpcUrlOption,
        claimIds: claimIdsOption,
        format: formatOption,
    },
    ({ chain, rpcUrl, claimIds: rawIds, format }) =>
        Effect.gen(function* () {
            const chainId = yield* getChainId(chain, rpcUrl);
            const ids = parseClaimIds(rawIds);
            const readerLayer = Layer.provide(makeFrendLendReader(rpcUrl), BuildModeLayers);
            const reader = yield* FrendLendReaderService.pipe(Effect.provide(readerLayer));
            const loans = yield* reader.getLoans(chainId, ids);

            const output =
                loans.length === 1
                    ? format === 'json' ? formatLoanAsJson(loans[0]!) : formatLoanAsHuman(loans[0]!)
                    : format === 'json' ? formatLoansAsJson(loans) : formatLoansAsHuman(loans);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Read loan details from on-chain by claim ID(s)'));

// ============================================================================
// GET OFFER
// ============================================================================

export const frendlendGetOfferCommand = Command.make(
    'get-offer',
    {
        chain: chainOption,
        rpcUrl: requiredRpcUrlOption,
        offerId: offerIdOption,
        format: formatOption,
    },
    ({ chain, rpcUrl, offerId, format }) =>
        Effect.gen(function* () {
            const chainId = yield* getChainId(chain, rpcUrl);
            const readerLayer = Layer.provide(makeFrendLendReader(rpcUrl), BuildModeLayers);
            const reader = yield* FrendLendReaderService.pipe(Effect.provide(readerLayer));
            const offer = yield* reader.getLoanOffer(chainId, BigInt(offerId));

            const output = format === 'json' ? formatLoanOfferAsJson(offer) : formatLoanOfferAsHuman(offer);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Read loan offer details from on-chain by offer ID'));

// ============================================================================
// TOTAL DUE
// ============================================================================

export const frendlendTotalDueCommand = Command.make(
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
            const ids = parseClaimIds(rawIds);
            const readerLayer = Layer.provide(makeFrendLendReader(rpcUrl), BuildModeLayers);
            const reader = yield* FrendLendReaderService.pipe(Effect.provide(readerLayer));
            const results = yield* reader.getTotalAmountsDue(chainId, ids);

            const output =
                results.length === 1
                    ? format === 'json' ? formatTotalDueAsJson(results[0]!) : formatTotalDueAsHuman(results[0]!)
                    : format === 'json' ? formatTotalDuesAsJson(results) : formatTotalDuesAsHuman(results);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Read the total amount due (remaining principal + gross interest) for loan(s)'));

// ============================================================================
// EXPORT ALL VIEW COMMANDS
// ============================================================================

export const frendlendViewCommands = [
    frendlendGetLoanCommand,
    frendlendGetOfferCommand,
    frendlendTotalDueCommand,
] as const;
