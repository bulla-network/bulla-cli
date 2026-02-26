import type { UnsignedTransaction, TransactionResult } from '../../domain/types/transaction.js';
import type { ChainId } from '../../domain/types/eth.js';
import { formatTransactionAsJson, formatResultAsJson } from './json.js';
import { formatTransactionAsHuman, formatResultAsHuman } from './human.js';

export type OutputFormat = 'json' | 'human';

export const formatTransaction = (tx: UnsignedTransaction, chainId: ChainId, format: OutputFormat): string =>
    format === 'json' ? formatTransactionAsJson(tx) : formatTransactionAsHuman(tx, chainId);

export const formatResult = (result: TransactionResult, format: OutputFormat): string =>
    format === 'json' ? formatResultAsJson(result) : formatResultAsHuman(result);
