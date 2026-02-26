import { Command } from '@effect/cli';
import { invoiceCreateCommand } from './invoice-create.js';
// We'll add more subcommands here: pay, cancel, impair, etc.

export const invoiceCommand = Command.make('invoice', {}).pipe(
    Command.withDescription('Invoice operations'),
    Command.withSubcommands([invoiceCreateCommand]),
);
