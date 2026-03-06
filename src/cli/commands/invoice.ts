import { Command } from '@effect/cli';
import { invoiceCommands } from '../invoice/commands.js';
import { invoiceViewCommands } from '../invoice/view-commands.js';

export const invoiceCommand = Command.make('invoice', {}).pipe(
    Command.withDescription('Invoice operations'),
    Command.withSubcommands([...invoiceCommands, ...invoiceViewCommands]),
);
