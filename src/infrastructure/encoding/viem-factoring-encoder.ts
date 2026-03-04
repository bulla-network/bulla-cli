import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { FactoringEncoderService } from '../../application/ports/factoring-encoder-port.js';
import type { Hex } from '../../domain/types/eth.js';
import type {
    ApproveInvoiceParams,
    DepositParams,
    FundInvoiceParams,
    PoolOfferLoanParams,
    RedeemParams,
    UnfactorInvoiceParams,
    WithdrawParams,
} from '../../domain/types/factoring.js';
import { bullaFactoringV2_1Abi } from '../abi/bulla-factoring-v2-1.js';
import { redemptionQueueAbi } from '../abi/redemption-queue.js';

const encodeDeposit = (params: Omit<DepositParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFactoringV2_1Abi,
            functionName: 'deposit',
            args: [params.assets, params.receiver],
        }),
    );

const encodeRedeem = (params: Omit<RedeemParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFactoringV2_1Abi,
            functionName: 'redeem',
            args: [params.shares, params.receiver, params.owner],
        }),
    );

const encodeWithdraw = (params: Omit<WithdrawParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFactoringV2_1Abi,
            functionName: 'withdraw',
            args: [params.assets, params.receiver, params.owner],
        }),
    );

const encodeApproveInvoice = (params: Omit<ApproveInvoiceParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFactoringV2_1Abi,
            functionName: 'approveInvoice',
            args: [params.invoiceId, params.targetYieldBps, params.spreadBps, params.upfrontBps, params.initialInvoiceValueOverride],
        }),
    );

const encodeFundInvoice = (params: Omit<FundInvoiceParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFactoringV2_1Abi,
            functionName: 'fundInvoice',
            args: [params.invoiceId, params.factorerUpfrontBps, params.receiverAddress],
        }),
    );

const encodeUnfactorInvoice = (params: Omit<UnfactorInvoiceParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFactoringV2_1Abi,
            functionName: 'unfactorInvoice',
            args: [params.invoiceId],
        }),
    );

const encodeOfferLoan = (params: Omit<PoolOfferLoanParams, 'chainId' | 'poolAddress'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFactoringV2_1Abi,
            functionName: 'offerLoan',
            args: [
                params.debtor,
                params.targetYieldBps,
                params.spreadBps,
                params.principalAmount,
                params.termLength,
                params.numberOfPeriodsPerYear,
                params.description,
            ],
        }),
    );

const encodeCancelQueuedRedemption = (queueIndex: bigint): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: redemptionQueueAbi,
            functionName: 'cancelQueuedRedemption',
            args: [queueIndex],
        }),
    );

export const ViemFactoringEncoderLive = Layer.succeed(FactoringEncoderService, {
    encodeDeposit,
    encodeRedeem,
    encodeWithdraw,
    encodeApproveInvoice,
    encodeFundInvoice,
    encodeUnfactorInvoice,
    encodeOfferLoan,
    encodeCancelQueuedRedemption,
});
