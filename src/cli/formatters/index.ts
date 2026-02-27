import type { ChainId } from '../../domain/types/eth.js';
import type { TransactionResult, UnsignedTransaction } from '../../domain/types/transaction.js';
import { formatResultAsHuman, formatTransactionAsHuman } from './human.js';
import { formatResultAsJson, formatTransactionAsJson } from './json.js';

export type OutputFormat = 'json' | 'human';

export const formatTransaction = (tx: UnsignedTransaction, chainId: ChainId, format: OutputFormat): string =>
    format === 'json' ? formatTransactionAsJson(tx) : formatTransactionAsHuman(tx, chainId);

export const formatResult = (result: TransactionResult, format: OutputFormat): string =>
    format === 'json' ? formatResultAsJson(result) : formatResultAsHuman(result);
