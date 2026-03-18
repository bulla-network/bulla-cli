import { Command } from '@effect/cli';
import { backendCommands } from '../factoring/backend-commands.js';
import { factoringCommands } from '../factoring/commands.js';
import { factoringViewCommands, queueCommand } from '../factoring/view-commands.js';

export const factoringCommand = Command.make('factoring', {}).pipe(
    Command.withDescription('Factoring pool operations'),
    Command.withSubcommands([...factoringCommands, ...factoringViewCommands, ...backendCommands, queueCommand]),
);
