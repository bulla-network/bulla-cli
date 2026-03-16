import { Either, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { CreateClaimApprovalType } from '../../../src/domain/types/approve.js';
import {
    validateApproveCreateClaimParams,
    validateApproveErc20Params,
    validateApproveNftParams,
} from '../../../src/cli/approve/validation.js';

const VALID_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const VALID_CHAIN = 11155111;

describe('validateApproveCreateClaimParams', () => {
    it('accepts valid params with default approval type', () => {
        const result = validateApproveCreateClaimParams(
            Option.some(VALID_CHAIN),
            VALID_ADDRESS,
            'approved',
            '10',
            false,
        );

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.chainId).toBe(VALID_CHAIN);
            expect(result.right.controller).toBe(VALID_ADDRESS);
            expect(result.right.approvalType).toBe(CreateClaimApprovalType.Approved);
            expect(result.right.approvalCount).toBe(10n);
            expect(result.right.isBindingAllowed).toBe(false);
        }
    });

    it('maps all approval type strings correctly', () => {
        const cases: Array<[string, CreateClaimApprovalType]> = [
            ['unapproved', CreateClaimApprovalType.Unapproved],
            ['creditor-only', CreateClaimApprovalType.CreditorOnly],
            ['debtor-only', CreateClaimApprovalType.DebtorOnly],
            ['approved', CreateClaimApprovalType.Approved],
        ];

        for (const [input, expected] of cases) {
            const result = validateApproveCreateClaimParams(
                Option.some(VALID_CHAIN),
                VALID_ADDRESS,
                input,
                '1',
                false,
            );
            expect(Either.isRight(result)).toBe(true);
            if (Either.isRight(result)) {
                expect(result.right.approvalType).toBe(expected);
            }
        }
    });

    it('rejects invalid approval type', () => {
        const result = validateApproveCreateClaimParams(
            Option.some(VALID_CHAIN),
            VALID_ADDRESS,
            'invalid-type',
            '1',
            false,
        );
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid chain ID', () => {
        const result = validateApproveCreateClaimParams(
            Option.some(999),
            VALID_ADDRESS,
            'approved',
            '1',
            false,
        );
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid controller address', () => {
        const result = validateApproveCreateClaimParams(
            Option.some(VALID_CHAIN),
            'not-an-address',
            'approved',
            '1',
            false,
        );
        expect(Either.isLeft(result)).toBe(true);
    });

    it('accepts binding allowed flag', () => {
        const result = validateApproveCreateClaimParams(
            Option.some(VALID_CHAIN),
            VALID_ADDRESS,
            'approved',
            '5',
            true,
        );

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.isBindingAllowed).toBe(true);
        }
    });

    it('supports large approval counts', () => {
        const maxUint64 = '18446744073709551615';
        const result = validateApproveCreateClaimParams(
            Option.some(VALID_CHAIN),
            VALID_ADDRESS,
            'approved',
            maxUint64,
            false,
        );

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.approvalCount).toBe(BigInt(maxUint64));
        }
    });
});

describe('validateApproveNftParams', () => {
    it('accepts valid params', () => {
        const result = validateApproveNftParams(
            Option.some(VALID_CHAIN),
            VALID_ADDRESS,
            '42',
        );

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.chainId).toBe(VALID_CHAIN);
            expect(result.right.to).toBe(VALID_ADDRESS);
            expect(result.right.claimId).toBe(42n);
        }
    });

    it('rejects invalid chain ID', () => {
        const result = validateApproveNftParams(Option.some(0), VALID_ADDRESS, '1');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid to address', () => {
        const result = validateApproveNftParams(Option.some(VALID_CHAIN), 'bad', '1');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid claim ID', () => {
        const result = validateApproveNftParams(Option.some(VALID_CHAIN), VALID_ADDRESS, '-1');
        expect(Either.isLeft(result)).toBe(true);
    });
});

describe('validateApproveErc20Params', () => {
    it('accepts valid params', () => {
        const result = validateApproveErc20Params(
            Option.some(VALID_CHAIN),
            VALID_ADDRESS,
            VALID_ADDRESS,
            '1000000',
        );

        expect(Either.isRight(result)).toBe(true);
        if (Either.isRight(result)) {
            expect(result.right.chainId).toBe(VALID_CHAIN);
            expect(result.right.token).toBe(VALID_ADDRESS);
            expect(result.right.spender).toBe(VALID_ADDRESS);
            expect(result.right.amount).toBe(1000000n);
        }
    });

    it('rejects invalid chain ID', () => {
        const result = validateApproveErc20Params(Option.some(999), VALID_ADDRESS, VALID_ADDRESS, '1000');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid token address', () => {
        const result = validateApproveErc20Params(Option.some(VALID_CHAIN), 'bad', VALID_ADDRESS, '1000');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid spender address', () => {
        const result = validateApproveErc20Params(Option.some(VALID_CHAIN), VALID_ADDRESS, '0xZZZ', '1000');
        expect(Either.isLeft(result)).toBe(true);
    });

    it('rejects invalid amount', () => {
        const result = validateApproveErc20Params(Option.some(VALID_CHAIN), VALID_ADDRESS, VALID_ADDRESS, '-1');
        expect(Either.isLeft(result)).toBe(true);
    });
});
