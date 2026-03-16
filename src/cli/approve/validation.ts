import { Either, Option } from 'effect';
import type { InvalidAddressError, InvalidAmountError, InvalidChainError } from '../../domain/errors.js';
import { CreateClaimApprovalType, type ApproveCreateClaimParams, type ApproveErc20Params, type ApproveNftParams } from '../../domain/types/approve.js';
import { validateAddress, validateAmount, validateChainId } from '../../domain/validation/eth.js';

export class InvalidApprovalTypeError {
    readonly _tag = 'InvalidApprovalTypeError' as const;
    constructor(readonly approvalType: string, readonly message: string) {}
}

type ValidationError = InvalidChainError | InvalidAddressError | InvalidAmountError | InvalidApprovalTypeError;

const APPROVAL_TYPE_MAP: Record<string, CreateClaimApprovalType> = {
    'unapproved': CreateClaimApprovalType.Unapproved,
    'creditor-only': CreateClaimApprovalType.CreditorOnly,
    'debtor-only': CreateClaimApprovalType.DebtorOnly,
    'approved': CreateClaimApprovalType.Approved,
};

const validateApprovalType = (approvalType: string): Either.Either<CreateClaimApprovalType, InvalidApprovalTypeError> => {
    const mapped = APPROVAL_TYPE_MAP[approvalType];
    if (mapped === undefined) {
        return Either.left(
            new InvalidApprovalTypeError(
                approvalType,
                `Invalid approval type: '${approvalType}'. Must be one of: ${Object.keys(APPROVAL_TYPE_MAP).join(', ')}`,
            ),
        );
    }
    return Either.right(mapped);
};

export const validateApproveCreateClaimParams = (
    chain: Option.Option<number>,
    controller: string,
    approvalType: string,
    approvalCount: string,
    bindingAllowed: boolean,
): Either.Either<ApproveCreateClaimParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            controller: yield* validateAddress(controller),
            approvalType: yield* validateApprovalType(approvalType),
            approvalCount: BigInt(approvalCount),
            isBindingAllowed: bindingAllowed,
        };
    });

export const validateApproveNftParams = (
    chain: Option.Option<number>,
    to: string,
    claimId: string,
): Either.Either<ApproveNftParams, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            to: yield* validateAddress(to),
            claimId: yield* validateAmount(claimId),
        };
    });

export const validateApproveErc20Params = (
    chain: Option.Option<number>,
    token: string,
    spender: string,
    amount: string,
): Either.Either<ApproveErc20Params, ValidationError> =>
    Either.gen(function* () {
        return {
            chainId: yield* validateChainId(chain),
            token: yield* validateAddress(token),
            spender: yield* validateAddress(spender),
            amount: yield* validateAmount(amount),
        };
    });
