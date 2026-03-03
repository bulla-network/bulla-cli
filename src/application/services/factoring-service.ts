import { Effect } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type {
    ApproveInvoiceParams,
    CancelQueuedRedemptionParams,
    DepositParams,
    FundInvoiceParams,
    PoolOfferLoanParams,
    RedeemParams,
    UnfactorInvoiceParams,
    WithdrawParams,
} from '../../domain/types/factoring.js';
import type { UnsignedTransaction } from '../../domain/types/transaction.js';
import { FactoringEncoderService } from '../ports/factoring-encoder-port.js';
import { FactoringReaderService } from '../ports/factoring-reader-port.js';
import { RegistryService } from '../ports/registry-port.js';

export const buildDeposit = (
    params: DepositParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FactoringEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);
        const data = yield* encoder.encodeDeposit(params);

        return { to: params.poolAddress, value: '0', data, operation: 0 as const };
    });

export const buildRedeem = (
    params: RedeemParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FactoringEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);
        const data = yield* encoder.encodeRedeem(params);

        return { to: params.poolAddress, value: '0', data, operation: 0 as const };
    });

export const buildWithdraw = (
    params: WithdrawParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FactoringEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);
        const data = yield* encoder.encodeWithdraw(params);

        return { to: params.poolAddress, value: '0', data, operation: 0 as const };
    });

export const buildApproveInvoice = (
    params: ApproveInvoiceParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FactoringEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);
        const data = yield* encoder.encodeApproveInvoice(params);

        return { to: params.poolAddress, value: '0', data, operation: 0 as const };
    });

export const buildFundInvoice = (
    params: FundInvoiceParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FactoringEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);
        const data = yield* encoder.encodeFundInvoice(params);

        return { to: params.poolAddress, value: '0', data, operation: 0 as const };
    });

export const buildUnfactorInvoice = (
    params: UnfactorInvoiceParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FactoringEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);
        const data = yield* encoder.encodeUnfactorInvoice(params);

        return { to: params.poolAddress, value: '0', data, operation: 0 as const };
    });

export const buildOfferLoan = (
    params: PoolOfferLoanParams,
): Effect.Effect<UnsignedTransaction, ContractNotFoundError | UnsupportedChainError, RegistryService | FactoringEncoderService> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);
        const data = yield* encoder.encodeOfferLoan(params);

        return { to: params.poolAddress, value: '0', data, operation: 0 as const };
    });

export const buildCancelQueuedRedemption = (
    params: CancelQueuedRedemptionParams,
): Effect.Effect<
    readonly UnsignedTransaction[],
    ContractNotFoundError | UnsupportedChainError | Error,
    RegistryService | FactoringEncoderService | FactoringReaderService
> =>
    Effect.gen(function* () {
        const registry = yield* RegistryService;
        const encoder = yield* FactoringEncoderService;
        const reader = yield* FactoringReaderService;

        yield* registry.validateFactoringPool(params.chainId, params.poolAddress);

        const queueAddress = yield* reader.getRedemptionQueueAddress(params.poolAddress);
        const queueIndexes = yield* reader.getQueuedRedemptionsForOwner(queueAddress, params.owner);

        if (queueIndexes.length === 0) {
            return [] as readonly UnsignedTransaction[];
        }

        const txs: UnsignedTransaction[] = [];
        for (const queueIndex of queueIndexes) {
            const data = yield* encoder.encodeCancelQueuedRedemption(queueIndex);
            txs.push({ to: queueAddress, value: '0', data, operation: 0 as const });
        }

        return txs;
    });
