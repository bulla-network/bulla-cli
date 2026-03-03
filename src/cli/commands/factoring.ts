import { Command } from '@effect/cli';
import { factoringCommands } from '../factoring/commands.js';

export const factoringCommand = Command.make('factoring', {}).pipe(
    Command.withDescription('Factoring pool operations'),
    Command.withSubcommands(factoringCommands),
);
