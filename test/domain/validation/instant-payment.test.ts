import { Either } from 'effect';
import { describe, expect, it } from 'vitest';
import { formatTags, validateInstantPaymentParams } from '../../../src/domain/validation/instant-payment.js';
import type { InstantPaymentParams } from '../../../src/domain/types/instant-payment.js';
import type { EthAddress, ChainId } from '../../../src/domain/types/eth.js';

const makeParams = (overrides: Partial<InstantPaymentParams> = {}): InstantPaymentParams => ({
    chainId: 11155111 as ChainId,
    to: '0x1234567890abcdef1234567890abcdef12345678' as EthAddress,
    amount: 1000000000000000000n,
    tokenAddress: '0x0000000000000000000000000000000000000000' as EthAddress,
    description: 'Test payment',
    tags: ['test'],
    ipfsHash: '',
    ...overrides,
});

describe('formatTags', () => {
    it('joins multiple tags with TAG_SEPARATOR', () => {
        expect(formatTags(['consulting', 'Q4'])).toBe('consulting%>%Q4');
    });

    it('trims whitespace from tags', () => {
        expect(formatTags([' foo ', ' bar '])).toBe('foo%>%bar');
    });

    it('filters out empty tags', () => {
        expect(formatTags(['foo', '', '  ', 'bar'])).toBe('foo%>%bar');
    });

    it('returns empty string for no tags', () => {
        expect(formatTags([])).toBe('');
    });

    it('returns single tag without separator', () => {
        expect(formatTags(['solo'])).toBe('solo');
    });
});

describe('validateInstantPaymentParams', () => {
    it('accepts valid params', () => {
        const result = validateInstantPaymentParams(makeParams());
        expect(Either.isRight(result)).toBe(true);
    });

    it('rejects zero amount', () => {
        const result = validateInstantPaymentParams(makeParams({ amount: 0n }));
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects negative amount', () => {
        const result = validateInstantPaymentParams(makeParams({ amount: -1n }));
        expect(Either.isLeft(result)).toBe(true);
    });
});
