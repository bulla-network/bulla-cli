import { Either } from 'effect';
import { TAG_SEPARATOR } from '../constants.js';
import type { InstantPaymentParams } from '../types/instant-payment.js';

/** Sanitize and join tags according to Bulla convention. */
export const formatTags = (tags: readonly string[]): string =>
    tags
        .map(t => t.trim())
        .filter(t => t !== '')
        .join(TAG_SEPARATOR);

/** Validate that instant payment params are well-formed (pure). */
export const validateInstantPaymentParams = (params: InstantPaymentParams): Either.Either<InstantPaymentParams, string> => {
    if (params.amount <= 0n) {
        return Either.left('Amount must be greater than zero');
    }
    return Either.right(params);
};
