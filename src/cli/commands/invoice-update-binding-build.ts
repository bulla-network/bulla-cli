import { Command } from '@effect/cli';
import { Console, Effect, Either } from 'effect';
import { buildUpdateBinding } from '../../application/services/invoice-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { ClaimBinding } from '../../domain/types/invoice.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { claimIdOption, bindingOption } from '../options/invoice-options.js';

export const invoiceUpdateBindingBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        binding: bindingOption,
        format: formatOption,
    },
    ({ chain, claimId, binding, format }) =>
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

            const tx = yield* buildUpdateBinding(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned updateBinding transaction (no private key required)'));
