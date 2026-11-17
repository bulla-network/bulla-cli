import { Effect } from 'effect';
import { type SignerRequiredError, TransactionFailedError } from '../../domain/errors.js';
import type { ChainId } from '../../domain/types/eth.js';
import type { TransactionResult, UnsignedTransaction } from '../../domain/types/transaction.js';
import { SignerService } from '../ports/signer-port.js';

/**
 * Signs and sends an already-built unsigned transaction, then waits for it to be mined.
 *
 * A node can accept a transaction and return its hash before mining it, and a mined transaction
 * can still revert. Returning at the hash would report success for a transaction that changed
 * nothing, so this fails with TransactionFailedError unless the receipt status is success.
 */
export const sendTransaction = (
    chainId: ChainId,
    tx: UnsignedTransaction,
): Effect.Effect<TransactionResult, SignerRequiredError | TransactionFailedError, SignerService> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;

        const txHash = yield* signer.signAndSend(chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        const receipt = yield* signer.waitForReceipt(chainId, txHash);

        if (receipt.status !== 'success') {
            return yield* Effect.fail(
                new TransactionFailedError({
                    txHash,
                    message: `Transaction ${txHash} reverted in block ${receipt.blockNumber}`,
                }),
            );
        }

        return {
            txHash,
            chainId,
            blockNumber: Number(receipt.blockNumber),
        };
    });
