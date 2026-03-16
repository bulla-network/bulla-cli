import { Command } from '@effect/cli';
import { approveCommands } from '../approve/commands.js';

export const approveCommand = Command.make('approve', {}).pipe(
    Command.withDescription('Approval operations (create-claim, ERC20)'),
    Command.withSubcommands([...approveCommands]),
);
