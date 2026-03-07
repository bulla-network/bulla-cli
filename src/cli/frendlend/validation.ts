import { Either, Option } from 'effect';
import type { InvalidAddressError, InvalidAmountError, InvalidCallbackSelectorError, InvalidChainError } from '../../domain/errors.js';
import type {
    AcceptLoanParams,
    LoanOperationParams,
    OfferLoanParams,
    PayLoanParams,
    RejectLoanOfferParams,
    SetLoanCallbackParams,
} from '../../domain/types/frendlend.js';
import { validateAddress, validateAmount, validateCallbackSelector, validateChainId } from '../../domain/validation/eth.js';

type ValidationError = InvalidChainError | InvalidAddressError | InvalidAmountError | InvalidCallbackSelectorError;

/** Validate and parse raw CLI inputs into OfferLoanParams (pure). */
export const validateOfferLoanParams = (
    chain: Option.Option<number>,
    creditor: string,
    debtor: string,
    loanAmount: string,
    token: string,
    termLength: number,
    interestRateBps: number,
    periodsPerYear: number,
    impairmentGracePeriod: number,
    expiresAt: number,
    description: string,
    callbackContract: string,
    callbackSelector: string,
): Either.Either<OfferLoanParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            creditor: yield* validateAddress(creditor),
            debtor: yield* validateAddress(debtor),
            loanAmount: yield* validateAmount(loanAmount),
            token: yield* validateAddress(token),
            termLength: BigInt(termLength),
            interestConfig: {
                interestRateBps,
                numberOfPeriodsPerYear: periodsPerYear,
            },
            impairmentGracePeriod: BigInt(impairmentGracePeriod),
            expiresAt: BigInt(expiresAt),
            description,
            callbackContract: yield* validateAddress(callbackContract),
            callbackSelector: yield* validateCallbackSelector(callbackSelector),
        };
    });

/** Validate and parse raw CLI inputs into RejectLoanOfferParams (pure). */
export const validateRejectLoanOfferParams = (
    chain: Option.Option<number>,
    offerId: string,
): Either.Either<RejectLoanOfferParams, InvalidChainError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            offerId: BigInt(offerId),
        };
    });

/** Validate and parse raw CLI inputs into AcceptLoanParams (pure). */
export const validateAcceptLoanParams = (
    chain: Option.Option<number>,
    offerId: string,
    receiver: string | undefined,
): Either.Either<AcceptLoanParams, ValidationError> =>
    Either.gen(function* () {
        const chainId = yield* validateChainId(chain);
        const base = { chainId, offerId: BigInt(offerId) };
        if (receiver) {
            return { ...base, receiver: yield* validateAddress(receiver) };
        }
        return base;
    });

/** Validate and parse raw CLI inputs into PayLoanParams (pure). */
export const validatePayLoanParams = (
    chain: Option.Option<number>,
    claimId: number,
    paymentAmount: string,
): Either.Either<PayLoanParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            claimId: BigInt(claimId),
            paymentAmount: yield* validateAmount(paymentAmount),
        };
    });

/** Validate and parse raw CLI inputs into LoanOperationParams for impair (pure). */
export const validateImpairLoanParams = (chain: Option.Option<number>, claimId: number): Either.Either<LoanOperationParams, InvalidChainError> =>
    Either.gen(function* () {
        return { chainId: yield* validateChainId(chain), claimId: BigInt(claimId) };
    });

/** Validate and parse raw CLI inputs into LoanOperationParams for mark-paid (pure). */
export const validateMarkLoanAsPaidParams = (chain: Option.Option<number>, claimId: number): Either.Either<LoanOperationParams, InvalidChainError> =>
    Either.gen(function* () {
        return { chainId: yield* validateChainId(chain), claimId: BigInt(claimId) };
    });

/** Validate and parse raw CLI inputs into SetLoanCallbackParams (pure). */
export const validateSetLoanCallbackParams = (
    chain: Option.Option<number>,
    loanId: number,
    callbackContract: string,
    callbackSelector: string,
): Either.Either<SetLoanCallbackParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            loanId: BigInt(loanId),
            callbackContract: yield* validateAddress(callbackContract),
            callbackSelector: yield* validateCallbackSelector(callbackSelector),
        };
    });
