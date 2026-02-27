import { Either } from 'effect';
import { describe, expect, it } from 'vitest';
import { validateAcceptLoanParams, validateRejectLoanOfferParams } from '../../../src/cli/frendlend/validation.js';

describe('validateRejectLoanOfferParams', () => {
    it('supports large uint256 offer IDs', () => {
        const largeOfferId = '4803626873379322681222145724281499628871371019647096745734765865232245189036';
        const result = validateRejectLoanOfferParams(11155111, largeOfferId);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.offerId).toBe(BigInt(largeOfferId));
            expect(result.right.chainId).toBe(11155111);
        }
    });

    it('supports small offer IDs', () => {
        const result = validateRejectLoanOfferParams(11155111, '1');

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.offerId).toBe(1n);
        }
    });

    it('rejects invalid chain ID', () => {
        const result = validateRejectLoanOfferParams(999, '1');

        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateAcceptLoanParams', () => {
    it('supports large uint256 offer IDs', () => {
        const largeOfferId = '4803626873379322681222145724281499628871371019647096745734765865232245189036';
        const result = validateAcceptLoanParams(11155111, largeOfferId, undefined);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.offerId).toBe(BigInt(largeOfferId));
        }
    });

    it('supports large uint256 offer IDs with receiver', () => {
        const largeOfferId = '4803626873379322681222145724281499628871371019647096745734765865232245189036';
        const receiver = '0x1234567890abcdef1234567890abcdef12345678';
        const result = validateAcceptLoanParams(11155111, largeOfferId, receiver);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.offerId).toBe(BigInt(largeOfferId));
            expect(result.right.receiver).toBeDefined();
        }
    });
});
