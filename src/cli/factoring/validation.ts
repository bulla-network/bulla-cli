import { Either } from 'effect';
import type { InvalidAddressError, InvalidAmountError, InvalidChainError } from '../../domain/errors.js';
import type {
    ApproveInvoiceParams,
    CancelQueuedRedemptionParams,
    DepositParams,
    FundInvoiceParams,
    PoolOfferLoanParams,
    RedeemParams,
    UnfactorInvoiceParams,
    WithdrawParams,
} from '../../domain/types/factoring.js';
import { validateAddress, validateAmount, validateChainId } from '../../domain/validation/eth.js';

type ValidationError = InvalidChainError | InvalidAddressError | InvalidAmountError;

export const validateDepositParams = (
    chain: number,
    poolAddress: string,
    assets: string,
    receiver: string,
): Either.Either<DepositParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            assets: yield* validateAmount(assets),
            receiver: yield* validateAddress(receiver),
        };
    });

export const validateRedeemParams = (
    chain: number,
    poolAddress: string,
    shares: string,
    receiver: string,
    owner: string,
): Either.Either<RedeemParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            shares: yield* validateAmount(shares),
            receiver: yield* validateAddress(receiver),
            owner: yield* validateAddress(owner),
        };
    });

export const validateWithdrawParams = (
    chain: number,
    poolAddress: string,
    assets: string,
    receiver: string,
    owner: string,
): Either.Either<WithdrawParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            assets: yield* validateAmount(assets),
            receiver: yield* validateAddress(receiver),
            owner: yield* validateAddress(owner),
        };
    });

export const validateApproveInvoiceParams = (
    chain: number,
    poolAddress: string,
    invoiceId: string,
    targetYieldBps: number,
    spreadBps: number,
    upfrontBps: number,
    initialInvoiceValueOverride: string,
): Either.Either<ApproveInvoiceParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            invoiceId: BigInt(invoiceId),
            targetYieldBps,
            spreadBps,
            upfrontBps,
            initialInvoiceValueOverride: BigInt(initialInvoiceValueOverride),
        };
    });

export const validateFundInvoiceParams = (
    chain: number,
    poolAddress: string,
    invoiceId: string,
    factorerUpfrontBps: number,
    receiverAddress: string,
): Either.Either<FundInvoiceParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            invoiceId: BigInt(invoiceId),
            factorerUpfrontBps,
            receiverAddress: yield* validateAddress(receiverAddress),
        };
    });

export const validateUnfactorInvoiceParams = (
    chain: number,
    poolAddress: string,
    invoiceId: string,
): Either.Either<UnfactorInvoiceParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            invoiceId: BigInt(invoiceId),
        };
    });

export const validateOfferLoanParams = (
    chain: number,
    poolAddress: string,
    debtor: string,
    targetYieldBps: number,
    spreadBps: number,
    principalAmount: string,
    termLength: number,
    numberOfPeriodsPerYear: number,
    description: string,
): Either.Either<PoolOfferLoanParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            debtor: yield* validateAddress(debtor),
            targetYieldBps,
            spreadBps,
            principalAmount: yield* validateAmount(principalAmount),
            termLength: BigInt(termLength),
            numberOfPeriodsPerYear,
            description,
        };
    });

export const validateCancelQueuedRedemptionParams = (
    chain: number,
    poolAddress: string,
    owner: string,
): Either.Either<CancelQueuedRedemptionParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            poolAddress: yield* validateAddress(poolAddress),
            owner: yield* validateAddress(owner),
        };
    });
