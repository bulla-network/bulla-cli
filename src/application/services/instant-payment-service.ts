import { Effect } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { InstantPaymentParams } from '../../domain/types/instant-payment.js';
import { formatTags } from '../../domain/types/instant-payment.js';
import { isNativeToken } from '../../domain/types/token.js';
import type { UnsignedTransaction } from '../../domain/types/transaction.js';
import { InstantPaymentEncoderService } from '../ports/instant-payment-encoder-port.js';
import { RegistryService } from '../ports/registry-port.js';

/**
 * Build mode: produces the unsigned transaction payload.
 * Does NOT require a signer. Does NOT require blockchain I/O.
 * Only needs: RegistryService (to look up contract address) and InstantPaymentEncoderService (for ABI encoding).
 */
export const buildInstantPayment = (
    params: InstantPaymentParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | InstantPaymentEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const blockchain = yield* InstantPaymentEncoderService;

        const contractAddress = yield* registry.getInstantPaymentAddress(params.chainId);

        const tag = formatTags(params.tags);

        const data = yield* blockchain.encodeInstantPayment({
            to: params.to,
            amount: params.amount,
            tokenAddress: params.tokenAddress,
            description: params.description.trim(),
            tag,
            ipfsHash: params.ipfsHash.trim(),
        });

        const value = isNativeToken(params.tokenAddress) ? params.amount.toString() : '0';

        return {
            to: contractAddress,
            value,
            data,
            operation: 0 as const,
        };
    });

