import { Command } from '@effect/cli';
import { invoiceCreateBuildCommand } from './invoice-create-build.js';
// import { invoiceCreateExecuteCommand } from './invoice-create-execute.js'; // We'll create this next

export const invoiceCreateCommand = Command.make('create', {}).pipe(
    Command.withDescription('Create a new invoice'),
    Command.withSubcommands([invoiceCreateBuildCommand /* , invoiceCreateExecuteCommand */]),
);
