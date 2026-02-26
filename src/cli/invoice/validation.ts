import { Effect, Console, Either } from 'effect';
import { validateAddress, validateAmount, validateAmountOrZero } from '../../domain/validation/eth.js';
import { isChainId } from '../../domain/types/eth.js';
import type { ChainId } from '../../domain/types/eth.js';
import type {
    CreateInvoiceParams,
    PayInvoiceParams,
    CancelInvoiceParams,
    InvoiceOperationParams,
    UpdateBindingParams,
    SetCallbackParams,
    AcceptPurchaseOrderParams,
    ClaimBinding,
} from '../../domain/types/invoice.js';
import type { EthAddress } from '../../domain/types/eth.js';

/** Validate parameters for creating an invoice */
export const validateCreateInvoiceParams = (
    chain: number,
    debtor: string,
    creditor: string,
    claimAmount: string,
    token: string,
    dueBy: number,
    deliveryDate: number,
    description: string,
    binding: number,
    interestRateBps: number,
    periodsPerYear: number,
    impairmentGracePeriod: number,
    depositAmount: string,
): Effect.Effect<CreateInvoiceParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        const debtorResult = validateAddress(debtor);
        if (Either.isLeft(debtorResult)) {
            yield* Console.error(`Invalid debtor address: ${debtorResult.left.message}`);
            return undefined;
        }

        const creditorResult = validateAddress(creditor);
        if (Either.isLeft(creditorResult)) {
            yield* Console.error(`Invalid creditor address: ${creditorResult.left.message}`);
            return undefined;
        }

        const claimAmountResult = validateAmount(claimAmount);
        if (Either.isLeft(claimAmountResult)) {
            yield* Console.error(`Invalid claim amount: ${claimAmountResult.left.message}`);
            return undefined;
        }

        const tokenResult = validateAddress(token);
        if (Either.isLeft(tokenResult)) {
            yield* Console.error(`Invalid token address: ${tokenResult.left.message}`);
            return undefined;
        }

        const depositAmountResult = validateAmountOrZero(depositAmount);
        if (Either.isLeft(depositAmountResult)) {
            yield* Console.error(`Invalid deposit amount: ${depositAmountResult.left.message}`);
            return undefined;
        }

        // Validate binding enum
        if (binding < 0 || binding > 2) {
            yield* Console.error(`Invalid binding value: ${binding}. Must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)`);
            return undefined;
        }

        return {
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
    });

/** Validate parameters for paying an invoice */
export const validatePayInvoiceParams = (
    chain: number,
    claimId: number,
    paymentAmount: string,
    token: string,
): Effect.Effect<{ params: PayInvoiceParams; tokenAddress: EthAddress } | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        const tokenResult = validateAddress(token);
        if (Either.isLeft(tokenResult)) {
            yield* Console.error(`Invalid token address: ${tokenResult.left.message}`);
            return undefined;
        }

        const amountResult = validateAmount(paymentAmount);
        if (Either.isLeft(amountResult)) {
            yield* Console.error(`Invalid payment amount: ${amountResult.left.message}`);
            return undefined;
        }

        return {
            params: {
                chainId: chain,
                claimId: BigInt(claimId),
                paymentAmount: amountResult.right,
            },
            tokenAddress: tokenResult.right,
        };
    });

/** Validate parameters for canceling an invoice */
export const validateCancelInvoiceParams = (
    chain: number,
    claimId: number,
    note: string,
): Effect.Effect<CancelInvoiceParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        return {
            chainId: chain,
            claimId: BigInt(claimId),
            note: note.trim(),
        };
    });

/** Validate parameters for impairing an invoice */
export const validateImpairInvoiceParams = (
    chain: number,
    claimId: number,
): Effect.Effect<InvoiceOperationParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        return {
            chainId: chain,
            claimId: BigInt(claimId),
        };
    });

/** Validate parameters for marking invoice as paid */
export const validateMarkInvoiceAsPaidParams = (
    chain: number,
    claimId: number,
): Effect.Effect<InvoiceOperationParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        return {
            chainId: chain,
            claimId: BigInt(claimId),
        };
    });

/** Validate parameters for updating binding */
export const validateUpdateBindingParams = (
    chain: number,
    claimId: number,
    binding: number,
): Effect.Effect<UpdateBindingParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        // Validate binding enum
        if (binding < 0 || binding > 2) {
            yield* Console.error(`Invalid binding value: ${binding}. Must be 0 (Unbound), 1 (BindingPending), or 2 (Bound)`);
            return undefined;
        }

        return {
            chainId: chain,
            claimId: BigInt(claimId),
            binding: binding as ClaimBinding,
        };
    });

/** Validate parameters for setting paid invoice callback */
export const validateSetPaidInvoiceCallbackParams = (
    chain: number,
    loanId: number,
    callbackContract: string,
    callbackSelector: string,
): Effect.Effect<SetCallbackParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        const contractResult = validateAddress(callbackContract);
        if (Either.isLeft(contractResult)) {
            yield* Console.error(`Invalid callback contract: ${contractResult.left.message}`);
            return undefined;
        }

        if (!callbackSelector.startsWith('0x') || callbackSelector.length !== 10) {
            yield* Console.error(
                `Invalid callback selector: ${callbackSelector}. Must be a bytes4 hex string (e.g., 0x12345678)`,
            );
            return undefined;
        }

        return {
            chainId: chain,
            loanId: BigInt(loanId),
            callbackContract: contractResult.right,
            callbackSelector,
        };
    });

/** Validate parameters for accepting purchase order */
export const validateAcceptPurchaseOrderParams = (
    chain: number,
    claimId: number,
    depositAmount: string,
): Effect.Effect<AcceptPurchaseOrderParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        const depositResult = validateAmountOrZero(depositAmount);
        if (Either.isLeft(depositResult)) {
            yield* Console.error(`Invalid deposit amount: ${depositResult.left.message}`);
            return undefined;
        }

        return {
            chainId: chain,
            claimId: BigInt(claimId),
            depositAmount: depositResult.right,
        };
    });

/** Validate parameters for delivering purchase order */
export const validateDeliverPurchaseOrderParams = (
    chain: number,
    claimId: number,
): Effect.Effect<InvoiceOperationParams | undefined, never, never> =>
    Effect.gen(function* () {
        if (!isChainId(chain)) {
            yield* Console.error(`Unsupported chain ID: ${chain}`);
            return undefined;
        }

        return {
            chainId: chain,
            claimId: BigInt(claimId),
        };
    });
