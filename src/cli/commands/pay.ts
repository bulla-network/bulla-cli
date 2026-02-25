import { Command } from '@effect/cli';
import { payBuildCommand } from './pay-build.js';
import { payExecuteCommand } from './pay-execute.js';

export const payCommand = Command.make('pay', {}).pipe(
    Command.withDescription('Instant payment operations'),
    Command.withSubcommands([payBuildCommand, payExecuteCommand]),
);
