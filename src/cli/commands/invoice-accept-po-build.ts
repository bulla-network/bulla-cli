import { Command } from '@effect/cli';
import { Console, Effect, Either } from 'effect';
import { buildAcceptPurchaseOrder } from '../../application/services/invoice-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { validateAmountOrZero } from '../../domain/validation/eth.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { claimIdOption, depositAmountOption } from '../options/invoice-options.js';

export const invoiceAcceptPoBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        depositAmount: depositAmountOption,
        format: formatOption,
    },
    ({ chain, claimId, depositAmount, format }) =>
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

            const tx = yield* buildAcceptPurchaseOrder(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned acceptPurchaseOrder transaction (no private key required)'));
