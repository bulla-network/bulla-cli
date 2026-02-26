import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import { claimIdOption, noteOption } from '../options/invoice-options.js';
import { privateKeyOption } from '../options/pay-options.js';
import { sendCancelInvoice } from '../../application/services/invoice-service.js';
import { makePrivateKeySignerService } from '../../infrastructure/signer/private-key-signer-service.js';
import { formatResult, type OutputFormat } from '../formatters/index.js';
import { isChainId, type Hex } from '../../domain/types/eth.js';

export const invoiceCancelExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        note: noteOption,
        format: formatOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
    },
    ({ chain, claimId, note, format, privateKey, rpcUrl }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            const params = {
                chainId: chain,
                claimId: BigInt(claimId),
                note,
            };

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const signerLayer = makePrivateKeySignerService(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendCancelInvoice(params).pipe(Effect.provide(signerLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send a cancelInvoice transaction (requires private key)'));
