import type { UnsignedTransaction, TransactionResult } from '../../domain/types/transaction.js';
import { CHAIN_NAMES, type ChainId } from '../../domain/types/eth.js';

export const formatTransactionAsHuman = (tx: UnsignedTransaction, chainId: ChainId): string => {
    const chainName = CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
    const lines = [
        '--- Unsigned Transaction Payload ---',
        `  Chain:     ${chainName} (${chainId})`,
        `  To:        ${tx.to}`,
        `  Value:     ${tx.value} wei`,
        `  Data:      ${tx.data.slice(0, 10)}...${tx.data.slice(-8)}`,
        `  Operation: ${tx.operation} (Call)`,
        '',
        'Use this payload with a Safe multisend or external signer.',
        '',
        'Full calldata:',
        tx.data,
    ];
    return lines.join('\n');
};

export const formatResultAsHuman = (result: TransactionResult): string => {
    const chainName = CHAIN_NAMES[result.chainId as ChainId] ?? `Chain ${result.chainId}`;
    const lines = ['--- Transaction Sent ---', `  Chain:  ${chainName} (${result.chainId})`, `  TxHash: ${result.txHash}`];
    return lines.join('\n');
};
