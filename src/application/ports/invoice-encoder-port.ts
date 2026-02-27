import { Context, Effect } from 'effect';
import type { Hex } from '../../domain/types/eth.js';
import type {
    AcceptPurchaseOrderParams,
    CancelInvoiceParams,
    ClaimMetadata,
    CreateInvoiceParams,
    InvoiceOperationParams,
    PayInvoiceParams,
    SetCallbackParams,
    UpdateBindingParams,
} from '../../domain/types/invoice.js';

/**
 * Port for encoding invoice-related transactions.
 * Implementations can use viem, ethers, or any other encoding library.
 */
export interface InvoiceEncoderService {
    encodeCreateInvoice(params: Omit<CreateInvoiceParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeCreateInvoiceWithMetadata(
        params: Omit<CreateInvoiceParams, 'chainId'>,
        metadata: ClaimMetadata,
    ): Effect.Effect<Hex, never, never>;
    encodePayInvoice(params: Omit<PayInvoiceParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeCancelInvoice(params: Omit<CancelInvoiceParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeImpairInvoice(params: Omit<InvoiceOperationParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeMarkInvoiceAsPaid(params: Omit<InvoiceOperationParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeUpdateBinding(params: Omit<UpdateBindingParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeDeliverPurchaseOrder(params: Omit<InvoiceOperationParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeAcceptPurchaseOrder(params: Omit<AcceptPurchaseOrderParams, 'chainId'>): Effect.Effect<Hex, never, never>;
    encodeSetPaidInvoiceCallback(params: Omit<SetCallbackParams, 'chainId'>): Effect.Effect<Hex, never, never>;
}

export const InvoiceEncoderService = Context.GenericTag<InvoiceEncoderService>('@services/InvoiceEncoderService');
