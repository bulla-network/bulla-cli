import { Command } from '@effect/cli';
import { invoiceSetCallbackBuildCommand } from './invoice-set-callback-build.js';
import { invoiceSetCallbackExecuteCommand } from './invoice-set-callback-execute.js';

export const invoiceSetCallbackCommand = Command.make('set-callback', {}).pipe(
    Command.withDescription('Set paid invoice callback'),
    Command.withSubcommands([invoiceSetCallbackBuildCommand, invoiceSetCallbackExecuteCommand]),
);
