import { Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect } from 'effect';
import { createRequire } from 'node:module';
import { payCommand } from './cli/commands/pay.js';
import { BuildModeLayers } from './infrastructure/layers.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const bullaCommand = Command.make('bulla', {}).pipe(
    Command.withDescription('Bulla Protocol CLI — build and send Bulla related transactions'),
    Command.withSubcommands([payCommand]),
);

const cli = Command.run(bullaCommand, {
    name: 'bulla',
    version,
});

cli(process.argv).pipe(Effect.provide(BuildModeLayers), Effect.provide(NodeContext.layer), NodeRuntime.runMain);
