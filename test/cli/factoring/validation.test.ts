import { Either } from 'effect';
import { describe, expect, it } from 'vitest';
import {
    validateApproveInvoiceParams,
    validateCancelQueuedRedemptionParams,
    validateDepositParams,
    validateFundInvoiceParams,
    validateOfferLoanParams,
    validateRedeemParams,
    validateUnfactorInvoiceParams,
    validateWithdrawParams,
} from '../../../src/cli/factoring/validation.js';

const VALID_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const VALID_POOL = '0xa5e94f122d421c9579a5cb1e687f55e109ba270b';
const VALID_CHAIN = 11155111;

describe('validateDepositParams', () => {
    it('accepts valid params', () => {
        const result = validateDepositParams(VALID_CHAIN, VALID_POOL, '1000000', VALID_ADDRESS);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.chainId).toBe(VALID_CHAIN);
            expect(result.right.poolAddress).toBe(VALID_POOL);
            expect(result.right.assets).toBe(1000000n);
            expect(result.right.receiver).toBe(VALID_ADDRESS);
        }
    });

    it('rejects invalid chain ID', () => {
        const result = validateDepositParams(999, VALID_POOL, '1000000', VALID_ADDRESS);
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid pool address', () => {
        const result = validateDepositParams(VALID_CHAIN, 'not-an-address', '1000000', VALID_ADDRESS);
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid amount', () => {
        const result = validateDepositParams(VALID_CHAIN, VALID_POOL, '-1', VALID_ADDRESS);
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid receiver address', () => {
        const result = validateDepositParams(VALID_CHAIN, VALID_POOL, '1000000', 'bad');
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateRedeemParams', () => {
    it('accepts valid params', () => {
        const result = validateRedeemParams(VALID_CHAIN, VALID_POOL, '500', VALID_ADDRESS, VALID_ADDRESS);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.shares).toBe(500n);
            expect(result.right.receiver).toBe(VALID_ADDRESS);
            expect(result.right.owner).toBe(VALID_ADDRESS);
        }
    });

    it('rejects invalid chain ID', () => {
        const result = validateRedeemParams(0, VALID_POOL, '500', VALID_ADDRESS, VALID_ADDRESS);
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid owner address', () => {
        const result = validateRedeemParams(VALID_CHAIN, VALID_POOL, '500', VALID_ADDRESS, 'bad');
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateWithdrawParams', () => {
    it('accepts valid params', () => {
        const result = validateWithdrawParams(VALID_CHAIN, VALID_POOL, '1000', VALID_ADDRESS, VALID_ADDRESS);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.assets).toBe(1000n);
        }
    });

    it('rejects invalid amount', () => {
        const result = validateWithdrawParams(VALID_CHAIN, VALID_POOL, 'abc', VALID_ADDRESS, VALID_ADDRESS);
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateApproveInvoiceParams', () => {
    it('accepts valid params', () => {
        const result = validateApproveInvoiceParams(VALID_CHAIN, VALID_POOL, '42', 800, 100, 50, '0');

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.invoiceId).toBe(42n);
            expect(result.right.targetYieldBps).toBe(800);
            expect(result.right.spreadBps).toBe(100);
            expect(result.right.upfrontBps).toBe(50);
            expect(result.right.initialInvoiceValueOverride).toBe(0n);
        }
    });

    it('supports large uint256 invoice IDs', () => {
        const largeId = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        const result = validateApproveInvoiceParams(VALID_CHAIN, VALID_POOL, largeId, 800, 100, 50, '0');

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.invoiceId).toBe(BigInt(largeId));
        }
    });

    it('rejects invalid chain ID', () => {
        const result = validateApproveInvoiceParams(999, VALID_POOL, '42', 800, 100, 50, '0');
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateFundInvoiceParams', () => {
    it('accepts valid params', () => {
        const result = validateFundInvoiceParams(VALID_CHAIN, VALID_POOL, '1', 100, VALID_ADDRESS);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.invoiceId).toBe(1n);
            expect(result.right.factorerUpfrontBps).toBe(100);
            expect(result.right.receiverAddress).toBe(VALID_ADDRESS);
        }
    });

    it('rejects invalid receiver address', () => {
        const result = validateFundInvoiceParams(VALID_CHAIN, VALID_POOL, '1', 100, 'bad');
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateUnfactorInvoiceParams', () => {
    it('accepts valid params', () => {
        const result = validateUnfactorInvoiceParams(VALID_CHAIN, VALID_POOL, '99');

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.invoiceId).toBe(99n);
        }
    });

    it('rejects invalid pool address', () => {
        const result = validateUnfactorInvoiceParams(VALID_CHAIN, '0xinvalid', '99');
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateOfferLoanParams', () => {
    it('accepts valid params', () => {
        const result = validateOfferLoanParams(
            VALID_CHAIN,
            VALID_POOL,
            VALID_ADDRESS,
            800,
            100,
            '1000000000000000000',
            2592000,
            12,
            'Test loan',
        );

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.debtor).toBe(VALID_ADDRESS);
            expect(result.right.targetYieldBps).toBe(800);
            expect(result.right.spreadBps).toBe(100);
            expect(result.right.principalAmount).toBe(1000000000000000000n);
            expect(result.right.termLength).toBe(2592000n);
            expect(result.right.numberOfPeriodsPerYear).toBe(12);
            expect(result.right.description).toBe('Test loan');
        }
    });

    it('rejects invalid debtor address', () => {
        const result = validateOfferLoanParams(VALID_CHAIN, VALID_POOL, 'bad', 800, 100, '1000000', 2592000, 12, 'Test');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid principal amount', () => {
        const result = validateOfferLoanParams(VALID_CHAIN, VALID_POOL, VALID_ADDRESS, 800, 100, '-1', 2592000, 12, 'Test');
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateCancelQueuedRedemptionParams', () => {
    it('accepts valid params', () => {
        const result = validateCancelQueuedRedemptionParams(VALID_CHAIN, VALID_POOL, VALID_ADDRESS);

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.chainId).toBe(VALID_CHAIN);
            expect(result.right.poolAddress).toBe(VALID_POOL);
            expect(result.right.owner).toBe(VALID_ADDRESS);
        }
    });

    it('rejects invalid chain ID', () => {
        const result = validateCancelQueuedRedemptionParams(999, VALID_POOL, VALID_ADDRESS);
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid owner address', () => {
        const result = validateCancelQueuedRedemptionParams(VALID_CHAIN, VALID_POOL, '0xZZZ');
        expect(Either.isLeft(result)).toBe(true);
    });
});
