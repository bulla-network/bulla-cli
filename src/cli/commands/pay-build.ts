import { Command } from '@effect/cli';
import { Console, Effect, Either } from 'effect';
import { buildInstantPayment } from '../../application/services/instant-payment-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { validateAddress, validateAmount } from '../../domain/validation/eth.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { amountOption, descriptionOption, ipfsHashOption, tagsOption, tokenOption, toOption } from '../options/pay-options.js';

export const payBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        to: toOption,
        amount: amountOption,
        token: tokenOption,
        description: descriptionOption,
        tags: tagsOption,
        ipfsHash: ipfsHashOption,
        format: formatOption,
    },
    ({ chain, to, amount, token, description, tags, ipfsHash, format }) =>
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
                chainId: chain,
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

            const tx = yield* buildInstantPayment(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned instant payment transaction payload (no private key required)'));
