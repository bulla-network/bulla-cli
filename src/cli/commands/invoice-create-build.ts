import { Command } from '@effect/cli';
import { Console, Effect, Either } from 'effect';
import { buildCreateInvoice } from '../../application/services/invoice-service.js';
import { isChainId } from '../../domain/types/eth.js';
import { validateAddress, validateAmount, validateAmountOrZero } from '../../domain/validation/eth.js';
import { ClaimBinding } from '../../domain/types/invoice.js';
import { formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption } from '../options/common.js';
import { tokenOption } from '../options/pay-options.js';
import {
    debtorOption,
    creditorOption,
    claimAmountOption,
    dueByOption,
    deliveryDateOption,
    descriptionOption,
    bindingOption,
    interestRateBpsOption,
    periodsPerYearOption,
    impairmentGracePeriodOption,
    depositAmountOption,
} from '../options/invoice-options.js';

export const invoiceCreateBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        debtor: debtorOption,
        creditor: creditorOption,
        claimAmount: claimAmountOption,
        token: tokenOption,
        dueBy: dueByOption,
        deliveryDate: deliveryDateOption,
        description: descriptionOption,
        binding: bindingOption,
        interestRateBps: interestRateBpsOption,
        periodsPerYear: periodsPerYearOption,
        impairmentGracePeriod: impairmentGracePeriodOption,
        depositAmount: depositAmountOption,
        format: formatOption,
    },
    ({
        chain,
        debtor,
        creditor,
        claimAmount,
        token,
        dueBy,
        deliveryDate,
        description,
        binding,
        interestRateBps,
        periodsPerYear,
        impairmentGracePeriod,
        depositAmount,
        format,
    }) =>
        Effect.gen(function* () {
            if (!isChainId(chain)) {
                yield* Console.error(`Unsupported chain ID: ${chain}`);
                return;
            }

            // Validate addresses
            const debtorResult = validateAddress(debtor);
            if (Either.isLeft(debtorResult)) {
                yield* Console.error(`Invalid debtor address: ${debtorResult.left.message}`);
                return;
            }

            const creditorResult = validateAddress(creditor);
            if (Either.isLeft(creditorResult)) {
                yield* Console.error(`Invalid creditor address: ${creditorResult.left.message}`);
                return;
            }

            const tokenResult = validateAddress(token);
            if (Either.isLeft(tokenResult)) {
                yield* Console.error(`Invalid token address: ${tokenResult.left.message}`);
                return;
            }

            // Validate amounts
            const claimAmountResult = validateAmount(claimAmount);
            if (Either.isLeft(claimAmountResult)) {
                yield* Console.error(`Invalid claim amount: ${claimAmountResult.left.message}`);
                return;
            }

            const depositAmountResult = validateAmountOrZero(depositAmount);
            if (Either.isLeft(depositAmountResult)) {
                yield* Console.error(`Invalid deposit amount: ${depositAmountResult.left.message}`);
                return;
            }

            // Validate binding enum
            if (binding < 0 || binding > 2) {
                yield* Console.error(`Invalid binding value: ${binding}. Must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)`);
                return;
            }

            const params = {
                chainId: chain,
                debtor: debtorResult.right,
                creditor: creditorResult.right,
                claimAmount: claimAmountResult.right,
                token: tokenResult.right,
                dueBy: BigInt(dueBy),
                deliveryDate: BigInt(deliveryDate),
                description,
                binding: binding as ClaimBinding,
                lateFeeConfig: {
                    interestRateBps,
                    numberOfPeriodsPerYear: periodsPerYear,
                },
                impairmentGracePeriod: BigInt(impairmentGracePeriod),
                depositAmount: depositAmountResult.right,
            };

            const tx = yield* buildCreateInvoice(params);
            const output = formatTransaction(tx, params.chainId, format as OutputFormat);
            yield* Console.log(output);
        }),
).pipe(Command.withDescription('Build an unsigned createInvoice transaction (no private key required)'));
