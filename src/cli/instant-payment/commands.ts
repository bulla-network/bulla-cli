import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import { buildInstantPayment, sendInstantPayment } from '../../application/services/instant-payment-service.js';
import { validateInstantPaymentParams } from './validation.js';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import {
    toOption,
    amountOption,
    tokenOption,
    descriptionOption,
    tagsOption,
    ipfsHashOption,
    privateKeyOption,
} from '../options/pay-options.js';
import { formatTransaction, formatResult, type OutputFormat } from '../formatters/index.js';
import { makeSignerLayer } from '../../infrastructure/layers.js';
import type { Hex } from '../../domain/types/eth.js';

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
            if (!params) return;

            const tx = yield* buildInstantPayment(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
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
            if (!params) return;

            const resolvedRpcUrl = Option.getOrUndefined(rpcUrl);
            const signerLayer = makeSignerLayer(privateKey as Hex, resolvedRpcUrl);

            const result = yield* sendInstantPayment(params).pipe(Effect.provide(signerLayer));

            const output = formatResult(result, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Sign and send an instant payment transaction (requires private key)'));

// Parent pay command
export const payCommand = Command.make('pay', {}).pipe(
    Command.withDescription('Send an instant payment'),
    Command.withSubcommands([payBuildCommand, payExecuteCommand]),
);
