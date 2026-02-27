import { Effect, Layer } from 'effect';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';
import { SignerService } from '../../application/ports/signer-port.js';
import { SignerRequiredError } from '../../domain/errors.js';
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
                            to: tx.to as `0x${string}`,
                            value: BigInt(tx.value),
                            data: tx.data,
                            chain,
                        }),
                    catch: err => new SignerRequiredError({ message: `Transaction failed: ${err}` }),
                });

                return hash as Hex;
            }),
    });
