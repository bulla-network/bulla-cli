import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { describe, expect, it } from 'vitest';
import { FrendLendEncoderService } from '../../../src/application/ports/frendlend-encoder-port.js';
import { RegistryService } from '../../../src/application/ports/registry-port.js';
import {
    buildAcceptLoan,
    buildImpairLoan,
    buildMarkLoanAsPaid,
    buildOfferLoan,
    buildPayLoan,
    buildRejectLoanOffer,
    buildSetPaidLoanCallback,
} from '../../../src/application/services/frendlend-service.js';
import type { ChainId, EthAddress, Hex } from '../../../src/domain/types/eth.js';
import type {
    AcceptLoanParams,
    LoanOperationParams,
    OfferLoanParams,
    PayLoanParams,
    RejectLoanOfferParams,
    SetLoanCallbackParams,
} from '../../../src/domain/types/frendlend.js';
import { ZERO_ADDRESS } from '../../../src/domain/types/token.js';
import { bullaFrendLendV2Abi } from '../../../src/infrastructure/abi/bulla-frendlend-v2.js';

const SEPOLIA_FRENDLEND_CONTRACT = '0x4d6A66D32CF34270e4cc9C9F201CA4dB650Be3f2' as EthAddress;
const DEBTOR = '0x1234567890abcdef1234567890abcdef12345678' as EthAddress;
const CREDITOR = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EthAddress;

const makeOfferLoanParams = (overrides: Partial<OfferLoanParams> = {}): OfferLoanParams => ({
    chainId: 11155111 as ChainId,
    termLength: 2592000n, // 30 days
    interestConfig: { interestRateBps: 500, numberOfPeriodsPerYear: 12 },
    loanAmount: 1000000000000000000n,
    creditor: CREDITOR,
    debtor: DEBTOR,
    description: 'Test loan',
    token: ZERO_ADDRESS,
    impairmentGracePeriod: 0n,
    expiresAt: 0n,
    callbackContract: ZERO_ADDRESS,
    callbackSelector: '0x00000000' as Hex,
    ...overrides,
});

const makeRejectLoanOfferParams = (overrides: Partial<RejectLoanOfferParams> = {}): RejectLoanOfferParams => ({
    chainId: 11155111 as ChainId,
    offerId: 1n,
    ...overrides,
});

const makeAcceptLoanParams = (overrides: Partial<AcceptLoanParams> = {}): AcceptLoanParams => ({
    chainId: 11155111 as ChainId,
    offerId: 1n,
    ...overrides,
});

const makePayLoanParams = (overrides: Partial<PayLoanParams> = {}): PayLoanParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    paymentAmount: 1000000000000000000n,
    ...overrides,
});

const makeLoanOperationParams = (overrides: Partial<LoanOperationParams> = {}): LoanOperationParams => ({
    chainId: 11155111 as ChainId,
    claimId: 1n,
    ...overrides,
});

const makeSetLoanCallbackParams = (overrides: Partial<SetLoanCallbackParams> = {}): SetLoanCallbackParams => ({
    chainId: 11155111 as ChainId,
    loanId: 1n,
    callbackContract: '0x9999999999999999999999999999999999999999' as EthAddress,
    callbackSelector: '0x12345678' as Hex,
    ...overrides,
});

// --- Test layers ---

const TestRegistryService = Layer.succeed(RegistryService, {
    getInstantPaymentAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getInvoiceAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getFrendLendAddress: () => Effect.succeed(SEPOLIA_FRENDLEND_CONTRACT),
});

const TestFrendLendEncoder = Layer.succeed(FrendLendEncoderService, {
    encodeOfferLoan: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFrendLendV2Abi,
                functionName: 'offerLoan',
                args: [
                    {
                        termLength: params.termLength,
                        interestConfig: params.interestConfig,
                        loanAmount: params.loanAmount,
                        creditor: params.creditor as `0x${string}`,
                        debtor: params.debtor as `0x${string}`,
                        description: params.description,
                        token: params.token as `0x${string}`,
                        impairmentGracePeriod: params.impairmentGracePeriod,
                        expiresAt: params.expiresAt,
                        callbackContract: params.callbackContract as `0x${string}`,
                        callbackSelector: params.callbackSelector,
                    },
                ],
            }) as Hex,
        ),
    encodeOfferLoanWithMetadata: (params, metadata) =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFrendLendV2Abi,
                functionName: 'offerLoanWithMetadata',
                args: [
                    {
                        termLength: params.termLength,
                        interestConfig: params.interestConfig,
                        loanAmount: params.loanAmount,
                        creditor: params.creditor as `0x${string}`,
                        debtor: params.debtor as `0x${string}`,
                        description: params.description,
                        token: params.token as `0x${string}`,
                        impairmentGracePeriod: params.impairmentGracePeriod,
                        expiresAt: params.expiresAt,
                        callbackContract: params.callbackContract as `0x${string}`,
                        callbackSelector: params.callbackSelector,
                    },
                    metadata,
                ],
            }) as Hex,
        ),
    encodeRejectLoanOffer: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFrendLendV2Abi,
                functionName: 'rejectLoanOffer',
                args: [params.offerId],
            }) as Hex,
        ),
    encodeAcceptLoan: params =>
        Effect.succeed(
            (params.receiver
                ? encodeFunctionData({
                      abi: bullaFrendLendV2Abi,
                      functionName: 'acceptLoanWithReceiver',
                      args: [params.offerId, params.receiver as `0x${string}`],
                  })
                : encodeFunctionData({
                      abi: bullaFrendLendV2Abi,
                      functionName: 'acceptLoan',
                      args: [params.offerId],
                  })) as Hex,
        ),
    encodePayLoan: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFrendLendV2Abi,
                functionName: 'payLoan',
                args: [params.claimId, params.paymentAmount],
            }) as Hex,
        ),
    encodeImpairLoan: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFrendLendV2Abi,
                functionName: 'impairLoan',
                args: [params.claimId],
            }) as Hex,
        ),
    encodeMarkLoanAsPaid: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFrendLendV2Abi,
                functionName: 'markLoanAsPaid',
                args: [params.claimId],
            }) as Hex,
        ),
    encodeSetPaidLoanCallback: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaFrendLendV2Abi,
                functionName: 'setPaidLoanCallback',
                args: [params.loanId, params.callbackContract as `0x${string}`, params.callbackSelector],
            }) as Hex,
        ),
});

const BuildTestLayers = Layer.mergeAll(TestRegistryService, TestFrendLendEncoder);

// --- Tests ---

describe('buildOfferLoan', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeOfferLoanParams();
        const result = await Effect.runPromise(buildOfferLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeOfferLoanParams();
        const result = await Effect.runPromise(buildOfferLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the offerLoan function selector', async () => {
        const params = makeOfferLoanParams();
        const result = await Effect.runPromise(buildOfferLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('uses offerLoanWithMetadata when metadata is provided', async () => {
        const params = makeOfferLoanParams({
            metadata: { tokenURI: 'https://example.com/meta', attachmentURI: 'https://example.com/attach' },
        });
        const result = await Effect.runPromise(buildOfferLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
    });
});

describe('buildRejectLoanOffer', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeRejectLoanOfferParams();
        const result = await Effect.runPromise(buildRejectLoanOffer(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeRejectLoanOfferParams();
        const result = await Effect.runPromise(buildRejectLoanOffer(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the rejectLoanOffer function selector', async () => {
        const params = makeRejectLoanOfferParams();
        const result = await Effect.runPromise(buildRejectLoanOffer(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildAcceptLoan', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeAcceptLoanParams();
        const result = await Effect.runPromise(buildAcceptLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('always sets value to "0" (no native token support)', async () => {
        const params = makeAcceptLoanParams();
        const result = await Effect.runPromise(buildAcceptLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the acceptLoan function selector', async () => {
        const params = makeAcceptLoanParams();
        const result = await Effect.runPromise(buildAcceptLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('uses acceptLoanWithReceiver when receiver is provided', async () => {
        const receiver = '0x5555555555555555555555555555555555555555' as EthAddress;
        const params = makeAcceptLoanParams({ receiver });
        const result = await Effect.runPromise(buildAcceptLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        // acceptLoanWithReceiver has a longer calldata than acceptLoan due to the extra address arg
        expect(result.data.length).toBeGreaterThan(70);
    });
});

describe('buildPayLoan', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makePayLoanParams();
        const result = await Effect.runPromise(buildPayLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('always sets value to "0" (no native token support)', async () => {
        const params = makePayLoanParams();
        const result = await Effect.runPromise(buildPayLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the payLoan function selector', async () => {
        const params = makePayLoanParams();
        const result = await Effect.runPromise(buildPayLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildImpairLoan', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeLoanOperationParams();
        const result = await Effect.runPromise(buildImpairLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeLoanOperationParams();
        const result = await Effect.runPromise(buildImpairLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the impairLoan function selector', async () => {
        const params = makeLoanOperationParams();
        const result = await Effect.runPromise(buildImpairLoan(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildMarkLoanAsPaid', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeLoanOperationParams();
        const result = await Effect.runPromise(buildMarkLoanAsPaid(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeLoanOperationParams();
        const result = await Effect.runPromise(buildMarkLoanAsPaid(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the markLoanAsPaid function selector', async () => {
        const params = makeLoanOperationParams();
        const result = await Effect.runPromise(buildMarkLoanAsPaid(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildSetPaidLoanCallback', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeSetLoanCallbackParams();
        const result = await Effect.runPromise(buildSetPaidLoanCallback(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_FRENDLEND_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeSetLoanCallbackParams();
        const result = await Effect.runPromise(buildSetPaidLoanCallback(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the setPaidLoanCallback function selector', async () => {
        const params = makeSetLoanCallbackParams();
        const result = await Effect.runPromise(buildSetPaidLoanCallback(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});
