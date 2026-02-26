import { Either } from 'effect';
import type { InvalidAddressError, InvalidAmountError, InvalidChainError } from '../../domain/errors.js';
import type { InstantPaymentParams } from '../../domain/types/instant-payment.js';
import { validateAddress, validateAmount, validateChainId } from '../../domain/validation/eth.js';

/** Validate and parse raw CLI inputs into InstantPaymentParams (pure). */
export const validateInstantPaymentParams = (
    chain: number,
    to: string,
    amount: string,
    token: string,
    description: string,
    tags: string,
    ipfsHash: string,
): Either.Either<InstantPaymentParams, InvalidChainError | InvalidAddressError | InvalidAmountError> =>
    Either.gen(function* () {
        const tagList = tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== '');

        return {
            chainId: yield* validateChainId(chain),
            to: yield* validateAddress(to),
            tokenAddress: yield* validateAddress(token),
            amount: yield* validateAmount(amount),
            description,
            tags: tagList,
            ipfsHash,
        };
    });
