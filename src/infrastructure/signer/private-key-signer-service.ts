import { Effect, Layer } from 'effect';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';
import { SignerService } from '../../application/ports/signer-port.js';
import { SignerRequiredError, TransactionFailedError } from '../../domain/errors.js';
import type { ChainId, EthAddress, Hex } from '../../domain/types/eth.js';

const chainMap: Record<ChainId, chains.Chain> = {
    1: chains.mainnet,
    10: chains.optimism,
    56: chains.bsc,
    100: chains.gnosis,
    137: chains.polygon,
    151: chains.redbellyMainnet,
    8453: chains.base,
    42161: chains.arbitrum,
    42220: chains.celo,
    43114: chains.avalanche,
    11155111: chains.sepolia,
};

/** How long to wait for a sent transaction to be mined before giving up. */
const RECEIPT_TIMEOUT_MS = 180_000;
const RECEIPT_POLLING_INTERVAL_MS = 1_000;

export const makePrivateKeySignerService = (privateKey: Hex, rpcUrl?: string) =>
    Layer.succeed(SignerService, {
        getAddress: () =>
            Effect.try({
                try: () => {
                    const account = privateKeyToAccount(privateKey);
                    return account.address.toLowerCase() as EthAddress;
                },
                catch: () => new SignerRequiredError({ message: 'Invalid private key' }),
            }),

        signAndSend: (chainId: ChainId, tx: { readonly to: string; readonly value: string; readonly data: Hex }) =>
            Effect.gen(function* () {
                const chain = chainMap[chainId];
                if (!chain) {
                    return yield* Effect.fail(new SignerRequiredError({ message: `No chain configuration for chain ${chainId}` }));
                }

                const account = privateKeyToAccount(privateKey);
                const client = createWalletClient({
                    account,
                    chain,
                    transport: http(rpcUrl),
                });

                const hash = yield* Effect.tryPromise({
                    try: () =>
                        client.sendTransaction({
                            to: tx.to as Hex,
                            value: BigInt(tx.value),
                            data: tx.data,
                            chain,
                        }),
                    catch: err => new SignerRequiredError({ message: `Transaction failed: ${err}` }),
                });

                return hash as Hex;
            }),

        waitForReceipt: (chainId: ChainId, txHash: Hex) =>
            Effect.gen(function* () {
                const client = createPublicClient({
                    chain: chainMap[chainId],
                    transport: http(rpcUrl),
                    pollingInterval: RECEIPT_POLLING_INTERVAL_MS,
                });

                const receipt = yield* Effect.tryPromise({
                    try: () => client.waitForTransactionReceipt({ hash: txHash, timeout: RECEIPT_TIMEOUT_MS }),
                    catch: err =>
                        new TransactionFailedError({
                            txHash,
                            message: `Transaction ${txHash} was sent but its receipt could not be fetched: ${err}`,
                        }),
                });

                return { status: receipt.status, blockNumber: receipt.blockNumber };
            }),
    });
