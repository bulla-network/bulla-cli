import { Command } from '@effect/cli';
import { invoiceCancelBuildCommand } from './invoice-cancel-build.js';
import { invoiceCancelExecuteCommand } from './invoice-cancel-execute.js';

export const invoiceCancelCommand = Command.make('cancel', {}).pipe(
    Command.withDescription('Cancel an invoice'),
    Command.withSubcommands([invoiceCancelBuildCommand, invoiceCancelExecuteCommand]),
);
