import { Effect } from 'effect';
import type { ContractNotFoundError, InvoiceNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type {
    AcceptPurchaseOrderParams,
    CancelInvoiceParams,
    CreateInvoiceParams,
    InvoiceOperationParams,
    PayInvoiceParams,
    SetCallbackParams,
    UpdateBindingParams,
} from '../../domain/types/invoice.js';
import { isNativeToken } from '../../domain/types/token.js';
import type { UnsignedTransaction } from '../../domain/types/transaction.js';
import { InvoiceEncoderService } from '../ports/invoice-encoder-port.js';
import { InvoiceReaderService } from '../ports/invoice-reader-port.js';
import { RegistryService } from '../ports/registry-port.js';
import { executeTransaction } from './transaction-utils.js';

/**
 * Build mode: produces unsigned transaction for createInvoice.
 * If params.metadata is provided, uses createInvoiceWithMetadata on-chain.
 */
export const buildCreateInvoice = (
    params: CreateInvoiceParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);

        const data = params.metadata
            ? yield* encoder.encodeCreateInvoiceWithMetadata(params, params.metadata)
            : yield* encoder.encodeCreateInvoice(params);

        // Invoice creation always has value = '0'
        // Protocol fees are out of scope for now
        // Deposit amounts are token values sent by the debtor to bind the claim, not part of the transaction value
        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for payInvoice.
 * Reads the invoice on-chain to determine if the token is native or ERC20.
 */
export const buildPayInvoice = (
    params: PayInvoiceParams,
): Effect.Effect<
    UnsignedTransaction,
    ContractNotFoundError | UnsupportedChainError | InvoiceNotFoundError,
    RegistryService | InvoiceEncoderService | InvoiceReaderService
> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;
        const reader = yield* InvoiceReaderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const invoice = yield* reader.getInvoice(params.chainId, params.claimId);
        const data = yield* encoder.encodePayInvoice(params);

        const value = isNativeToken(invoice.token) ? params.paymentAmount.toString() : '0';

        return {
            to: contractAddress,
            value,
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for cancelInvoice
 */
export const buildCancelInvoice = (
    params: CancelInvoiceParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const data = yield* encoder.encodeCancelInvoice(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for impairInvoice
 */
export const buildImpairInvoice = (
    params: InvoiceOperationParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const data = yield* encoder.encodeImpairInvoice(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for markInvoiceAsPaid
 */
export const buildMarkInvoiceAsPaid = (
    params: InvoiceOperationParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const data = yield* encoder.encodeMarkInvoiceAsPaid(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for updateBinding
 */
export const buildUpdateBinding = (
    params: UpdateBindingParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const data = yield* encoder.encodeUpdateBinding(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for deliverPurchaseOrder
 */
export const buildDeliverPurchaseOrder = (
    params: InvoiceOperationParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const data = yield* encoder.encodeDeliverPurchaseOrder(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for acceptPurchaseOrder.
 * Reads the invoice on-chain to determine if the token is native (value = depositAmount) or ERC20 (value = 0).
 */
export const buildAcceptPurchaseOrder = (
    params: AcceptPurchaseOrderParams,
): Effect.Effect<
    UnsignedTransaction,
    ContractNotFoundError | UnsupportedChainError | InvoiceNotFoundError,
    RegistryService | InvoiceEncoderService | InvoiceReaderService
> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;
        const reader = yield* InvoiceReaderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const invoice = yield* reader.getInvoice(params.chainId, params.claimId);
        const data = yield* encoder.encodeAcceptPurchaseOrder(params);

        const value = isNativeToken(invoice.token) ? params.depositAmount.toString() : '0';

        return {
            to: contractAddress,
            value,
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for setPaidInvoiceCallback
 */
export const buildSetPaidInvoiceCallback = (
    params: SetCallbackParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const data = yield* encoder.encodeSetPaidInvoiceCallback(params);

        return {
            to: contractAddress,
            value: '0',
            data,
            operation: 0 as const,
        };
    });

/**
 * Execute mode: signs and sends createInvoice transaction.
 * If params.metadata is provided, uses createInvoiceWithMetadata on-chain.
 */
export const sendCreateInvoice = (params: CreateInvoiceParams) => executeTransaction(buildCreateInvoice, params);

/**
 * Execute mode: signs and sends payInvoice transaction
 */
export const sendPayInvoice = (params: PayInvoiceParams) => executeTransaction(buildPayInvoice, params);

/**
 * Execute mode: signs and sends cancelInvoice transaction
 */
export const sendCancelInvoice = (params: CancelInvoiceParams) => executeTransaction(buildCancelInvoice, params);

/**
 * Execute mode: signs and sends impairInvoice transaction
 */
export const sendImpairInvoice = (params: InvoiceOperationParams) => executeTransaction(buildImpairInvoice, params);

/**
 * Execute mode: signs and sends markInvoiceAsPaid transaction
 */
export const sendMarkInvoiceAsPaid = (params: InvoiceOperationParams) => executeTransaction(buildMarkInvoiceAsPaid, params);

/**
 * Execute mode: signs and sends updateBinding transaction
 */
export const sendUpdateBinding = (params: UpdateBindingParams) => executeTransaction(buildUpdateBinding, params);

/**
 * Execute mode: signs and sends deliverPurchaseOrder transaction
 */
export const sendDeliverPurchaseOrder = (params: InvoiceOperationParams) => executeTransaction(buildDeliverPurchaseOrder, params);

/**
 * Execute mode: signs and sends acceptPurchaseOrder transaction
 */
export const sendAcceptPurchaseOrder = (params: AcceptPurchaseOrderParams) => executeTransaction(buildAcceptPurchaseOrder, params);

/**
 * Execute mode: signs and sends setPaidInvoiceCallback transaction
 */
export const sendSetPaidInvoiceCallback = (params: SetCallbackParams) => executeTransaction(buildSetPaidInvoiceCallback, params);
