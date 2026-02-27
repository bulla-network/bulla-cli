import { Effect } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type {
    AcceptLoanParams,
    LoanOperationParams,
    OfferLoanParams,
    PayLoanParams,
    RejectLoanOfferParams,
    SetLoanCallbackParams,
} from '../../domain/types/frendlend.js';
import type { UnsignedTransaction } from '../../domain/types/transaction.js';
import { FrendLendEncoderService } from '../ports/frendlend-encoder-port.js';
import { RegistryService } from '../ports/registry-port.js';
import { executeTransaction } from './transaction-utils.js';

/**
 * Build mode: produces unsigned transaction for offerLoan.
 * If params.metadata is provided, uses offerLoanWithMetadata on-chain.
 */
export const buildOfferLoan = (
    params: OfferLoanParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FrendLendEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FrendLendEncoderService;

        const contractAddress = yield* registry.getFrendLendAddress(params.chainId);

        const data = params.metadata
            ? yield* encoder.encodeOfferLoanWithMetadata(params, params.metadata)
            : yield* encoder.encodeOfferLoan(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for rejectLoanOffer.
 */
export const buildRejectLoanOffer = (
    params: RejectLoanOfferParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FrendLendEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FrendLendEncoderService;

        const contractAddress = yield* registry.getFrendLendAddress(params.chainId);
        const data = yield* encoder.encodeRejectLoanOffer(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for acceptLoan.
 * If params.receiver is set, uses acceptLoanWithReceiver.
 */
export const buildAcceptLoan = (
    params: AcceptLoanParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FrendLendEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FrendLendEncoderService;

        const contractAddress = yield* registry.getFrendLendAddress(params.chainId);
        const data = yield* encoder.encodeAcceptLoan(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for payLoan.
 */
export const buildPayLoan = (
    params: PayLoanParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FrendLendEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FrendLendEncoderService;

        const contractAddress = yield* registry.getFrendLendAddress(params.chainId);
        const data = yield* encoder.encodePayLoan(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for impairLoan.
 */
export const buildImpairLoan = (
    params: LoanOperationParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FrendLendEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FrendLendEncoderService;

        const contractAddress = yield* registry.getFrendLendAddress(params.chainId);
        const data = yield* encoder.encodeImpairLoan(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for markLoanAsPaid.
 */
export const buildMarkLoanAsPaid = (
    params: LoanOperationParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FrendLendEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FrendLendEncoderService;

        const contractAddress = yield* registry.getFrendLendAddress(params.chainId);
        const data = yield* encoder.encodeMarkLoanAsPaid(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for setPaidLoanCallback.
 */
export const buildSetPaidLoanCallback = (
    params: SetLoanCallbackParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FrendLendEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FrendLendEncoderService;

        const contractAddress = yield* registry.getFrendLendAddress(params.chainId);
        const data = yield* encoder.encodeSetPaidLoanCallback(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/** Execute mode: signs and sends offerLoan transaction. */
export const sendOfferLoan = (params: OfferLoanParams) => executeTransaction(buildOfferLoan, params);

/** Execute mode: signs and sends rejectLoanOffer transaction. */
export const sendRejectLoanOffer = (params: RejectLoanOfferParams) => executeTransaction(buildRejectLoanOffer, params);

/** Execute mode: signs and sends acceptLoan transaction. */
export const sendAcceptLoan = (params: AcceptLoanParams) => executeTransaction(buildAcceptLoan, params);

/** Execute mode: signs and sends payLoan transaction. */
export const sendPayLoan = (params: PayLoanParams) => executeTransaction(buildPayLoan, params);

/** Execute mode: signs and sends impairLoan transaction. */
export const sendImpairLoan = (params: LoanOperationParams) => executeTransaction(buildImpairLoan, params);

/** Execute mode: signs and sends markLoanAsPaid transaction. */
export const sendMarkLoanAsPaid = (params: LoanOperationParams) => executeTransaction(buildMarkLoanAsPaid, params);

/** Execute mode: signs and sends setPaidLoanCallback transaction. */
export const sendSetPaidLoanCallback = (params: SetLoanCallbackParams) => executeTransaction(buildSetPaidLoanCallback, params);
