import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';
import { encodeFunctionData } from 'viem';
import {
    buildCreateInvoice,
    buildCreateInvoiceWithMetadata,
    buildPayInvoice,
    buildCancelInvoice,
    buildImpairInvoice,
    buildMarkInvoiceAsPaid,
    buildUpdateBinding,
    buildSetPaidInvoiceCallback,
} from '../../../src/application/services/invoice-service.js';
import { RegistryService } from '../../../src/application/ports/registry-port.js';
import { InvoiceEncoderService } from '../../../src/application/ports/invoice-encoder-port.js';
import { bullaInvoiceAbi } from '../../../src/infrastructure/abi/bulla-invoice.js';
import type { EthAddress, Hex, ChainId } from '../../../src/domain/types/eth.js';
import type {
    CreateInvoiceParams,
    ClaimMetadata,
    PayInvoiceParams,
    CancelInvoiceParams,
    UpdateBindingParams,
    SetCallbackParams,
    InvoiceOperationParams,
} from '../../../src/domain/types/invoice.js';
import { ClaimBinding } from '../../../src/domain/types/invoice.js';
import { ZERO_ADDRESS } from '../../../src/domain/types/token.js';

const SEPOLIA_INVOICE_CONTRACT = '0xa2c4B7239A0d179A923751cC75277fe139AB092F' as EthAddress;
const DEBTOR = '0x1234567890abcdef1234567890abcdef12345678' as EthAddress;
const CREDITOR = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EthAddress;
const ERC20_TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as EthAddress;

const makeCreateInvoiceParams = (overrides: Partial<CreateInvoiceParams> = {}): CreateInvoiceParams => ({
    chainId: 11155111 as ChainId,
    debtor: DEBTOR,
    creditor: CREDITOR,
    claimAmount: 1000000000000000000n, // 1 ETH
    token: ZERO_ADDRESS,
    dueBy: 0n,
    deliveryDate: 0n,
    description: 'Test invoice',
    binding: ClaimBinding.Unbound,
    lateFeeConfig: {
        interestRateBps: 0,
        numberOfPeriodsPerYear: 0,
    },
    impairmentGracePeriod: 0n,
    depositAmount: 0n,
    ...overrides,
});

const makePayInvoiceParams = (overrides: Partial<PayInvoiceParams> = {}): PayInvoiceParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    paymentAmount: 1000000000000000000n,
    ...overrides,
});

const makeCancelInvoiceParams = (overrides: Partial<CancelInvoiceParams> = {}): CancelInvoiceParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    note: 'Cancellation note',
    ...overrides,
});

const makeUpdateBindingParams = (overrides: Partial<UpdateBindingParams> = {}): UpdateBindingParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    binding: ClaimBinding.Bound,
    ...overrides,
});

const makeSetCallbackParams = (overrides: Partial<SetCallbackParams> = {}): SetCallbackParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    callbackContract: '0x9999999999999999999999999999999999999999' as EthAddress,
    callbackSelector: '0x12345678',
    ...overrides,
});

const makeInvoiceOperationParams = (overrides: Partial<InvoiceOperationParams> = {}): InvoiceOperationParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    ...overrides,
});

// --- Test layers ---

const TestRegistryService = Layer.succeed(RegistryService, {
    getInstantPaymentAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getInvoiceAddress: () => Effect.succeed(SEPOLIA_INVOICE_CONTRACT),
});

/** Uses real viem encoding for golden-value tests. */
const TestInvoiceEncoder = Layer.succeed(InvoiceEncoderService, {
    encodeCreateInvoice: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'createInvoice',
                args: [
                    {
                        debtor: params.debtor as `0x${string}`,
                        creditor: params.creditor as `0x${string}`,
                        claimAmount: params.claimAmount,
                        dueBy: params.dueBy,
                        deliveryDate: params.deliveryDate,
                        description: params.description,
                        token: params.token as `0x${string}`,
                        binding: params.binding,
                        lateFeeConfig: params.lateFeeConfig,
                        impairmentGracePeriod: params.impairmentGracePeriod,
                        depositAmount: params.depositAmount,
                    },
                ],
            }) as Hex,
        ),
    encodeCreateInvoiceWithMetadata: (params, metadata) =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'createInvoiceWithMetadata',
                args: [
                    {
                        debtor: params.debtor as `0x${string}`,
                        creditor: params.creditor as `0x${string}`,
                        claimAmount: params.claimAmount,
                        dueBy: params.dueBy,
                        deliveryDate: params.deliveryDate,
                        description: params.description,
                        token: params.token as `0x${string}`,
                        binding: params.binding,
                        lateFeeConfig: params.lateFeeConfig,
                        impairmentGracePeriod: params.impairmentGracePeriod,
                        depositAmount: params.depositAmount,
                    },
                    metadata,
                ],
            }) as Hex,
        ),
    encodePayInvoice: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'payInvoice',
                args: [params.claimId, params.paymentAmount],
            }) as Hex,
        ),
    encodeCancelInvoice: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'cancelInvoice',
                args: [params.claimId, params.note],
            }) as Hex,
        ),
    encodeImpairInvoice: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'impairInvoice',
                args: [params.claimId],
            }) as Hex,
        ),
    encodeMarkInvoiceAsPaid: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'markInvoiceAsPaid',
                args: [params.claimId],
            }) as Hex,
        ),
    encodeUpdateBinding: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'updateBinding',
                args: [params.claimId, params.binding],
            }) as Hex,
        ),
    encodeSetPaidInvoiceCallback: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'setPaidInvoiceCallback',
                args: [params.claimId, params.callbackContract as `0x${string}`, params.callbackSelector as `0x${string}`],
            }) as Hex,
        ),
    encodeDeliverPurchaseOrder: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'deliverPurchaseOrder',
                args: [params.claimId],
            }) as Hex,
        ),
    encodeAcceptPurchaseOrder: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInvoiceAbi,
                functionName: 'acceptPurchaseOrder',
                args: [params.claimId],
            }) as Hex,
        ),
});

const BuildTestLayers = Layer.mergeAll(TestRegistryService, TestInvoiceEncoder);

// --- Tests ---

describe('buildCreateInvoice', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeCreateInvoiceParams();
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0" for native token invoices (deposit is not part of transaction value)', async () => {
        const params = makeCreateInvoiceParams({ tokenAddress: ZERO_ADDRESS, claimAmount: 500n });
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('sets value to "0" for native token invoices with deposits (deposit is not part of transaction value)', async () => {
        const params = makeCreateInvoiceParams({ token: ZERO_ADDRESS, claimAmount: 1000n, depositAmount: 200n });
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('sets value to "0" for ERC20 invoices without deposits', async () => {
        const params = makeCreateInvoiceParams({ token: ERC20_TOKEN, claimAmount: 1000n, depositAmount: 0n });
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('sets value to "0" for ERC20 invoices with deposits (deposit is not part of transaction value)', async () => {
        const params = makeCreateInvoiceParams({ token: ERC20_TOKEN, claimAmount: 1000n, depositAmount: 200n });
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the createInvoice function selector', async () => {
        const params = makeCreateInvoiceParams();
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        // Function selector is first 10 characters (0x + 8 hex chars)
        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('produces valid hex calldata for invoices with interest config', async () => {
        const params = makeCreateInvoiceParams({
            lateFeeConfig: { interestRateBps: 500, numberOfPeriodsPerYear: 12 },
        });
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]+$/);
    });

    it('produces valid hex calldata for bound invoices', async () => {
        const params = makeCreateInvoiceParams({ binding: ClaimBinding.Bound });
        const result = await Effect.runPromise(buildCreateInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]+$/);
        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
    });
});

describe('buildCreateInvoiceWithMetadata', () => {
    const metadata: ClaimMetadata = {
        claimMetadataHash: 'QmTest123',
        claimMetadataUrl: 'https://example.com/metadata',
        attachmentMetadataHash: 'QmAttachment456',
        attachmentMetadataUrl: 'https://example.com/attachment',
    };

    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeCreateInvoiceParams();
        const result = await Effect.runPromise(buildCreateInvoiceWithMetadata(params, metadata).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0" for native token invoices with metadata (deposit is not part of transaction value)', async () => {
        const params = makeCreateInvoiceParams({ token: ZERO_ADDRESS, claimAmount: 1000n, depositAmount: 200n });
        const result = await Effect.runPromise(buildCreateInvoiceWithMetadata(params, metadata).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the createInvoiceWithMetadata function selector', async () => {
        const params = makeCreateInvoiceParams();
        const result = await Effect.runPromise(buildCreateInvoiceWithMetadata(params, metadata).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildPayInvoice', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makePayInvoiceParams();
        const result = await Effect.runPromise(buildPayInvoice(params, ZERO_ADDRESS).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to payment amount for native token payments', async () => {
        const params = makePayInvoiceParams({ paymentAmount: 500n });
        const result = await Effect.runPromise(buildPayInvoice(params, ZERO_ADDRESS).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('500');
    });

    it('sets value to "0" for ERC20 payments', async () => {
        const params = makePayInvoiceParams({ paymentAmount: 1000n });
        const result = await Effect.runPromise(buildPayInvoice(params, ERC20_TOKEN).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the payInvoice function selector', async () => {
        const params = makePayInvoiceParams();
        const result = await Effect.runPromise(buildPayInvoice(params, ZERO_ADDRESS).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildCancelInvoice', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeCancelInvoiceParams();
        const result = await Effect.runPromise(buildCancelInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeCancelInvoiceParams();
        const result = await Effect.runPromise(buildCancelInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the cancelInvoice function selector', async () => {
        const params = makeCancelInvoiceParams();
        const result = await Effect.runPromise(buildCancelInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('produces valid hex calldata with empty note', async () => {
        const params = makeCancelInvoiceParams({ note: '' });
        const result = await Effect.runPromise(buildCancelInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]+$/);
    });
});

describe('buildImpairInvoice', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeInvoiceOperationParams();
        const result = await Effect.runPromise(buildImpairInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeInvoiceOperationParams();
        const result = await Effect.runPromise(buildImpairInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the impairInvoice function selector', async () => {
        const params = makeInvoiceOperationParams();
        const result = await Effect.runPromise(buildImpairInvoice(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildMarkInvoiceAsPaid', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeInvoiceOperationParams();
        const result = await Effect.runPromise(buildMarkInvoiceAsPaid(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeInvoiceOperationParams();
        const result = await Effect.runPromise(buildMarkInvoiceAsPaid(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the markInvoiceAsPaid function selector', async () => {
        const params = makeInvoiceOperationParams();
        const result = await Effect.runPromise(buildMarkInvoiceAsPaid(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildUpdateBinding', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeUpdateBindingParams();
        const result = await Effect.runPromise(buildUpdateBinding(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeUpdateBindingParams();
        const result = await Effect.runPromise(buildUpdateBinding(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the updateBinding function selector', async () => {
        const params = makeUpdateBindingParams();
        const result = await Effect.runPromise(buildUpdateBinding(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('produces valid hex calldata for all binding states', async () => {
        const unboundResult = await Effect.runPromise(
            buildUpdateBinding(makeUpdateBindingParams({ binding: ClaimBinding.Unbound })).pipe(Effect.provide(BuildTestLayers)),
        );
        const pendingResult = await Effect.runPromise(
            buildUpdateBinding(makeUpdateBindingParams({ binding: ClaimBinding.BindingPending })).pipe(Effect.provide(BuildTestLayers)),
        );
        const boundResult = await Effect.runPromise(
            buildUpdateBinding(makeUpdateBindingParams({ binding: ClaimBinding.Bound })).pipe(Effect.provide(BuildTestLayers)),
        );

        expect(unboundResult.data).toMatch(/^0x[0-9a-f]+$/);
        expect(pendingResult.data).toMatch(/^0x[0-9a-f]+$/);
        expect(boundResult.data).toMatch(/^0x[0-9a-f]+$/);
    });
});

describe('buildSetPaidInvoiceCallback', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeSetCallbackParams();
        const result = await Effect.runPromise(buildSetPaidInvoiceCallback(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_INVOICE_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeSetCallbackParams();
        const result = await Effect.runPromise(buildSetPaidInvoiceCallback(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the setPaidInvoiceCallback function selector', async () => {
        const params = makeSetCallbackParams();
        const result = await Effect.runPromise(buildSetPaidInvoiceCallback(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});
