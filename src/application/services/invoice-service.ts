import { Effect } from 'effect';
import type { ContractNotFoundError, SignerRequiredError, TransactionFailedError, UnsupportedChainError } from '../../domain/errors.js';
import type {
    CreateInvoiceParams,
    ClaimMetadata,
    PayInvoiceParams,
    UpdateBindingParams,
    CancelInvoiceParams,
    InvoiceOperationParams,
    AcceptPurchaseOrderParams,
    SetCallbackParams,
} from '../../domain/types/invoice.js';
import type { TransactionResult, UnsignedTransaction } from '../../domain/types/transaction.js';
import { isNativeToken } from '../../domain/types/token.js';
import { InvoiceEncoderService } from '../ports/invoice-encoder-port.js';
import { RegistryService } from '../ports/registry-port.js';
import { SignerService } from '../ports/signer-port.js';
import { executeTransaction } from './transaction-utils.js';

/**
 * Build mode: produces unsigned transaction for createInvoice
 */
export const buildCreateInvoice = (
    params: CreateInvoiceParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);

        const data = yield* encoder.encodeCreateInvoice(params);

        // Invoice creation always has value = '0'
        // Protocol fees are out of scope for now
        // Deposit amounts are token values sent by the debtor to bind the claim, not part of the transaction value
        const value = '0';

        return {
            to: contractAddress,
            value,
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for createInvoiceWithMetadata
 */
export const buildCreateInvoiceWithMetadata = (
    params: CreateInvoiceParams,
    metadata: ClaimMetadata,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);

        const data = yield* encoder.encodeCreateInvoiceWithMetadata(params, metadata);

        // Invoice creation always has value = '0'
        // Protocol fees are out of scope for now
        // Deposit amounts are token values sent by the debtor to bind the claim, not part of the transaction value
        const value = '0';

        return {
            to: contractAddress,
            value,
            data,
            operation: 0 as const,
        };
    });

/**
 * Build mode: produces unsigned transaction for payInvoice
 */
export const buildPayInvoice = (
    params: PayInvoiceParams,
    tokenAddress: string, // Need to know if it's native or ERC20
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);

        const data = yield* encoder.encodePayInvoice(params);

        const value = isNativeToken(tokenAddress) ? params.paymentAmount.toString() : '0';

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
 * Build mode: produces unsigned transaction for acceptPurchaseOrder
 */
export const buildAcceptPurchaseOrder = (
    params: AcceptPurchaseOrderParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InvoiceEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* InvoiceEncoderService;

        const contractAddress = yield* registry.getInvoiceAddress(params.chainId);
        const data = yield* encoder.encodeAcceptPurchaseOrder(params);

        return {
            to: contractAddress,
            value: params.depositAmount.toString(),
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
 * Execute mode: signs and sends createInvoice transaction
 */
export const sendCreateInvoice = (params: CreateInvoiceParams) => executeTransaction(buildCreateInvoice, params);

/**
 * Execute mode: signs and sends createInvoiceWithMetadata transaction
 */
export const sendCreateInvoiceWithMetadata = (params: CreateInvoiceParams, metadata: ClaimMetadata) =>
    executeTransaction((p: CreateInvoiceParams) => buildCreateInvoiceWithMetadata(p, metadata), params);

/**
 * Execute mode: signs and sends payInvoice transaction
 */
export const sendPayInvoice = (params: PayInvoiceParams, tokenAddress: string) =>
    executeTransaction((p: PayInvoiceParams) => buildPayInvoice(p, tokenAddress), params);

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
export const sendDeliverPurchaseOrder = (params: InvoiceOperationParams) =>
    executeTransaction(buildDeliverPurchaseOrder, params);

/**
 * Execute mode: signs and sends acceptPurchaseOrder transaction
 */
export const sendAcceptPurchaseOrder = (params: AcceptPurchaseOrderParams) =>
    executeTransaction(buildAcceptPurchaseOrder, params);

/**
 * Execute mode: signs and sends setPaidInvoiceCallback transaction
 */
export const sendSetPaidInvoiceCallback = (params: SetCallbackParams) =>
    executeTransaction(buildSetPaidInvoiceCallback, params);
