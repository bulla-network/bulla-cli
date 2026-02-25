import { Either } from 'effect';
import { describe, expect, it } from 'vitest';
import { validateAddress, validateAmount } from '../../../src/domain/validation/eth.js';

describe('validateAddress', () => {
    it('accepts a valid lowercase address', () => {
        const result = validateAddress('0x1234567890abcdef1234567890abcdef12345678');
        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right).toBe('0x1234567890abcdef1234567890abcdef12345678');
        }
    });

    it('accepts a valid checksummed address and lowercases it', () => {
        const result = validateAddress('0xec6013D62Af8dfB65B8248204Dd1913d2f1F0181');
        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right).toBe('0xec6013d62af8dfb65b8248204dd1913d2f1f0181');
        }
    });

    it('rejects an address without 0x prefix', () => {
        const result = validateAddress('1234567890abcdef1234567890abcdef12345678');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects an address that is too short', () => {
        const result = validateAddress('0x1234');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects an address with invalid hex characters', () => {
        const result = validateAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects an empty string', () => {
        const result = validateAddress('');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('accepts the zero address', () => {
        const result = validateAddress('0x0000000000000000000000000000000000000000');
        expect(Either.isRight(result)).toBe(true);
    });
});

describe('validateAmount', () => {
    it('accepts a valid positive integer string', () => {
        const result = validateAmount('1000000000000000000');
        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right).toBe(1000000000000000000n);
        }
    });

    it('accepts "1"', () => {
        const result = validateAmount('1');
        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right).toBe(1n);
        }
    });

    it('rejects "0"', () => {
        const result = validateAmount('0');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects negative amounts', () => {
        const result = validateAmount('-100');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects non-numeric strings', () => {
        const result = validateAmount('abc');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects decimal strings', () => {
        const result = validateAmount('1.5');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects empty string', () => {
        const result = validateAmount('');
        expect(Either.isLeft(result)).toBe(true);
    });
});
