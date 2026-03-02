import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runCliExecute } from './helpers/cli-runner.js';
import { approveCreateClaim, WETH_ADDRESS, wrapEthAndApprove } from './helpers/erc20-setup.js';
import { getNewTokenIdFromReceipt } from './helpers/receipt-parser.js';
import { type AnvilInstance, startAnvil } from './setup/anvil.js';
import { ANVIL_ACCOUNTS, CONTRACTS, SEPOLIA_CHAIN_ID } from './setup/constants.js';

const forkUrl = process.env.SEPOLIA_RPC_URL;

describe.skipIf(!forkUrl)('bulla invoice (e2e)', () => {
    let anvil: AnvilInstance;

    beforeAll(async () => {
        anvil = await startAnvil(forkUrl!);

        // Approve both accounts on the BullaApprovalRegistry for the invoice contract
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account0.privateKey as `0x${string}`, CONTRACTS.bullaInvoice);
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account1.privateKey as `0x${string}`, CONTRACTS.bullaInvoice);

        // Fund account1 (debtor) with WETH and approve the invoice contract to spend it
        await wrapEthAndApprove(
            anvil.rpcUrl,
            ANVIL_ACCOUNTS.account1.privateKey as `0x${string}`,
            CONTRACTS.bullaInvoice,
            10_000_000_000_000_000_000n, // 10 WETH
        );
    });

    afterAll(() => {
        anvil?.stop();
    });

    it('creates an invoice', () => {
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
            'e2e test invoice',
            '--private-key',
            ANVIL_ACCOUNTS.account0.privateKey,
            '--rpc-url',
            anvil.rpcUrl,
        ]);

        expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(result.chainId).toBe(SEPOLIA_CHAIN_ID);
    });

    describe('invoice lifecycle: create -> pay', () => {
        let claimId: bigint;

        it('creates an invoice', async () => {
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
                'lifecycle pay test',
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            claimId = await getNewTokenIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(claimId).toBeGreaterThan(0n);
        });

        it('pays the invoice', () => {
            const result = runCliExecute([
                'invoice',
                'pay',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--claim-id',
                String(claimId),
                '--payment-amount',
                '1000000000000000000',
                '--private-key',
                ANVIL_ACCOUNTS.account1.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });
    });

    describe('invoice lifecycle: create -> cancel', () => {
        let claimId: bigint;

        it('creates an invoice', async () => {
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
                '2000000000000000000',
                '--token',
                WETH_ADDRESS,
                '--description',
                'lifecycle cancel test',
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            claimId = await getNewTokenIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(claimId).toBeGreaterThan(0n);
        });

        it('cancels the invoice', () => {
            const result = runCliExecute([
                'invoice',
                'cancel',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--claim-id',
                String(claimId),
                '--note',
                'e2e cancellation',
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });
    });
});
