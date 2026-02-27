import { Command } from '@effect/cli';
import { frendlendCommands } from '../frendlend/commands.js';

export const frendlendCommand = Command.make('frendlend', {}).pipe(
    Command.withDescription('FrendLend loan operations'),
    Command.withSubcommands(frendlendCommands),
);
