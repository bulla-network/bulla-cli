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

        // Calculate value: native token payment + deposit amount (if applicable)
        let value = '0';
        if (isNativeToken(params.token)) {
            value = (params.claimAmount + params.depositAmount).toString();
        } else if (params.depositAmount > 0n) {
            // For ERC20 invoices with deposits, only the deposit is sent as value
            value = params.depositAmount.toString();
        }

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

        // Calculate value: native token payment + deposit amount (if applicable)
        let value = '0';
        if (isNativeToken(params.token)) {
            value = (params.claimAmount + params.depositAmount).toString();
        } else if (params.depositAmount > 0n) {
            value = params.depositAmount.toString();
        }

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
export const sendCreateInvoice = (
    params: CreateInvoiceParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildCreateInvoice(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends createInvoiceWithMetadata transaction
 */
export const sendCreateInvoiceWithMetadata = (
    params: CreateInvoiceParams,
    metadata: ClaimMetadata,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildCreateInvoiceWithMetadata(params, metadata);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends payInvoice transaction
 */
export const sendPayInvoice = (
    params: PayInvoiceParams,
    tokenAddress: string,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildPayInvoice(params, tokenAddress);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends cancelInvoice transaction
 */
export const sendCancelInvoice = (
    params: CancelInvoiceParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildCancelInvoice(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends impairInvoice transaction
 */
export const sendImpairInvoice = (
    params: InvoiceOperationParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildImpairInvoice(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends markInvoiceAsPaid transaction
 */
export const sendMarkInvoiceAsPaid = (
    params: InvoiceOperationParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildMarkInvoiceAsPaid(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends updateBinding transaction
 */
export const sendUpdateBinding = (
    params: UpdateBindingParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildUpdateBinding(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends deliverPurchaseOrder transaction
 */
export const sendDeliverPurchaseOrder = (
    params: InvoiceOperationParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildDeliverPurchaseOrder(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends acceptPurchaseOrder transaction
 */
export const sendAcceptPurchaseOrder = (
    params: AcceptPurchaseOrderParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildAcceptPurchaseOrder(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });

/**
 * Execute mode: signs and sends setPaidInvoiceCallback transaction
 */
export const sendSetPaidInvoiceCallback = (
    params: SetCallbackParams,
): Effect.Effect<
    TransactionResult,
    ContractNotFoundError | UnsupportedChainError | TransactionFailedError | SignerRequiredError,
    RegistryService | InvoiceEncoderService | SignerService
> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildSetPaidInvoiceCallback(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });
