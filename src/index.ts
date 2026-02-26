import { Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Console, Effect, Layer } from 'effect';
import { createRequire } from 'node:module';
import { invoiceCommand } from './cli/commands/invoice.js';
import { payCommand } from './cli/instant-payment/commands.js';
import { BuildModeLayers } from './infrastructure/layers.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const bullaCommand = Command.make('bulla', {}).pipe(
    Command.withDescription('Bulla Protocol CLI — build and send Bulla related transactions'),
    Command.withSubcommands([payCommand, invoiceCommand]),
);

const cli = Command.run(bullaCommand, {
    name: 'bulla',
    version,
});

const program = cli(process.argv).pipe(
    Effect.catchAll((err: { message: string }) => Console.error(err.message)),
    Effect.provide(Layer.merge(BuildModeLayers, NodeContext.layer)),
) as Effect.Effect<void>;

NodeRuntime.runMain(program);
