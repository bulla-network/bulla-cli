import { Either } from 'effect';
import type {
    CreateInvoiceParams,
    PayInvoiceParams,
    CancelInvoiceParams,
    UpdateBindingParams,
    SetCallbackParams,
    InvoiceOperationParams,
} from '../types/invoice.js';

/** Validate that create invoice params are well-formed (pure). */
export const validateCreateInvoiceParams = (params: CreateInvoiceParams): Either.Either<CreateInvoiceParams, string> => {
    if (params.claimAmount <= 0n) {
        return Either.left('Claim amount must be greater than zero');
    }
    if (params.depositAmount < 0n) {
        return Either.left('Deposit amount must be non-negative');
    }
    if (params.binding < 0 || params.binding > 2) {
        return Either.left('Binding must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)');
    }
    if (params.lateFeeConfig.interestRateBps < 0) {
        return Either.left('Interest rate must be non-negative');
    }
    if (params.lateFeeConfig.numberOfPeriodsPerYear < 0) {
        return Either.left('Periods per year must be non-negative');
    }
    if (params.impairmentGracePeriod < 0n) {
        return Either.left('Impairment grace period must be non-negative');
    }
    return Either.right(params);
};

/** Validate that pay invoice params are well-formed (pure). */
export const validatePayInvoiceParams = (params: PayInvoiceParams): Either.Either<PayInvoiceParams, string> => {
    if (params.paymentAmount <= 0n) {
        return Either.left('Payment amount must be greater than zero');
    }
    return Either.right(params);
};

/** Validate that cancel invoice params are well-formed (pure). */
export const validateCancelInvoiceParams = (params: CancelInvoiceParams): Either.Either<CancelInvoiceParams, string> => {
    // Note is optional, no specific validation needed beyond type checking
    return Either.right(params);
};

/** Validate that update binding params are well-formed (pure). */
export const validateUpdateBindingParams = (params: UpdateBindingParams): Either.Either<UpdateBindingParams, string> => {
    if (params.binding < 0 || params.binding > 2) {
        return Either.left('Binding must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)');
    }
    return Either.right(params);
};

/** Validate that set callback params are well-formed (pure). */
export const validateSetCallbackParams = (params: SetCallbackParams): Either.Either<SetCallbackParams, string> => {
    // Callback selector should be 4 bytes (0x + 8 hex chars)
    if (!/^0x[0-9a-fA-F]{8}$/.test(params.callbackSelector)) {
        return Either.left('Callback selector must be a 4-byte hex string (e.g., 0x12345678)');
    }
    return Either.right(params);
};

/** Validate that invoice operation params are well-formed (pure). */
export const validateInvoiceOperationParams = (params: InvoiceOperationParams): Either.Either<InvoiceOperationParams, string> => {
    // No specific validation needed for simple operations (impair, mark paid, deliver PO)
    return Either.right(params);
};
