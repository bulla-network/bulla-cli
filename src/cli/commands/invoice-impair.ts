import { Command } from '@effect/cli';
import { invoiceImpairBuildCommand } from './invoice-impair-build.js';
import { invoiceImpairExecuteCommand } from './invoice-impair-execute.js';

export const invoiceImpairCommand = Command.make('impair', {}).pipe(
    Command.withDescription('Mark an invoice as impaired'),
    Command.withSubcommands([invoiceImpairBuildCommand, invoiceImpairExecuteCommand]),
);
