import { Command } from '@effect/cli';
import { Console, Effect, Either } from 'effect';
import { buildSetPaidInvoiceCallback } from '../../application/services/invoice-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { validateAddress } from '../../domain/validation/eth.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { claimIdOption, callbackContractOption, callbackSelectorOption } from '../options/invoice-options.js';

export const invoiceSetCallbackBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        invoiceId: claimIdOption,
        callbackContract: callbackContractOption,
        callbackSelector: callbackSelectorOption,
        format: formatOption,
    },
    ({ chain, invoiceId, callbackContract, callbackSelector, format }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            // Validate callback contract address
            const contractResult = validateAddress(callbackContract);
            if (Either.isLeft(contractResult)) {
                yield* Console.error(`Invalid callback contract address: ${contractResult.left.message}`);
                return;
            }

            // Validate callback selector format (should be bytes4 hex string)
            if (!callbackSelector.startsWith('0x') || callbackSelector.length !== 10) {
                yield* Console.error(`Invalid callback selector: ${callbackSelector}. Must be a bytes4 hex string (e.g., 0x12345678)`);
                return;
            }

            const params = {
                chainId: chain,
                invoiceId: BigInt(invoiceId),
                callbackContract: contractResult.right,
                callbackSelector,
            };

            const tx = yield* buildSetPaidInvoiceCallback(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned setPaidInvoiceCallback transaction (no private key required)'));
