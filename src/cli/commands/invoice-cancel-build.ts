import { Command } from '@effect/cli';
import { Console, Effect, Either } from 'effect';
import { buildCancelInvoice } from '../../application/services/invoice-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { claimIdOption, noteOption } from '../options/invoice-options.js';

export const invoiceCancelBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        note: noteOption,
        format: formatOption,
    },
    ({ chain, claimId, note, format }) =>
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

            const tx = yield* buildCancelInvoice(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned cancelInvoice transaction (no private key required)'));
