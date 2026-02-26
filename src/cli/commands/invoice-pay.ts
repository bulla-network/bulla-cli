import { Command } from '@effect/cli';
import { invoicePayBuildCommand } from './invoice-pay-build.js';
import { invoicePayExecuteCommand } from './invoice-pay-execute.js';

export const invoicePayCommand = Command.make('pay', {}).pipe(
    Command.withDescription('Pay an invoice'),
    Command.withSubcommands([invoicePayBuildCommand, invoicePayExecuteCommand]),
);
