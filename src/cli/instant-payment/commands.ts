import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import { buildInstantPayment } from '../../application/services/instant-payment-service.js';
import { sendTransaction } from '../../application/services/transaction-utils.js';
import type { Hex } from '../../domain/types/eth.js';
import { makeSignerLayer } from '../../infrastructure/layers.js';
import { formatResult, formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import {
    amountOption,
    descriptionOption,
    ipfsHashOption,
    privateKeyOption,
    tagsOption,
    tokenOption,
    toOption,
} from '../options/pay-options.js';
import { validateInstantPaymentParams } from './validation.js';

// Build command
export const payBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        to: toOption,
        amount: amountOption,
        token: tokenOption,
        description: descriptionOption,
        tags: tagsOption,
        ipfsHash: ipfsHashOption,
        format: formatOption,
    },
    ({ chain, to, amount, token, description, tags, ipfsHash, format }) =>
        Effect.gen(function* () {
            const params = yield* validateInstantPaymentParams(chain, to, amount, token, description, tags, ipfsHash);
            const tx = yield* buildInstantPayment(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned instant payment transaction payload (no private key required)'));

// Execute command
export const payExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        to: toOption,
        amount: amountOption,
        token: tokenOption,
        description: descriptionOption,
        tags: tagsOption,
        ipfsHash: ipfsHashOption,
        format: formatOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
    },
    ({ chain, to, amount, token, description, tags, ipfsHash, format, privateKey, rpcUrl }) =>
        Effect.gen(function* () {
            const params = yield* validateInstantPaymentParams(chain, to, amount, token, description, tags, ipfsHash);
            const tx = yield* buildInstantPayment(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an instant payment transaction (requires private key)'));

// Parent pay command
export const payCommand = Command.make('pay', {}).pipe(
    Command.withDescription('Send an instant payment'),
    Command.withSubcommands([payBuildCommand, payExecuteCommand]),
);
