import { Command } from '@effect/cli';
import { Console, Effect, Either, Option } from 'effect';
import { sendAcceptPurchaseOrder } from '../../application/services/invoice-service.js';
import { isChainId, type Hex } from '../../domain/types/eth.js';
import { validateAmountOrZero } from '../../domain/validation/eth.js';
import { formatResult, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import { claimIdOption, depositAmountOption } from '../options/invoice-options.js';
import { privateKeyOption } from '../options/pay-options.js';
import { makeExecuteModeLayers } from '../../infrastructure/layers.js';

export const invoiceAcceptPoExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        depositAmount: depositAmountOption,
        format: formatOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
    },
    ({ chain, claimId, depositAmount, format, privateKey, rpcUrl }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            // Validate deposit amount
            const depositAmountResult = validateAmountOrZero(depositAmount);
            if (Either.isLeft(depositAmountResult)) {
                yield* Console.error(`Invalid deposit amount: ${depositAmountResult.left.message}`);
                return;
            }

            const params = {
                chainId: chain,
                claimId: BigInt(claimId),
                depositAmount: depositAmountResult.right,
            };

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const executeLayer = makeExecuteModeLayers(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendAcceptPurchaseOrder(params).pipe(Effect.provide(executeLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send an acceptPurchaseOrder transaction (requires private key)'));
