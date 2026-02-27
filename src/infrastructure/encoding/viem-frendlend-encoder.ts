import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { FrendLendEncoderService } from '../../application/ports/frendlend-encoder-port.js';
import type { Hex } from '../../domain/types/eth.js';
import type {
    AcceptLoanParams,
    LoanOperationParams,
    OfferLoanParams,
    PayLoanParams,
    RejectLoanOfferParams,
    SetLoanCallbackParams,
} from '../../domain/types/frendlend.js';
import type { ClaimMetadata } from '../../domain/types/invoice.js';
import { bullaFrendLendV2Abi } from '../abi/bulla-frendlend-v2.js';

const makeLoanRequestArgs = (params: Omit<OfferLoanParams, 'chainId'>) => ({
    termLength: params.termLength,
    interestConfig: {
        interestRateBps: params.interestConfig.interestRateBps,
        numberOfPeriodsPerYear: params.interestConfig.numberOfPeriodsPerYear,
    },
    loanAmount: params.loanAmount,
    creditor: params.creditor,
    debtor: params.debtor,
    description: params.description,
    token: params.token,
    impairmentGracePeriod: params.impairmentGracePeriod,
    expiresAt: params.expiresAt,
    callbackContract: params.callbackContract,
    callbackSelector: params.callbackSelector,
});

const encodeOfferLoan = (params: Omit<OfferLoanParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFrendLendV2Abi,
            functionName: 'offerLoan',
            args: [makeLoanRequestArgs(params)],
        }),
    );

const encodeOfferLoanWithMetadata = (
    params: Omit<OfferLoanParams, 'chainId'>,
    metadata: ClaimMetadata,
): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFrendLendV2Abi,
            functionName: 'offerLoanWithMetadata',
            args: [
                makeLoanRequestArgs(params),
                {
                    tokenURI: metadata.tokenURI,
                    attachmentURI: metadata.attachmentURI,
                },
            ],
        }),
    );

const encodeRejectLoanOffer = (params: Omit<RejectLoanOfferParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFrendLendV2Abi,
            functionName: 'rejectLoanOffer',
            args: [params.offerId],
        }),
    );

const encodeAcceptLoan = (params: Omit<AcceptLoanParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        params.receiver
            ? encodeFunctionData({
                  abi: bullaFrendLendV2Abi,
                  functionName: 'acceptLoanWithReceiver',
                  args: [params.offerId, params.receiver],
              })
            : encodeFunctionData({
                  abi: bullaFrendLendV2Abi,
                  functionName: 'acceptLoan',
                  args: [params.offerId],
              }),
    );

const encodePayLoan = (params: Omit<PayLoanParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFrendLendV2Abi,
            functionName: 'payLoan',
            args: [params.claimId, params.paymentAmount],
        }),
    );

const encodeImpairLoan = (params: Omit<LoanOperationParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFrendLendV2Abi,
            functionName: 'impairLoan',
            args: [params.claimId],
        }),
    );

const encodeMarkLoanAsPaid = (params: Omit<LoanOperationParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFrendLendV2Abi,
            functionName: 'markLoanAsPaid',
            args: [params.claimId],
        }),
    );

const encodeSetPaidLoanCallback = (params: Omit<SetLoanCallbackParams, 'chainId'>): Effect.Effect<Hex, never, never> =>
    Effect.sync(() =>
        encodeFunctionData({
            abi: bullaFrendLendV2Abi,
            functionName: 'setPaidLoanCallback',
            args: [params.loanId, params.callbackContract, params.callbackSelector],
        }),
    );

export const ViemFrendLendEncoderLive = Layer.succeed(FrendLendEncoderService, {
    encodeOfferLoan,
    encodeOfferLoanWithMetadata,
    encodeRejectLoanOffer,
    encodeAcceptLoan,
    encodePayLoan,
    encodeImpairLoan,
    encodeMarkLoanAsPaid,
    encodeSetPaidLoanCallback,
});
