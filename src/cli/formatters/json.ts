import type { UnsignedTransaction, TransactionResult } from '../../domain/types/transaction.js';

export const formatTransactionAsJson = (tx: UnsignedTransaction): string =>
    JSON.stringify(
        {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
        },
        null,
        2,
    );

export const formatResultAsJson = (result: TransactionResult): string =>
    JSON.stringify(
        {
            txHash: result.txHash,
            chainId: result.chainId,
            blockNumber: result.blockNumber,
        },
        null,
        2,
    );
