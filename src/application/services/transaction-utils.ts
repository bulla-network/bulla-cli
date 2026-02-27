import { Effect } from 'effect';
import type { SignerRequiredError } from '../../domain/errors.js';
import type { ChainId } from '../../domain/types/eth.js';
import type { TransactionResult, UnsignedTransaction } from '../../domain/types/transaction.js';
import { SignerService } from '../ports/signer-port.js';

/**
 * Signs and sends an already-built unsigned transaction.
 */
export const sendTransaction = (
    chainId: ChainId,
    tx: UnsignedTransaction,
): Effect.Effect<TransactionResult, SignerRequiredError, SignerService> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;

        const txHash = yield* signer.signAndSend(chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId,
            blockNumber: 0,
        };
    });
