import { Either, Option } from 'effect';
import type { InvalidAddressError, InvalidAmountError, InvalidCallbackSelectorError, InvalidChainError } from '../../domain/errors.js';
import { InvalidBindingError } from '../../domain/errors.js';
import type {
    AcceptPurchaseOrderParams,
    CancelInvoiceParams,
    ClaimBinding,
    CreateInvoiceParams,
    InvoiceOperationParams,
    PayInvoiceParams,
    SetCallbackParams,
    UpdateBindingParams,
} from '../../domain/types/invoice.js';
import {
    validateAddress,
    validateAmount,
    validateAmountOrZero,
    validateCallbackSelector,
    validateChainId,
} from '../../domain/validation/eth.js';

type ValidationError = InvalidChainError | InvalidAddressError | InvalidAmountError | InvalidBindingError | InvalidCallbackSelectorError;

const validateBinding = (binding: number): Either.Either<ClaimBinding, InvalidBindingError> =>
    binding >= 0 && binding <= 2
        ? Either.right(binding as ClaimBinding)
        : Either.left(
              new InvalidBindingError({
                  binding,
                  message: `Invalid binding value: ${binding}. Must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)`,
              }),
          );

/** Validate and parse raw CLI inputs into CreateInvoiceParams (pure). */
export const validateCreateInvoiceParams = (
    chain: Option.Option<number>,
    debtor: string,
    creditor: string,
    claimAmount: string,
    token: string,
    dueBy: number,
    deliveryDate: number,
    description: string,
    binding: number,
    interestRateBps: number,
    periodsPerYear: number,
    impairmentGracePeriod: number,
    depositAmount: string,
): Either.Either<CreateInvoiceParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            debtor: yield* validateAddress(debtor),
            creditor: yield* validateAddress(creditor),
            claimAmount: yield* validateAmount(claimAmount),
            token: yield* validateAddress(token),
            dueBy: BigInt(dueBy),
            deliveryDate: BigInt(deliveryDate),
            description,
            binding: yield* validateBinding(binding),
            lateFeeConfig: {
                interestRateBps,
                numberOfPeriodsPerYear: periodsPerYear,
            },
            impairmentGracePeriod: BigInt(impairmentGracePeriod),
            depositAmount: yield* validateAmountOrZero(depositAmount),
        };
    });

/** Validate and parse raw CLI inputs into PayInvoiceParams (pure). */
export const validatePayInvoiceParams = (
    chain: Option.Option<number>,
    claimId: number,
    paymentAmount: string,
): Either.Either<PayInvoiceParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            claimId: BigInt(claimId),
            paymentAmount: yield* validateAmount(paymentAmount),
        };
    });

/** Validate and parse raw CLI inputs into CancelInvoiceParams (pure). */
export const validateCancelInvoiceParams = (
    chain: Option.Option<number>,
    claimId: number,
    note: string,
): Either.Either<CancelInvoiceParams, InvalidChainError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            claimId: BigInt(claimId),
            note: note.trim(),
        };
    });

/** Validate and parse raw CLI inputs into InvoiceOperationParams for impair (pure). */
export const validateImpairInvoiceParams = (chain: Option.Option<number>, claimId: number): Either.Either<InvoiceOperationParams, InvalidChainError> =>
    Either.gen(function* () {
        return { chainId: yield* validateChainId(chain), claimId: BigInt(claimId) };
    });

/** Validate and parse raw CLI inputs into InvoiceOperationParams for mark-paid (pure). */
export const validateMarkInvoiceAsPaidParams = (chain: Option.Option<number>, claimId: number): Either.Either<InvoiceOperationParams, InvalidChainError> =>
    Either.gen(function* () {
        return { chainId: yield* validateChainId(chain), claimId: BigInt(claimId) };
    });

/** Validate and parse raw CLI inputs into UpdateBindingParams (pure). */
export const validateUpdateBindingParams = (
    chain: Option.Option<number>,
    claimId: number,
    binding: number,
): Either.Either<UpdateBindingParams, InvalidChainError | InvalidBindingError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            claimId: BigInt(claimId),
            binding: yield* validateBinding(binding),
        };
    });

/** Validate and parse raw CLI inputs into SetCallbackParams (pure). */
export const validateSetPaidInvoiceCallbackParams = (
    chain: Option.Option<number>,
    invoiceId: number,
    callbackContract: string,
    callbackSelector: string,
): Either.Either<SetCallbackParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            invoiceId: BigInt(invoiceId),
            callbackContract: yield* validateAddress(callbackContract),
            callbackSelector: yield* validateCallbackSelector(callbackSelector),
        };
    });

/** Validate and parse raw CLI inputs into AcceptPurchaseOrderParams (pure). */
export const validateAcceptPurchaseOrderParams = (
    chain: Option.Option<number>,
    claimId: number,
    depositAmount: string,
): Either.Either<AcceptPurchaseOrderParams, InvalidChainError | InvalidAmountError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            claimId: BigInt(claimId),
            depositAmount: yield* validateAmountOrZero(depositAmount),
        };
    });

/** Validate and parse raw CLI inputs into InvoiceOperationParams for deliver-po (pure). */
export const validateDeliverPurchaseOrderParams = (
    chain: Option.Option<number>,
    claimId: number,
): Either.Either<InvoiceOperationParams, InvalidChainError> =>
    Either.gen(function* () {
        return { chainId: yield* validateChainId(chain), claimId: BigInt(claimId) };
    });
