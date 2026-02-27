import { TAG_SEPARATOR } from '../constants.js';
import type { ChainId, EthAddress } from './eth.js';

/**
 * Input parameters for building an instant payment.
 * All fields should be validated before reaching this type.
 */
export interface InstantPaymentParams {
    readonly chainId: ChainId;
    readonly to: EthAddress;
    readonly amount: bigint; // in token's smallest unit (wei for ETH, 10^6 for USDC, etc.)
    readonly tokenAddress: EthAddress; // address(0) for native currency
    readonly description: string;
    readonly tags: readonly string[];
    readonly ipfsHash: string;
}

/** Sanitize and join tags according to Bulla convention. */
export const formatTags = (tags: readonly string[]): string =>
    tags
        .map(t => t.trim())
        .filter(t => t !== '')
        .join(TAG_SEPARATOR);
