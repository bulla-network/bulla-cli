import { Command } from '@effect/cli';
import { Console, Effect } from 'effect';
import { buildImpairInvoice } from '../../application/services/invoice-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { claimIdOption } from '../options/invoice-options.js';

export const invoiceImpairBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        format: formatOption,
    },
    ({ chain, claimId, format }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            const params = {
                chainId: chain,
                claimId: BigInt(claimId),
            };

            const tx = yield* buildImpairInvoice(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned impairInvoice transaction (no private key required)'));
