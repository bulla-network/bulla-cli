import { Command } from '@effect/cli';
import { Console, Effect, Either, Option } from 'effect';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import { claimIdOption, callbackContractOption, callbackSelectorOption } from '../options/invoice-options.js';
import { privateKeyOption } from '../options/pay-options.js';
import { sendSetPaidInvoiceCallback } from '../../application/services/invoice-service.js';
import { makePrivateKeySignerService } from '../../infrastructure/signer/private-key-signer-service.js';
import { formatResult, type OutputFormat } from '../formatters/index.js';
import { isChainId, type Hex } from '../../domain/types/eth.js';
import { validateAddress } from '../../domain/validation/eth.js';

export const invoiceSetCallbackExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        invoiceId: claimIdOption,
        callbackContract: callbackContractOption,
        callbackSelector: callbackSelectorOption,
        format: formatOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
    },
    ({ chain, invoiceId, callbackContract, callbackSelector, format, privateKey, rpcUrl }) =>
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

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const signerLayer = makePrivateKeySignerService(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendSetPaidInvoiceCallback(params).pipe(Effect.provide(signerLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send a setPaidInvoiceCallback transaction (requires private key)'));
