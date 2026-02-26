import { Command } from '@effect/cli';
import { Console, Effect, Either, Option } from 'effect';
import { sendPayInvoice } from '../../application/services/invoice-service.js';
import { isChainId, type Hex } from '../../domain/types/eth.js';
import { validateAddress, validateAmount } from '../../domain/validation/eth.js';
import { formatResult, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import { tokenOption, privateKeyOption } from '../options/pay-options.js';
import { claimIdOption, paymentAmountOption } from '../options/invoice-options.js';
import { makePrivateKeySignerService } from '../../infrastructure/signer/private-key-signer-service.js';

export const invoicePayExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        paymentAmount: paymentAmountOption,
        token: tokenOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, claimId, paymentAmount, token, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            // Validate token address
            const tokenResult = validateAddress(token);
            if (Either.isLeft(tokenResult)) {
                yield* Console.error(`Invalid token address: ${tokenResult.left.message}`);
                return;
            }

            // Validate payment amount
            const paymentAmountResult = validateAmount(paymentAmount);
            if (Either.isLeft(paymentAmountResult)) {
                yield* Console.error(`Invalid payment amount: ${paymentAmountResult.left.message}`);
                return;
            }

            const params = {
                chainId: chain,
                claimId: BigInt(claimId),
                paymentAmount: paymentAmountResult.right,
            };

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const signerLayer = makePrivateKeySignerService(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendPayInvoice(params, tokenResult.right).pipe(Effect.provide(signerLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send a payInvoice transaction (requires private key)'));
