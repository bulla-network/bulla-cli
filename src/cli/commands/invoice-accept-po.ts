import { Command } from '@effect/cli';
import { invoiceAcceptPoBuildCommand } from './invoice-accept-po-build.js';
import { invoiceAcceptPoExecuteCommand } from './invoice-accept-po-execute.js';

export const invoiceAcceptPoCommand = Command.make('accept-po', {}).pipe(
    Command.withDescription('Accept a purchase order'),
    Command.withSubcommands([invoiceAcceptPoBuildCommand, invoiceAcceptPoExecuteCommand]),
);
