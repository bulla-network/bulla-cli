import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import { claimIdOption, bindingOption } from '../options/invoice-options.js';
import { privateKeyOption } from '../options/pay-options.js';
import { sendUpdateBinding } from '../../application/services/invoice-service.js';
import { makePrivateKeySignerService } from '../../infrastructure/signer/private-key-signer-service.js';
import { formatResult, type OutputFormat } from '../formatters/index.js';
import { isChainId, type Hex } from '../../domain/types/eth.js';
import { ClaimBinding } from '../../domain/types/invoice.js';

export const invoiceUpdateBindingExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        claimId: claimIdOption,
        binding: bindingOption,
        format: formatOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
    },
    ({ chain, claimId, binding, format, privateKey, rpcUrl }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            // Validate binding enum
            if (binding < 0 || binding > 2) {
                yield* Console.error(`Invalid binding value: ${binding}. Must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)`);
                return;
            }

            const params = {
                chainId: chain,
                claimId: BigInt(claimId),
                binding: binding as ClaimBinding,
            };

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const signerLayer = makePrivateKeySignerService(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendUpdateBinding(params).pipe(Effect.provide(signerLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send an updateBinding transaction (requires private key)'));
