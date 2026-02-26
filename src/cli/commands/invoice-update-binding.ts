import { Command } from '@effect/cli';
import { invoiceUpdateBindingBuildCommand } from './invoice-update-binding-build.js';
import { invoiceUpdateBindingExecuteCommand } from './invoice-update-binding-execute.js';

export const invoiceUpdateBindingCommand = Command.make('update-binding', {}).pipe(
    Command.withDescription('Update invoice binding status'),
    Command.withSubcommands([invoiceUpdateBindingBuildCommand, invoiceUpdateBindingExecuteCommand]),
);
