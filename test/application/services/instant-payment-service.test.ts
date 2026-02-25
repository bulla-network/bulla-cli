import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';
import { encodeFunctionData } from 'viem';
import { buildInstantPayment, sendInstantPayment } from '../../../src/application/services/instant-payment-service.js';
import { RegistryService } from '../../../src/application/ports/registry-port.js';
import { InstantPaymentEncoderService } from '../../../src/application/ports/instant-payment-encoder-port.js';
import { SignerService } from '../../../src/application/ports/signer-port.js';
import { SignerRequiredError } from '../../../src/domain/errors.js';
import { bullaInstantPaymentAbi } from '../../../src/infrastructure/abi/bulla-instant-payment.js';
import type { EthAddress, Hex, ChainId } from '../../../src/domain/types/eth.js';
import type { InstantPaymentParams } from '../../../src/domain/types/instant-payment.js';
import { ZERO_ADDRESS } from '../../../src/domain/types/token.js';

const SEPOLIA_CONTRACT = '0x1cD1A83C2965CB7aD55d60551877Eb390e9C3d7A' as EthAddress;
const RECIPIENT = '0x1234567890abcdef1234567890abcdef12345678' as EthAddress;

const makeTestParams = (overrides: Partial<InstantPaymentParams> = {}): InstantPaymentParams => ({
    chainId: 11155111 as ChainId,
    to: RECIPIENT,
    amount: 1000000000000000000n, // 1 ETH
    tokenAddress: ZERO_ADDRESS,
    description: 'Test payment',
    tags: ['test', 'integration'],
    ipfsHash: '',
    ...overrides,
});

// --- Test layers ---

const TestRegistryService = Layer.succeed(RegistryService, {
    getInstantPaymentAddress: () => Effect.succeed(SEPOLIA_CONTRACT),
});

/** Uses real viem encoding for golden-value tests. */
const TestInstantPaymentEncoder = Layer.succeed(InstantPaymentEncoderService, {
    encodeInstantPayment: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaInstantPaymentAbi,
                functionName: 'instantPayment',
                args: [
                    params.to as `0x${string}`,
                    params.amount,
                    params.tokenAddress as `0x${string}`,
                    params.description,
                    params.tag,
                    params.ipfsHash,
                ],
            }) as Hex,
        ),
});

const TestSignerService = Layer.succeed(SignerService, {
    getAddress: () => Effect.succeed('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as EthAddress),
    signAndSend: () => Effect.succeed('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as Hex),
});

const FailingSignerService = Layer.succeed(SignerService, {
    getAddress: () => Effect.fail(new SignerRequiredError({ message: 'No signer configured' })),
    signAndSend: () => Effect.fail(new SignerRequiredError({ message: 'No signer configured' })),
});

const BuildTestLayers = Layer.mergeAll(TestRegistryService, TestInstantPaymentEncoder);
const ExecuteTestLayers = Layer.mergeAll(TestRegistryService, TestInstantPaymentEncoder, TestSignerService);
const FailingExecuteTestLayers = Layer.mergeAll(TestRegistryService, TestInstantPaymentEncoder, FailingSignerService);

// --- Tests ---

describe('buildInstantPayment', () => {
    it('produces an unsigned transaction with the correct contract address', async () => {
        const params = makeTestParams();
        const result = await Effect.runPromise(buildInstantPayment(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_CONTRACT);
        expect(result.operation).toBe(0);
    });

    it('sets value to the amount for native token payments', async () => {
        const params = makeTestParams({ tokenAddress: ZERO_ADDRESS, amount: 500n });
        const result = await Effect.runPromise(buildInstantPayment(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('500');
    });

    it('sets value to "0" for ERC20 payments', async () => {
        const erc20Token = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as EthAddress;
        const params = makeTestParams({ tokenAddress: erc20Token });
        const result = await Effect.runPromise(buildInstantPayment(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the instantPayment function selector', async () => {
        const params = makeTestParams();
        const result = await Effect.runPromise(buildInstantPayment(params).pipe(Effect.provide(BuildTestLayers)));

        // Function selector is first 10 characters (0x + 8 hex chars)
        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('produces valid hex calldata for tagged payments', async () => {
        const params = makeTestParams({ tags: ['consulting', 'Q4'] });
        const result = await Effect.runPromise(buildInstantPayment(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]+$/);
    });

    it('trims description and ipfsHash', async () => {
        const params = makeTestParams({ description: '  trimmed  ', ipfsHash: '  QmHash  ' });
        const result = await Effect.runPromise(buildInstantPayment(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(SEPOLIA_CONTRACT);
    });
});

describe('sendInstantPayment', () => {
    it('returns a transaction result with the tx hash from the signer', async () => {
        const params = makeTestParams();
        const result = await Effect.runPromise(sendInstantPayment(params).pipe(Effect.provide(ExecuteTestLayers)));

        expect(result.txHash).toBe('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
        expect(result.chainId).toBe(11155111);
    });

    it('fails with SignerRequiredError when signer rejects', async () => {
        const params = makeTestParams();
        const result = await Effect.runPromiseExit(sendInstantPayment(params).pipe(Effect.provide(FailingExecuteTestLayers)));

        expect(result._tag).toBe('Failure');
    });
});
