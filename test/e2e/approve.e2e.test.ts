import { createPublicClient, http, parseAbi } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runCli, runCliExecute } from './helpers/cli-runner.js';
import { approveCreateClaim, WETH_ADDRESS, wrapEthAndApprove } from './helpers/erc20-setup.js';
import { getNewTokenIdFromReceipt, getOfferIdFromReceipt } from './helpers/receipt-parser.js';
import { type AnvilInstance, startAnvil } from './setup/anvil.js';
import { ANVIL_ACCOUNTS, CONTRACTS, SEPOLIA_CHAIN_ID, SEPOLIA_RPC_URL } from './setup/constants.js';

const ownerOfAbi = parseAbi(['function ownerOf(uint256 tokenId) view returns (address)']);

/** Sepolia BullaClaimV2 address (from generated registry) */
const BULLA_CLAIM_V2 = '0x0d9EF9d436fF341E500360a6B5E5750aB85BCCB6' as const;

async function getOwnerOf(rpcUrl: string, claimId: bigint): Promise<string> {
    const client = createPublicClient({ transport: http(rpcUrl) });
    return client.readContract({
        address: BULLA_CLAIM_V2,
        abi: ownerOfAbi,
        functionName: 'ownerOf',
        args: [claimId],
    });
}

describe('bulla approve build (e2e)', () => {
    it('approve create-claim build outputs valid JSON transaction', () => {
        const result = runCli([
            'approve',
            'create-claim',
            'build',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--controller',
            ANVIL_ACCOUNTS.account1.address,
            '--approval-type',
            'approved',
            '--approval-count',
            '10',
            '--format',
            'json',
        ]);

        expect(result.exitCode).toBe(0);
        const tx = JSON.parse(result.stdout);
        expect(tx.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(tx.data).toMatch(/^0x[0-9a-f]+$/);
        expect(tx.value).toBe('0');
        expect(tx.operation).toBe(0);
    });

    it('approve create-claim build uses approved as default approval type', () => {
        const result = runCli([
            'approve',
            'create-claim',
            'build',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--controller',
            ANVIL_ACCOUNTS.account1.address,
            '--approval-count',
            '5',
            '--format',
            'json',
        ]);

        expect(result.exitCode).toBe(0);
        const tx = JSON.parse(result.stdout);
        expect(tx.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(tx.data).toMatch(/^0x[0-9a-f]+$/);
    });

    it('approve erc20 build outputs valid JSON transaction', () => {
        const result = runCli([
            'approve',
            'erc20',
            'build',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--token',
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            '--spender',
            ANVIL_ACCOUNTS.account1.address,
            '--amount',
            '1000000',
            '--format',
            'json',
        ]);

        expect(result.exitCode).toBe(0);
        const tx = JSON.parse(result.stdout);
        expect(tx.to.toLowerCase()).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        expect(tx.data).toMatch(/^0x[0-9a-f]+$/);
        expect(tx.value).toBe('0');
        expect(tx.operation).toBe(0);
    });

    it('approve --help shows create-claim and erc20 subcommands', () => {
        const result = runCli(['approve', '--help']);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('create-claim');
        expect(result.stdout).toContain('erc20');
    });
});

describe('invoice: approve-nft -> transfer-nft lifecycle (e2e)', () => {
    let anvil: AnvilInstance;

    beforeAll(async () => {
        anvil = await startAnvil(SEPOLIA_RPC_URL);

        // Approve both accounts on the BullaApprovalRegistry for the invoice contract
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account0.privateKey as `0x${string}`, CONTRACTS.bullaInvoice);
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account1.privateKey as `0x${string}`, CONTRACTS.bullaInvoice);
    });

    afterAll(() => {
        anvil?.stop();
    });

    describe('mint invoice -> approve transfer -> transfer -> check ownership', () => {
        let claimId: bigint;

        it('creates an invoice (mint)', async () => {
            const result = runCliExecute([
                'invoice',
                'create',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--debtor',
                ANVIL_ACCOUNTS.account1.address,
                '--creditor',
                ANVIL_ACCOUNTS.account0.address,
                '--amount',
                '1000000000000000000',
                '--token',
                WETH_ADDRESS,
                '--description',
                'approve-transfer e2e test',
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            claimId = await getNewTokenIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(claimId).toBeGreaterThan(0n);

            // Verify initial owner is account0 (creditor)
            const owner = await getOwnerOf(anvil.rpcUrl, claimId);
            expect(owner.toLowerCase()).toBe(ANVIL_ACCOUNTS.account0.address.toLowerCase());
        });

        it('approves account1 to transfer the invoice NFT', () => {
            const result = runCliExecute([
                'invoice',
                'approve-nft',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--to',
                ANVIL_ACCOUNTS.account1.address,
                '--claim-id',
                String(claimId),
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });

        it('transfers the invoice NFT from account0 to account1', () => {
            const result = runCliExecute([
                'invoice',
                'transfer-nft',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--from',
                ANVIL_ACCOUNTS.account0.address,
                '--to',
                ANVIL_ACCOUNTS.account1.address,
                '--claim-id',
                String(claimId),
                '--private-key',
                ANVIL_ACCOUNTS.account1.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });

        it('verifies the NFT owner has changed to account1', async () => {
            const owner = await getOwnerOf(anvil.rpcUrl, claimId);
            expect(owner.toLowerCase()).toBe(ANVIL_ACCOUNTS.account1.address.toLowerCase());
        });
    });
});

describe('frendlend: approve-nft -> transfer-nft lifecycle (e2e)', () => {
    let anvil: AnvilInstance;

    beforeAll(async () => {
        anvil = await startAnvil(SEPOLIA_RPC_URL);

        // Approve both accounts on the BullaApprovalRegistry for the frendlend contract
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account0.privateKey as `0x${string}`, CONTRACTS.frendLendV2);
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account1.privateKey as `0x${string}`, CONTRACTS.frendLendV2);

        // Fund account0 (lender) with WETH and approve the frendlend contract to spend it
        await wrapEthAndApprove(
            anvil.rpcUrl,
            ANVIL_ACCOUNTS.account0.privateKey as `0x${string}`,
            CONTRACTS.frendLendV2,
            10_000_000_000_000_000_000n,
        );
    });

    afterAll(() => {
        anvil?.stop();
    });

    describe('offer loan -> accept loan -> approve transfer -> transfer -> check ownership', () => {
        let offerId: bigint;
        let claimId: bigint;

        it('offers a loan', async () => {
            const result = runCliExecute([
                'frendlend',
                'offer-loan',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--debtor',
                ANVIL_ACCOUNTS.account1.address,
                '--creditor',
                ANVIL_ACCOUNTS.account0.address,
                '--amount',
                '1000000000000000000',
                '--token',
                WETH_ADDRESS,
                '--description',
                'frendlend approve-transfer e2e',
                '--interest-rate-bps',
                '500',
                '--term-length',
                '2592000',
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            offerId = await getOfferIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(offerId).toBeGreaterThan(0n);
        });

        it('accepts the loan', async () => {
            const result = runCliExecute([
                'frendlend',
                'accept-loan',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--offer-id',
                String(offerId),
                '--private-key',
                ANVIL_ACCOUNTS.account1.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            claimId = await getNewTokenIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(claimId).toBeGreaterThan(0n);

            // Verify initial owner is account0 (creditor/lender)
            const owner = await getOwnerOf(anvil.rpcUrl, claimId);
            expect(owner.toLowerCase()).toBe(ANVIL_ACCOUNTS.account0.address.toLowerCase());
        });

        it('approves account1 to transfer the loan NFT', () => {
            const result = runCliExecute([
                'frendlend',
                'approve-nft',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--to',
                ANVIL_ACCOUNTS.account1.address,
                '--claim-id',
                String(claimId),
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });

        it('transfers the loan NFT from account0 to account1', () => {
            const result = runCliExecute([
                'frendlend',
                'transfer-nft',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--from',
                ANVIL_ACCOUNTS.account0.address,
                '--to',
                ANVIL_ACCOUNTS.account1.address,
                '--claim-id',
                String(claimId),
                '--private-key',
                ANVIL_ACCOUNTS.account1.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });

        it('verifies the NFT owner has changed to account1', async () => {
            const owner = await getOwnerOf(anvil.rpcUrl, claimId);
            expect(owner.toLowerCase()).toBe(ANVIL_ACCOUNTS.account1.address.toLowerCase());
        });
    });
});
