import { Command } from '@effect/cli';
import { invoiceDeliverPoBuildCommand } from './invoice-deliver-po-build.js';
import { invoiceDeliverPoExecuteCommand } from './invoice-deliver-po-execute.js';

export const invoiceDeliverPoCommand = Command.make('deliver-po', {}).pipe(
    Command.withDescription('Deliver a purchase order'),
    Command.withSubcommands([invoiceDeliverPoBuildCommand, invoiceDeliverPoExecuteCommand]),
);
