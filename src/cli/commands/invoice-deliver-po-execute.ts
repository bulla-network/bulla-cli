import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import { sendDeliverPurchaseOrder } from '../../application/services/invoice-service.js';
import { isChainId, type Hex } from '../../domain/types/eth.js';
import { formatResult, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import { claimIdOption } from '../options/invoice-options.js';
import { privateKeyOption } from '../options/pay-options.js';
import { makeSignerLayer } from '../../infrastructure/layers.js';

export const invoiceDeliverPoExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        format: formatOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
    },
    ({ chain, claimId, format, privateKey, rpcUrl }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            const params = {
                chainId: chain,
                claimId: BigInt(claimId),
            };

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const signerLayer = makeSignerLayer(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendDeliverPurchaseOrder(params).pipe(Effect.provide(signerLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send a deliverPurchaseOrder transaction (requires private key)'));
