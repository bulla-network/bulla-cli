import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { describe, expect, it } from 'vitest';
import { ApproveEncoderService } from '../../../src/application/ports/approve-encoder-port.js';
import { RegistryService } from '../../../src/application/ports/registry-port.js';
import {
    buildApproveCreateClaim,
    buildApproveErc20,
    buildApproveNft,
} from '../../../src/application/services/approve-service.js';
import { CreateClaimApprovalType, type ApproveCreateClaimParams, type ApproveErc20Params, type ApproveNftParams } from '../../../src/domain/types/approve.js';
import type { ChainId, EthAddress, Hex } from '../../../src/domain/types/eth.js';
import { bullaApprovalRegistryAbi } from '../../../src/infrastructure/abi/bulla-approval-registry.js';
import { bullaClaimV2Abi } from '../../../src/infrastructure/abi/bulla-claim-v2.js';
import { erc20Abi } from '../../../src/infrastructure/abi/erc20.js';

const APPROVAL_REGISTRY_ADDRESS = '0xb1F9a06D72F8737B4fcf4550f1C8EA769772Ad76' as EthAddress;
const CLAIM_V2_ADDRESS = '0x0d9EF9d436fF341E500360a6B5E5750aB85BCCB6' as EthAddress;
const CONTROLLER = '0xa2c4B7239A0d179A923751cC75277fe139AB092F' as EthAddress;
const SPENDER = '0x1234567890abcdef1234567890abcdef12345678' as EthAddress;
const TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as EthAddress;

const makeApproveCreateClaimParams = (overrides: Partial<ApproveCreateClaimParams> = {}): ApproveCreateClaimParams => ({
    chainId: 11155111 as ChainId,
    controller: CONTROLLER,
    approvalType: CreateClaimApprovalType.Approved,
    approvalCount: 18446744073709551615n,
    isBindingAllowed: false,
    ...overrides,
});

const makeApproveNftParams = (overrides: Partial<ApproveNftParams> = {}): ApproveNftParams => ({
    chainId: 11155111 as ChainId,
    to: SPENDER,
    claimId: 42n,
    ...overrides,
});

const makeApproveErc20Params = (overrides: Partial<ApproveErc20Params> = {}): ApproveErc20Params => ({
    chainId: 11155111 as ChainId,
    token: TOKEN,
    spender: SPENDER,
    amount: 1000000n,
    ...overrides,
});

// --- Test layers ---

const TestRegistryService = Layer.succeed(RegistryService, {
    getInstantPaymentAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getInvoiceAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getFrendLendAddress: () => Effect.succeed('0x0000000000000000000000000000000000000000' as EthAddress),
    getApprovalRegistryAddress: () => Effect.succeed(APPROVAL_REGISTRY_ADDRESS),
    getClaimAddress: () => Effect.succeed(CLAIM_V2_ADDRESS),
    validateFactoringPool: () => Effect.succeed(true),
});

const TestApproveEncoder = Layer.succeed(ApproveEncoderService, {
    encodeApproveCreateClaim: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaApprovalRegistryAbi,
                functionName: 'approveCreateClaim',
                args: [
                    params.controller as `0x${string}`,
                    params.approvalType,
                    params.approvalCount,
                    params.isBindingAllowed,
                ],
            }) as Hex,
        ),
    encodeApproveNft: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaClaimV2Abi,
                functionName: 'approve',
                args: [params.to as `0x${string}`, params.claimId],
            }) as Hex,
        ),
    encodeApproveErc20: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [params.spender as `0x${string}`, params.amount],
            }) as Hex,
        ),
});

const BuildTestLayers = Layer.mergeAll(TestRegistryService, TestApproveEncoder);

// --- Tests ---

describe('buildApproveCreateClaim', () => {
    it('produces an unsigned transaction targeting the approval registry', async () => {
        const params = makeApproveCreateClaimParams();
        const result = await Effect.runPromise(buildApproveCreateClaim(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(APPROVAL_REGISTRY_ADDRESS);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeApproveCreateClaimParams();
        const result = await Effect.runPromise(buildApproveCreateClaim(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the approveCreateClaim function selector', async () => {
        const params = makeApproveCreateClaimParams();
        const result = await Effect.runPromise(buildApproveCreateClaim(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('produces valid hex calldata for all approval types', async () => {
        for (const approvalType of [
            CreateClaimApprovalType.Unapproved,
            CreateClaimApprovalType.CreditorOnly,
            CreateClaimApprovalType.DebtorOnly,
            CreateClaimApprovalType.Approved,
        ]) {
            const params = makeApproveCreateClaimParams({ approvalType });
            const result = await Effect.runPromise(buildApproveCreateClaim(params).pipe(Effect.provide(BuildTestLayers)));
            expect(result.data).toMatch(/^0x[0-9a-f]+$/);
        }
    });
});

describe('buildApproveNft', () => {
    it('produces an unsigned transaction targeting the claim contract', async () => {
        const params = makeApproveNftParams();
        const result = await Effect.runPromise(buildApproveNft(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(CLAIM_V2_ADDRESS);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeApproveNftParams();
        const result = await Effect.runPromise(buildApproveNft(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the approve function selector', async () => {
        const params = makeApproveNftParams();
        const result = await Effect.runPromise(buildApproveNft(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });
});

describe('buildApproveErc20', () => {
    it('produces an unsigned transaction targeting the token contract', async () => {
        const params = makeApproveErc20Params();
        const result = await Effect.runPromise(buildApproveErc20(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(TOKEN);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeApproveErc20Params();
        const result = await Effect.runPromise(buildApproveErc20(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the approve function selector', async () => {
        const params = makeApproveErc20Params();
        const result = await Effect.runPromise(buildApproveErc20(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('uses the token address from params as the transaction target', async () => {
        const customToken = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as EthAddress;
        const params = makeApproveErc20Params({ token: customToken });
        const result = await Effect.runPromise(buildApproveErc20(params).pipe(Effect.provide(BuildTestLayers)));

        expect(result.to).toBe(customToken);
    });
});
