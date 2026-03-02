import { Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Console, Effect, Layer } from 'effect';
import { createRequire } from 'node:module';
import { frendlendCommand } from './cli/commands/frendlend.js';
import { invoiceCommand } from './cli/commands/invoice.js';
import { payCommand } from './cli/instant-payment/commands.js';
import { BuildModeLayers } from './infrastructure/layers.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const bullaCommand = Command.make('bulla', {}).pipe(
    Command.withDescription('Bulla Protocol CLI — build and send Bulla related transactions'),
    Command.withSubcommands([payCommand, invoiceCommand, frendlendCommand]),
);

const cli = Command.run(bullaCommand, {
    name: 'bulla',
    version,
});

const program = (cli(process.argv) as unknown as Effect.Effect<void, { message: string }>).pipe(
    Effect.catchAll(err => Console.error(err.message)),
    Effect.provide(Layer.merge(BuildModeLayers, NodeContext.layer)),
);

NodeRuntime.runMain(program);
