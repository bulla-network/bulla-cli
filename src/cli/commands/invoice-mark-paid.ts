import { Command } from '@effect/cli';
import { invoiceMarkPaidBuildCommand } from './invoice-mark-paid-build.js';
import { invoiceMarkPaidExecuteCommand } from './invoice-mark-paid-execute.js';

export const invoiceMarkPaidCommand = Command.make('mark-paid', {}).pipe(
    Command.withDescription('Mark an invoice as paid'),
    Command.withSubcommands([invoiceMarkPaidBuildCommand, invoiceMarkPaidExecuteCommand]),
);
