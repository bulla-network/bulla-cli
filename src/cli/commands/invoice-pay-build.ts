import { Command } from '@effect/cli';
import { Console, Effect, Either } from 'effect';
import { buildPayInvoice } from '../../application/services/invoice-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { validateAddress, validateAmount } from '../../domain/validation/eth.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { tokenOption } from '../options/pay-options.js';
import { claimIdOption, paymentAmountOption } from '../options/invoice-options.js';

export const invoicePayBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        claimId: claimIdOption,
        paymentAmount: paymentAmountOption,
        token: tokenOption,
        format: formatOption,
    },
    ({ chain, claimId, paymentAmount, token, format }) =>
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

            const tx = yield* buildPayInvoice(params, tokenResult.right);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned payInvoice transaction (no private key required)'));
