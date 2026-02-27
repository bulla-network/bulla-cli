import { Effect } from 'effect';
import type { SignerRequiredError } from '../../domain/errors.js';
import type { ChainId } from '../../domain/types/eth.js';
import type { TransactionResult, UnsignedTransaction } from '../../domain/types/transaction.js';
import { SignerService } from '../ports/signer-port.js';

/**
 * Generic transaction execution utility.
 * Takes a build function and parameters, builds the unsigned transaction,
 * then signs and sends it using the signer service.
 */
export const executeTransaction = <TParams extends { chainId: ChainId }, TError, TReqs>(
    buildFn: (params: TParams) => Effect.Effect<UnsignedTransaction, TError, TReqs>,
    params: TParams,
): Effect.Effect<TransactionResult, TError | SignerRequiredError, SignerService | TReqs> =>
    Effect.gen(function* () {
        const signer = yield* SignerService;
        const tx = yield* buildFn(params);

        const txHash = yield* signer.signAndSend(params.chainId, {
            to: tx.to,
            value: tx.value,
            data: tx.data,
        });

        return {
            txHash,
            chainId: params.chainId,
            blockNumber: 0,
        };
    });
