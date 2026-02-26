import { Either } from 'effect';
import { describe, expect, it } from 'vitest';
import {
    validateCreateInvoiceParams,
    validatePayInvoiceParams,
    validateCancelInvoiceParams,
    validateUpdateBindingParams,
    validateSetCallbackParams,
    validateInvoiceOperationParams,
} from '../../../src/domain/validation/invoice.js';
import type {
    CreateInvoiceParams,
    PayInvoiceParams,
    CancelInvoiceParams,
    UpdateBindingParams,
    SetCallbackParams,
    InvoiceOperationParams,
} from '../../../src/domain/types/invoice.js';
import { ClaimBinding } from '../../../src/domain/types/invoice.js';
import type { EthAddress, ChainId } from '../../../src/domain/types/eth.js';
import { ZERO_ADDRESS } from '../../../src/domain/types/token.js';

const makeCreateInvoiceParams = (overrides: Partial<CreateInvoiceParams> = {}): CreateInvoiceParams => ({
    chainId: 11155111 as ChainId,
    debtor: '0x1234567890abcdef1234567890abcdef12345678' as EthAddress,
    creditor: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EthAddress,
    claimAmount: 1000000000000000000n,
    token: ZERO_ADDRESS,
    dueBy: 0n,
    deliveryDate: 0n,
    description: 'Test invoice',
    binding: ClaimBinding.Unbound,
    lateFeeConfig: {
        interestRateBps: 0,
        numberOfPeriodsPerYear: 0,
    },
    impairmentGracePeriod: 0n,
    depositAmount: 0n,
    ...overrides,
});

const makePayInvoiceParams = (overrides: Partial<PayInvoiceParams> = {}): PayInvoiceParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    paymentAmount: 1000000000000000000n,
    ...overrides,
});

const makeCancelInvoiceParams = (overrides: Partial<CancelInvoiceParams> = {}): CancelInvoiceParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    note: 'Cancellation note',
    ...overrides,
});

const makeUpdateBindingParams = (overrides: Partial<UpdateBindingParams> = {}): UpdateBindingParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    binding: ClaimBinding.Unbound,
    ...overrides,
});

const makeSetCallbackParams = (overrides: Partial<SetCallbackParams> = {}): SetCallbackParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    callbackContract: '0x1234567890abcdef1234567890abcdef12345678' as EthAddress,
    callbackSelector: '0x12345678',
    ...overrides,
});

const makeInvoiceOperationParams = (overrides: Partial<InvoiceOperationParams> = {}): InvoiceOperationParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    ...overrides,
});

describe('validateCreateInvoiceParams', () => {
    it('accepts valid params', () => {
        const result = validateCreateInvoiceParams(makeCreateInvoiceParams());
        expect(Either.isRight(result)).toBe(true);
    });

    it('rejects zero claim amount', () => {
        const result = validateCreateInvoiceParams(makeCreateInvoiceParams({ claimAmount: 0n }));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Claim amount must be greater than zero');
        }
    });

    it('rejects negative claim amount', () => {
        const result = validateCreateInvoiceParams(makeCreateInvoiceParams({ claimAmount: -1n }));
        expect(Either.isLeft(result)).toBe(true);
    });

    it('accepts zero deposit amount', () => {
        const result = validateCreateInvoiceParams(makeCreateInvoiceParams({ depositAmount: 0n }));
        expect(Either.isRight(result)).toBe(true);
    });

    it('rejects negative deposit amount', () => {
        const result = validateCreateInvoiceParams(makeCreateInvoiceParams({ depositAmount: -1n }));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Deposit amount must be non-negative');
        }
    });

    it('accepts all valid binding values', () => {
        expect(Either.isRight(validateCreateInvoiceParams(makeCreateInvoiceParams({ binding: ClaimBinding.Unbound })))).toBe(true);
        expect(Either.isRight(validateCreateInvoiceParams(makeCreateInvoiceParams({ binding: ClaimBinding.BindingPending })))).toBe(
            true,
        );
        expect(Either.isRight(validateCreateInvoiceParams(makeCreateInvoiceParams({ binding: ClaimBinding.Bound })))).toBe(true);
    });

    it('rejects invalid binding values', () => {
        const result = validateCreateInvoiceParams(makeCreateInvoiceParams({ binding: 3 as ClaimBinding }));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Binding must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)');
        }
    });

    it('rejects negative interest rate', () => {
        const result = validateCreateInvoiceParams(
            makeCreateInvoiceParams({ lateFeeConfig: { interestRateBps: -1, numberOfPeriodsPerYear: 12 } }),
        );
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Interest rate must be non-negative');
        }
    });

    it('rejects negative periods per year', () => {
        const result = validateCreateInvoiceParams(
            makeCreateInvoiceParams({ lateFeeConfig: { interestRateBps: 500, numberOfPeriodsPerYear: -1 } }),
        );
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Periods per year must be non-negative');
        }
    });

    it('accepts zero interest rate (no interest)', () => {
        const result = validateCreateInvoiceParams(
            makeCreateInvoiceParams({ lateFeeConfig: { interestRateBps: 0, numberOfPeriodsPerYear: 0 } }),
        );
        expect(Either.isRight(result)).toBe(true);
    });

    it('accepts simple interest (periods per year = 0)', () => {
        const result = validateCreateInvoiceParams(
            makeCreateInvoiceParams({ lateFeeConfig: { interestRateBps: 500, numberOfPeriodsPerYear: 0 } }),
        );
        expect(Either.isRight(result)).toBe(true);
    });

    it('rejects negative impairment grace period', () => {
        const result = validateCreateInvoiceParams(makeCreateInvoiceParams({ impairmentGracePeriod: -1n }));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Impairment grace period must be non-negative');
        }
    });
});

describe('validatePayInvoiceParams', () => {
    it('accepts valid params', () => {
        const result = validatePayInvoiceParams(makePayInvoiceParams());
        expect(Either.isRight(result)).toBe(true);
    });

    it('rejects zero payment amount', () => {
        const result = validatePayInvoiceParams(makePayInvoiceParams({ paymentAmount: 0n }));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Payment amount must be greater than zero');
        }
    });

    it('rejects negative payment amount', () => {
        const result = validatePayInvoiceParams(makePayInvoiceParams({ paymentAmount: -1n }));
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateCancelInvoiceParams', () => {
    it('accepts valid params', () => {
        const result = validateCancelInvoiceParams(makeCancelInvoiceParams());
        expect(Either.isRight(result)).toBe(true);
    });

    it('accepts empty note', () => {
        const result = validateCancelInvoiceParams(makeCancelInvoiceParams({ note: '' }));
        expect(Either.isRight(result)).toBe(true);
    });
});

describe('validateUpdateBindingParams', () => {
    it('accepts valid params', () => {
        const result = validateUpdateBindingParams(makeUpdateBindingParams());
        expect(Either.isRight(result)).toBe(true);
    });

    it('accepts all valid binding values', () => {
        expect(Either.isRight(validateUpdateBindingParams(makeUpdateBindingParams({ binding: ClaimBinding.Unbound })))).toBe(true);
        expect(Either.isRight(validateUpdateBindingParams(makeUpdateBindingParams({ binding: ClaimBinding.BindingPending })))).toBe(
            true,
        );
        expect(Either.isRight(validateUpdateBindingParams(makeUpdateBindingParams({ binding: ClaimBinding.Bound })))).toBe(true);
    });

    it('rejects invalid binding values', () => {
        const result = validateUpdateBindingParams(makeUpdateBindingParams({ binding: -1 as ClaimBinding }));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Binding must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)');
        }
    });
});

describe('validateSetCallbackParams', () => {
    it('accepts valid params', () => {
        const result = validateSetCallbackParams(makeSetCallbackParams());
        expect(Either.isRight(result)).toBe(true);
    });

    it('accepts valid 4-byte hex selector', () => {
        const result = validateSetCallbackParams(makeSetCallbackParams({ callbackSelector: '0xabcdef12' }));
        expect(Either.isRight(result)).toBe(true);
    });

    it('rejects selector without 0x prefix', () => {
        const result = validateSetCallbackParams(makeSetCallbackParams({ callbackSelector: '12345678' }));
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
            expect(result.left).toBe('Callback selector must be a 4-byte hex string (e.g., 0x12345678)');
        }
    });

    it('rejects selector with wrong length', () => {
        const result = validateSetCallbackParams(makeSetCallbackParams({ callbackSelector: '0x1234' }));
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects selector with non-hex characters', () => {
        const result = validateSetCallbackParams(makeSetCallbackParams({ callbackSelector: '0xghijklmn' }));
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateInvoiceOperationParams', () => {
    it('accepts valid params', () => {
        const result = validateInvoiceOperationParams(makeInvoiceOperationParams());
        expect(Either.isRight(result)).toBe(true);
    });
});
