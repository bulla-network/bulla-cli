import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import type { Hex } from '../../domain/types/eth.js';
import { InvoiceEncoderService } from '../../application/ports/invoice-encoder-port.js';
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
import { bullaInvoiceAbi } from '../abi/bulla-invoice.js';

const encodeCreateInvoice = (params: Omit<CreateInvoiceParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'createInvoice',
            args: [
                {
                    debtor: params.debtor,
                    creditor: params.creditor,
                    claimAmount: params.claimAmount,
                    dueBy: params.dueBy,
                    deliveryDate: params.deliveryDate,
                    description: params.description,
                    token: params.token,
                    binding: params.binding,
                    lateFeeConfig: {
                        interestRateBps: params.lateFeeConfig.interestRateBps,
                        numberOfPeriodsPerYear: params.lateFeeConfig.numberOfPeriodsPerYear,
                    },
                    impairmentGracePeriod: params.impairmentGracePeriod,
                    depositAmount: params.depositAmount,
                },
            ],
        }),
    );

const encodeCreateInvoiceWithMetadata = (
    params: Omit<CreateInvoiceParams, 'chainId'>,
    metadata: ClaimMetadata,
): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'createInvoiceWithMetadata',
            args: [
                {
                    debtor: params.debtor,
                    creditor: params.creditor,
                    claimAmount: params.claimAmount,
                    dueBy: params.dueBy,
                    deliveryDate: params.deliveryDate,
                    description: params.description,
                    token: params.token,
                    binding: params.binding,
                    lateFeeConfig: {
                        interestRateBps: params.lateFeeConfig.interestRateBps,
                        numberOfPeriodsPerYear: params.lateFeeConfig.numberOfPeriodsPerYear,
                    },
                    impairmentGracePeriod: params.impairmentGracePeriod,
                    depositAmount: params.depositAmount,
                },
                {
                    tokenURI: metadata.tokenURI,
                    attachmentURI: metadata.attachmentURI,
                },
            ],
        }),
    );

const encodePayInvoice = (params: Omit<PayInvoiceParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'payInvoice',
            args: [params.claimId, params.paymentAmount],
        }),
    );

const encodeCancelInvoice = (params: Omit<CancelInvoiceParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'cancelInvoice',
            args: [params.claimId, params.note],
        }),
    );

const encodeImpairInvoice = (params: Omit<InvoiceOperationParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'impairInvoice',
            args: [params.claimId],
        }),
    );

const encodeMarkInvoiceAsPaid = (params: Omit<InvoiceOperationParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'markInvoiceAsPaid',
            args: [params.claimId],
        }),
    );

const encodeUpdateBinding = (params: Omit<UpdateBindingParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'updateBinding',
            args: [params.claimId, params.binding],
        }),
    );

const encodeDeliverPurchaseOrder = (params: Omit<InvoiceOperationParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'deliverPurchaseOrder',
            args: [params.claimId],
        }),
    );

const encodeAcceptPurchaseOrder = (params: Omit<AcceptPurchaseOrderParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'acceptPurchaseOrder',
            args: [params.claimId, params.depositAmount],
        }),
    );

const encodeSetPaidInvoiceCallback = (params: Omit<SetCallbackParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaInvoiceAbi,
            functionName: 'setPaidInvoiceCallback',
            args: [params.invoiceId, params.callbackContract, params.callbackSelector as Hex],
        }),
    );

export const ViemInvoiceEncoderLive = Layer.succeed(InvoiceEncoderService, {
    encodeCreateInvoice,
    encodeCreateInvoiceWithMetadata,
    encodePayInvoice,
    encodeCancelInvoice,
    encodeImpairInvoice,
    encodeMarkInvoiceAsPaid,
    encodeUpdateBinding,
    encodeDeliverPurchaseOrder,
    encodeAcceptPurchaseOrder,
    encodeSetPaidInvoiceCallback,
});
