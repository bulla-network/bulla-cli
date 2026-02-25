import type { EthAddress, Hex } from './eth.js';

/**
 * An unsigned transaction payload — output of "build" mode.
 * Compatible with Safe Transaction Service / multisend format.
 */
export interface UnsignedTransaction {
    readonly to: EthAddress;
    readonly value: string; // wei as decimal string
    readonly data: Hex;
    readonly operation: 0; // Call (not DelegateCall)
}

/** Result from sending a transaction on-chain. */
export interface TransactionResult {
    readonly txHash: Hex;
    readonly chainId: number;
    readonly blockNumber: number;
}
