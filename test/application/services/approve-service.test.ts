import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { describe, expect, it } from 'vitest';
import { ApproveEncoderService } from '../../../src/application/ports/approve-encoder-port.js';
import { NftTransferService } from '../../../src/application/ports/nft-transfer-port.js';
import { RegistryService } from '../../../src/application/ports/registry-port.js';
import { buildApproveCreateClaim, buildApproveErc20 } from '../../../src/application/services/approve-service.js';
import {
    InvoiceNftTransferServiceLive,
    FrendLendNftTransferServiceLive,
    ClaimNftTransferServiceLive,
} from '../../../src/application/services/nft-transfer-service.js';
import { CreateClaimApprovalType, type ApproveCreateClaimParams, type ApproveErc20Params, type ApproveNftParams, type TransferNftParams } from '../../../src/domain/types/approve.js';
import type { ChainId, EthAddress, Hex } from '../../../src/domain/types/eth.js';
import { bullaApprovalRegistryAbi } from '../../../src/infrastructure/abi/bulla-approval-registry.js';
import { bullaClaimV2Abi } from '../../../src/infrastructure/abi/bulla-claim-v2.js';
import { erc20Abi } from '../../../src/infrastructure/abi/erc20.js';

const APPROVAL_REGISTRY_ADDRESS = '0xb1F9a06D72F8737B4fcf4550f1C8EA769772Ad76' as EthAddress;
const CLAIM_V2_ADDRESS = '0x0d9EF9d436fF341E500360a6B5E5750aB85BCCB6' as EthAddress;
const INVOICE_ADDRESS = '0xa2c4B7239A0d179A923751cC75277fe139AB092F' as EthAddress;
const FRENDLEND_ADDRESS = '0x4d6A66D32CF34270e4cc9C9F201CA4dB650Be3f2' as EthAddress;
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

const makeTransferNftParams = (overrides: Partial<TransferNftParams> = {}): TransferNftParams => ({
    chainId: 11155111 as ChainId,
    from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as EthAddress,
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
    getInvoiceAddress: () => Effect.succeed(INVOICE_ADDRESS),
    getFrendLendAddress: () => Effect.succeed(FRENDLEND_ADDRESS),
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
    encodeTransferNft: params =>
        Effect.succeed(
            encodeFunctionData({
                abi: bullaClaimV2Abi,
                functionName: 'safeTransferFrom',
                args: [params.from as `0x${string}`, params.to as `0x${string}`, params.claimId, '0x'],
            }) as Hex,
        ),
});

const BuildTestLayers = Layer.mergeAll(TestRegistryService, TestApproveEncoder);

const InvoiceNftTestLayer = Layer.provide(InvoiceNftTransferServiceLive, BuildTestLayers);
const FrendLendNftTestLayer = Layer.provide(FrendLendNftTransferServiceLive, BuildTestLayers);
const ClaimNftTestLayer = Layer.provide(ClaimNftTransferServiceLive, BuildTestLayers);

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

describe('NftTransferService (buildApproveNft)', () => {
    it('targets invoice controller for invoice claims', async () => {
        const params = makeApproveNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(InvoiceNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildApproveNft(params));

        expect(result.to).toBe(INVOICE_ADDRESS);
        expect(result.operation).toBe(0);
    });

    it('targets frendlend controller for loan claims', async () => {
        const params = makeApproveNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(FrendLendNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildApproveNft(params));

        expect(result.to).toBe(FRENDLEND_ADDRESS);
        expect(result.operation).toBe(0);
    });

    it('targets claim contract for uncontrolled claims', async () => {
        const params = makeApproveNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(ClaimNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildApproveNft(params));

        expect(result.to).toBe(CLAIM_V2_ADDRESS);
        expect(result.operation).toBe(0);
    });

    it('sets value to "0"', async () => {
        const params = makeApproveNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(InvoiceNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildApproveNft(params));

        expect(result.value).toBe('0');
    });

    it('encodes calldata starting with the approve function selector', async () => {
        const params = makeApproveNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(InvoiceNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildApproveNft(params));

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

describe('NftTransferService (buildTransferNft)', () => {
    it('targets invoice controller for invoice claims', async () => {
        const params = makeTransferNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(InvoiceNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildTransferNft(params));

        expect(result.to).toBe(INVOICE_ADDRESS);
        expect(result.operation).toBe(0);
    });

    it('targets frendlend controller for loan claims', async () => {
        const params = makeTransferNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(FrendLendNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildTransferNft(params));

        expect(result.to).toBe(FRENDLEND_ADDRESS);
        expect(result.operation).toBe(0);
    });

    it('encodes calldata starting with the safeTransferFrom function selector', async () => {
        const params = makeTransferNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(InvoiceNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildTransferNft(params));

        expect(result.data).toMatch(/^0x[0-9a-f]{8}/);
        expect(result.data.length).toBeGreaterThan(10);
    });

    it('sets value to "0"', async () => {
        const params = makeTransferNftParams();
        const nftService = await Effect.runPromise(NftTransferService.pipe(Effect.provide(InvoiceNftTestLayer)));
        const result = await Effect.runPromise(nftService.buildTransferNft(params));

        expect(result.value).toBe('0');
    });
});
