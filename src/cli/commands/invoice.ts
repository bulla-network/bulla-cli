import { Command } from '@effect/cli';
import { invoiceCreateCommand } from './invoice-create.js';
import { invoicePayCommand } from './invoice-pay.js';
import { invoiceUpdateBindingCommand } from './invoice-update-binding.js';
import { invoiceSetCallbackCommand } from './invoice-set-callback.js';
import { invoiceCancelCommand } from './invoice-cancel.js';
import { invoiceImpairCommand } from './invoice-impair.js';
import { invoiceMarkPaidCommand } from './invoice-mark-paid.js';
import { invoiceDeliverPoCommand } from './invoice-deliver-po.js';
import { invoiceAcceptPoCommand } from './invoice-accept-po.js';

export const invoiceCommand = Command.make('invoice', {}).pipe(
    Command.withDescription('Invoice operations'),
    Command.withSubcommands([
        invoiceCreateCommand,
        invoicePayCommand,
        invoiceUpdateBindingCommand,
        invoiceSetCallbackCommand,
        invoiceCancelCommand,
        invoiceImpairCommand,
        invoiceMarkPaidCommand,
        invoiceDeliverPoCommand,
        invoiceAcceptPoCommand,
    ]),
);
