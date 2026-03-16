import { Either, Option } from 'effect';
import type { InvalidAddressError, InvalidAmountError, InvalidChainError } from '../../domain/errors.js';
import { CreateClaimApprovalType, type ApproveCreateClaimParams, type ApproveErc20Params, type ApproveNftParams } from '../../domain/types/approve.js';
import { validateAddress, validateAmount, validateChainId } from '../../domain/validation/eth.js';

type ValidationError = InvalidChainError | InvalidAddressError | InvalidAmountError;

const APPROVAL_TYPE_MAP: Record<string, CreateClaimApprovalType> = {
    'unapproved': CreateClaimApprovalType.Unapproved,
    'creditor-only': CreateClaimApprovalType.CreditorOnly,
    'debtor-only': CreateClaimApprovalType.DebtorOnly,
    'approved': CreateClaimApprovalType.Approved,
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
            approvalType: APPROVAL_TYPE_MAP[approvalType]!,
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
