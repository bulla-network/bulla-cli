import type { Hash, PublicClient, TransactionReceipt } from 'viem';

/**
 * Wait for a setup transaction to be mined and throw if it did not succeed.
 * Without this, a reverted setup tx is silently ignored and the problem only
 * surfaces later as a confusing test failure.
 */
export async function waitForSuccess(client: PublicClient, hash: Hash, label: string): Promise<TransactionReceipt> {
    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') {
        throw new Error(`e2e setup tx failed (${label}): status=${receipt.status}, hash=${hash}`);
    }
    return receipt;
}
