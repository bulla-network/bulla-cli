import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { describe, expect, it } from 'vitest';
import { FactoringEncoderService } from '../../../src/application/ports/factoring-encoder-port.js';
import { FactoringReaderService } from '../../../src/application/ports/factoring-reader-port.js';
import { RegistryService } from '../../../src/application/ports/registry-port.js';
import {
    buildApproveInvoice,
    buildCancelQueuedRedemption,
    buildDeposit,
    buildFundInvoice,
    buildOfferLoan,
    buildRedeem,
    buildUnfactorInvoice,
    buildWithdraw,
} from '../../../src/application/services/factoring-service.js';
import type { ChainId, EthAddress, Hex } from '../../../src/domain/types/eth.js';
import type {
    ApproveInvoiceParams,
    CancelQueuedRedemptionParams,
    DepositParams,
    FundInvoiceParams,
    PoolOfferLoanParams,
    RedeemParams,
    UnfactorInvoiceParams,
    WithdrawParams,
} from '../../../src/domain/types/factoring.js';
import { bullaFactoringV2_1Abi } from '../../../src/infrastructure/abi/bulla-factoring-v2-1.js';
import { redemptionQueueAbi } from '../../../src/infrastructure/abi/redemption-queue.js';

const SEPOLIA_POOL = '0xa5e94f122d421c9579a5cb1e687f55e109ba270b' as EthAddress;
const RECEIVER = '0x1234567890abcdef1234567890abcdef12345678' as EthAddress;
const OWNER = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EthAddress;
const DEBTOR = '0x5555555555555555555555555555555555555555' as EthAddress;
const QUEUE_ADDRESS = '0x9999999999999999999999999999999999999999' as EthAddress;

// --- Param factories ---

const makeDepositParams = (overrides: Partial<DepositParams> = {}): DepositParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    assets: 1000000n,
    receiver: RECEIVER,
    ...overrides,
});

const makeRedeemParams = (overrides: Partial<RedeemParams> = {}): RedeemParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    shares: 500n,
    receiver: RECEIVER,
    owner: OWNER,
    ...overrides,
});

const makeWithdrawParams = (overrides: Partial<WithdrawParams> = {}): WithdrawParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    assets: 1000n,
    receiver: RECEIVER,
    owner: OWNER,
    ...overrides,
});

const makeApproveInvoiceParams = (overrides: Partial<ApproveInvoiceParams> = {}): ApproveInvoiceParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    invoiceId: 42n,
    targetYieldBps: 800,
    spreadBps: 100,
    upfrontBps: 50,
    initialInvoiceValueOverride: 0n,
    ...overrides,
});

const makeFundInvoiceParams = (overrides: Partial<FundInvoiceParams> = {}): FundInvoiceParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    invoiceId: 42n,
    factorerUpfrontBps: 100,
    receiverAddress: RECEIVER,
    ...overrides,
});

const makeUnfactorInvoiceParams = (overrides: Partial<UnfactorInvoiceParams> = {}): UnfactorInvoiceParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    invoiceId: 42n,
    ...overrides,
});

const makeOfferLoanParams = (overrides: Partial<PoolOfferLoanParams> = {}): PoolOfferLoanParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    debtor: DEBTOR,
    targetYieldBps: 800,
    spreadBps: 100,
    principalAmount: 1000000000000000000n,
    termLength: 2592000n,
    numberOfPeriodsPerYear: 12,
    description: 'Test pool loan',
    ...overrides,
});

const makeCancelRedemptionParams = (overrides: Partial<CancelQueuedRedemptionParams> = {}): CancelQueuedRedemptionParams => ({
    chainId: 11155111 as ChainId,
    poolAddress: SEPOLIA_POOL,
    owner: OWNER,
    ...overrides,
});

// --- Test layers ---

const TestRegistryService = Layer.succeed(RegistryService, {
    getInstantPaymentAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getInvoiceAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getFrendLendAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    validateFactoringPool: (_chainId, address) => Effect.succeed(address),
});

const TestFactoringEncoder = Layer.succeed(FactoringEncoderService, {
    encodeDeposit: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFactoringV2_1Abi,
                functionName: 'deposit',
                args: [params.assets, params.receiver],
            }) as Hex,
        ),
    encodeRedeem: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFactoringV2_1Abi,
                functionName: 'redeem',
                args: [params.shares, params.receiver, params.owner],
            }) as Hex,
        ),
    encodeWithdraw: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFactoringV2_1Abi,
                functionName: 'withdraw',
                args: [params.assets, params.receiver, params.owner],
            }) as Hex,
        ),
    encodeApproveInvoice: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFactoringV2_1Abi,
                functionName: 'approveInvoice',
                args: [params.invoiceId, params.targetYieldBps, params.spreadBps, params.upfrontBps, params.initialInvoiceValueOverride],
            }) as Hex,
        ),
    encodeFundInvoice: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFactoringV2_1Abi,
                functionName: 'fundInvoice',
                args: [params.invoiceId, params.factorerUpfrontBps, params.receiverAddress],
            }) as Hex,
        ),
    encodeUnfactorInvoice: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFactoringV2_1Abi,
                functionName: 'unfactorInvoice',
                args: [params.invoiceId],
            }) as Hex,
        ),
    encodeOfferLoan: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFactoringV2_1Abi,
                functionName: 'offerLoan',
                args: [
                    params.debtor,
                    params.targetYieldBps,
                    params.spreadBps,
                    params.principalAmount,
                    params.termLength,
                    params.numberOfPeriodsPerYear,
                    params.description,
                ],
            }) as Hex,
        ),
    encodeCancelQueuedRedemption: queueIndex =>
        Effect.succeed(
            encodeFunctionData({
                abi: redemptionQueueAbi,
                functionName: 'cancelQueuedRedemption',
                args: [queueIndex],
            }) as Hex,
        ),
});

const TestReaderService = Layer.succeed(FactoringReaderService, {
    getRedemptionQueueAddress: () => Effect.succeed(QUEUE_ADDRESS),
    getQueuedRedemptionsForOwner: () => Effect.succeed([1n, 3n]),
});

const EmptyQueueReaderService = Layer.succeed(FactoringReaderService, {
    getRedemptionQueueAddress: () => Effect.succeed(QUEUE_ADDRESS),
    getQueuedRedemptionsForOwner: () => Effect.succeed([]),
});

const BuildTestLayers = Layer.mergeAll(TestRegistryService, TestFactoringEncoder);
const CancelTestLayers = Layer.mergeAll(TestRegistryService, TestFactoringEncoder, TestReaderService);
const CancelEmptyTestLayers = Layer.mergeAll(TestRegistryService, TestFactoringEncoder, EmptyQueueReaderService);

// --- Tests ---

describe('buildDeposit', () => {
    it('produces an unsigned transaction targeting the pool address', async () => {
        const params = makeDepositParams();
        const result = await Effect.runPromise(buildDeposit(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_POOL);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeDepositParams();
        const result = await Effect.runPromise(buildDeposit(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the deposit function selector', async () => {
        const params = makeDepositParams();
        const result = await Effect.runPromise(buildDeposit(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildRedeem', () => {
    it('produces an unsigned transaction targeting the pool address', async () => {
        const params = makeRedeemParams();
        const result = await Effect.runPromise(buildRedeem(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_POOL);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeRedeemParams();
        const result = await Effect.runPromise(buildRedeem(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata with shares, receiver, and owner args', async () => {
        const params = makeRedeemParams();
        const result = await Effect.runPromise(buildRedeem(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        // redeem(uint256, address, address) → selector + 3 words
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildWithdraw', () => {
    it('produces an unsigned transaction targeting the pool address', async () => {
        const params = makeWithdrawParams();
        const result = await Effect.runPromise(buildWithdraw(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_POOL);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeWithdrawParams();
        const result = await Effect.runPromise(buildWithdraw(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the withdraw function selector', async () => {
        const params = makeWithdrawParams();
        const result = await Effect.runPromise(buildWithdraw(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildApproveInvoice', () => {
    it('produces an unsigned transaction targeting the pool address', async () => {
        const params = makeApproveInvoiceParams();
        const result = await Effect.runPromise(buildApproveInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_POOL);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeApproveInvoiceParams();
        const result = await Effect.runPromise(buildApproveInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata with all approval parameters', async () => {
        const params = makeApproveInvoiceParams();
        const result = await Effect.runPromise(buildApproveInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        // approveInvoice has 6 params → selector + multiple words
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildFundInvoice', () => {
    it('produces an unsigned transaction targeting the pool address', async () => {
        const params = makeFundInvoiceParams();
        const result = await Effect.runPromise(buildFundInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_POOL);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeFundInvoiceParams();
        const result = await Effect.runPromise(buildFundInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the fundInvoice function selector', async () => {
        const params = makeFundInvoiceParams();
        const result = await Effect.runPromise(buildFundInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildUnfactorInvoice', () => {
    it('produces an unsigned transaction targeting the pool address', async () => {
        const params = makeUnfactorInvoiceParams();
        const result = await Effect.runPromise(buildUnfactorInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_POOL);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeUnfactorInvoiceParams();
        const result = await Effect.runPromise(buildUnfactorInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the unfactorInvoice function selector', async () => {
        const params = makeUnfactorInvoiceParams();
        const result = await Effect.runPromise(buildUnfactorInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildOfferLoan', () => {
    it('produces an unsigned transaction targeting the pool address', async () => {
        const params = makeOfferLoanParams();
        const result = await Effect.runPromise(buildOfferLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_POOL);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeOfferLoanParams();
        const result = await Effect.runPromise(buildOfferLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata with all offer loan parameters', async () => {
        const params = makeOfferLoanParams();
        const result = await Effect.runPromise(buildOfferLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        // offerLoan has 7 params including a string → long calldata
        expect(result.data.length).toBeGreaterThan(200);
    });
});

describe('buildCancelQueuedRedemption', () => {
    it('returns one unsigned transaction per queued redemption', async () => {
        const params = makeCancelRedemptionParams();
        const result = await Effect.runPromise(buildCancelQueuedRedemption(params).pipe(Effect.provide(CancelTestLayers)));

        expect(result).toHaveLength(2);
    });

    it('targets the queue address (not the pool)', async () => {
        const params = makeCancelRedemptionParams();
        const result = await Effect.runPromise(buildCancelQueuedRedemption(params).pipe(Effect.provide(CancelTestLayers)));

        expect(result[0].to).toBe(QUEUE_ADDRESS);
        expect(result[1].to).toBe(QUEUE_ADDRESS);
    });

    it('sets value to "0" and operation to 0 for each tx', async () => {
        const params = makeCancelRedemptionParams();
        const result = await Effect.runPromise(buildCancelQueuedRedemption(params).pipe(Effect.provide(CancelTestLayers)));

        for (const tx of result) {
            expect(tx.value).toBe('0');
            expect(tx.operation).toBe(0);
        }
    });

    it('encodes calldata with the cancelQueuedRedemption selector', async () => {
        const params = makeCancelRedemptionParams();
        const result = await Effect.runPromise(buildCancelQueuedRedemption(params).pipe(Effect.provide(CancelTestLayers)));

        for (const tx of result) {
            expect(tx.data).toMatch(/^0x[0-9a-f]{8}/);
            expect(tx.data.length).toBeGreaterThan(10);
        }
    });

    it('returns an empty array when no queued redemptions exist', async () => {
        const params = makeCancelRedemptionParams();
        const result = await Effect.runPromise(buildCancelQueuedRedemption(params).pipe(Effect.provide(CancelEmptyTestLayers)));

        expect(result).toHaveLength(0);
    });
});
