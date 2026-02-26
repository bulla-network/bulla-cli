import { Effect, Console, Either } from 'effect';
import { validateAddress, validateAmount } from '../../domain/validation/eth.js';
import { isChainId } from '../../domain/types/eth.js';
import type { InstantPaymentParams } from '../../domain/types/instant-payment.js';

/** Validate parameters for instant payment */
export const validateInstantPaymentParams = (
    chain: number,
    to: string,
    amount: string,
    token: string,
    description: string,
    tags: string,
    ipfsHash: string,
): Effect.Effect<InstantPaymentParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        const toResult = validateAddress(to);
        if (Either.isLeft(toResult)) {
            yield* Console.error(`Invalid recipient address: ${toResult.left.message}`);
            return undefined;
        }

        const tokenResult = validateAddress(token);
        if (Either.isLeft(tokenResult)) {
            yield* Console.error(`Invalid token address: ${tokenResult.left.message}`);
            return undefined;
        }

        const amountResult = validateAmount(amount);
        if (Either.isLeft(amountResult)) {
            yield* Console.error(`Invalid amount: ${amountResult.left.message}`);
            return undefined;
        }

        const tagList = tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== '');

        return {
            chainId: chain,
            to: toResult.right,
            tokenAddress: tokenResult.right,
            amount: amountResult.right,
            description,
            tags: tagList,
            ipfsHash,
        };
    });
