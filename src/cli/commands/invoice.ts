import { Command } from '@effect/cli';
import { invoiceCommands } from '../invoice/commands.js';

export const invoiceCommand = Command.make('invoice', {}).pipe(
    Command.withDescription('Invoice operations'),
    Command.withSubcommands(invoiceCommands),
);
