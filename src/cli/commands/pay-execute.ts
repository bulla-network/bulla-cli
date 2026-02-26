import { Command } from '@effect/cli';
import { Console, Effect } from 'effect';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import {
    toOption,
    amountOption,
    tokenOption,
    descriptionOption,
    tagsOption,
    ipfsHashOption,
    privateKeyOption,
} from '../options/pay-options.js';
import { sendInstantPayment } from '../../application/services/instant-payment-service.js';
import { makeSignerLayer } from '../../infrastructure/layers.js';
import { formatResult, type OutputFormat } from '../formatters/index.js';
import { isChainId, type ChainId, type EthAddress, type Hex } from '../../domain/types/eth.js';
import { validateAddress, validateAmount } from '../../domain/validation/eth.js';
import { Either, Option } from 'effect';

export const payExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        to: toOption,
        amount: amountOption,
        token: tokenOption,
        description: descriptionOption,
        tags: tagsOption,
        ipfsHash: ipfsHashOption,
        format: formatOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
    },
    ({ chain, to, amount, token, description, tags, ipfsHash, format, privateKey, rpcUrl }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            const toResult = validateAddress(to);
            if (Either.isLeft(toResult)) {
                yield* Console.error(toResult.left.message);
                return;
            }

            const tokenResult = validateAddress(token);
            if (Either.isLeft(tokenResult)) {
                yield* Console.error(tokenResult.left.message);
                return;
            }

            const amountResult = validateAmount(amount);
            if (Either.isLeft(amountResult)) {
                yield* Console.error(amountResult.left.message);
                return;
            }

            const params = {
                chainId: chain as ChainId,
                to: toResult.right,
                amount: amountResult.right,
                tokenAddress: tokenResult.right,
                description,
                tags: tags
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t !== ''),
                ipfsHash,
            };

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const signerLayer = makeSignerLayer(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendInstantPayment(params).pipe(Effect.provide(signerLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send an instant payment transaction (requires private key)'));
