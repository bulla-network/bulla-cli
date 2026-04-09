import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runCli, runCliExecute } from './helpers/cli-runner.js';
import { approveCreateClaim, WETH_ADDRESS, wrapEthAndApprove } from './helpers/erc20-setup.js';
import { getNewTokenIdFromReceipt, getOfferIdFromReceipt } from './helpers/receipt-parser.js';
import { type AnvilInstance, startAnvil } from './setup/anvil.js';
import { ANVIL_ACCOUNTS, CONTRACTS, SEPOLIA_CHAIN_ID } from './setup/constants.js';

const forkUrl = process.env.SEPOLIA_RPC_URL;

describe.skipIf(!forkUrl)('bulla frendlend (e2e)', () => {
    let anvil: AnvilInstance;

    beforeAll(async () => {
        anvil = await startAnvil(forkUrl!);

        // Approve both accounts on the BullaApprovalRegistry for the FrendLend contract
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account0.privateKey as `0x${string}`, CONTRACTS.frendLendV2);
        await approveCreateClaim(anvil.rpcUrl, ANVIL_ACCOUNTS.account1.privateKey as `0x${string}`, CONTRACTS.frendLendV2);

        // Fund account0 (creditor) with WETH and approve the FrendLend contract to spend it
        await wrapEthAndApprove(
            anvil.rpcUrl,
            ANVIL_ACCOUNTS.account0.privateKey as `0x${string}`,
            CONTRACTS.frendLendV2,
            10_000_000_000_000_000_000n, // 10 WETH
        );
    });

    afterAll(() => {
        anvil?.stop();
    });

    it('creates a loan offer', () => {
        const result = runCliExecute([
            'frendlend',
            'offer-loan',
            'execute',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--creditor',
            ANVIL_ACCOUNTS.account0.address,
            '--debtor',
            ANVIL_ACCOUNTS.account1.address,
            '--amount',
            '1000000000000000000',
            '--token',
            WETH_ADDRESS,
            '--term-length',
            '2592000',
            '--interest-rate-bps',
            '500',
            '--periods-per-year',
            '12',
            '--description',
            'e2e test loan',
            '--private-key',
            ANVIL_ACCOUNTS.account0.privateKey,
            '--rpc-url',
            anvil.rpcUrl,
        ]);

        expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(result.chainId).toBe(SEPOLIA_CHAIN_ID);
    });

    describe('loan lifecycle: offer -> reject', () => {
        let offerId: bigint;

        it('creates a loan offer', async () => {
            const result = runCliExecute([
                'frendlend',
                'offer-loan',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--creditor',
                ANVIL_ACCOUNTS.account0.address,
                '--debtor',
                ANVIL_ACCOUNTS.account1.address,
                '--amount',
                '500000000000000000',
                '--token',
                WETH_ADDRESS,
                '--term-length',
                '2592000',
                '--interest-rate-bps',
                '300',
                '--periods-per-year',
                '12',
                '--description',
                'reject test loan',
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            offerId = await getOfferIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(offerId).toBeGreaterThan(0n);
        });

        it('rejects the loan offer', () => {
            const result = runCliExecute([
                'frendlend',
                'reject-offer',
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
        });
    });

    describe('loan lifecycle: offer -> accept -> total-due', () => {
        let offerId: bigint;
        let claimId: bigint;

        it('creates a loan offer', async () => {
            const result = runCliExecute([
                'frendlend',
                'offer-loan',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--creditor',
                ANVIL_ACCOUNTS.account0.address,
                '--debtor',
                ANVIL_ACCOUNTS.account1.address,
                '--amount',
                '1000000000000000000',
                '--token',
                WETH_ADDRESS,
                '--term-length',
                '2592000',
                '--interest-rate-bps',
                '500',
                '--periods-per-year',
                '12',
                '--description',
                'accept test loan',
                '--private-key',
                ANVIL_ACCOUNTS.account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            offerId = await getOfferIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
        });

        it('accepts the loan offer', async () => {
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
        });

        it('returns total amount due for the accepted loan', () => {
            const result = runCli([
                'frendlend', 'total-due',
                '--rpc-url', anvil.rpcUrl,
                '--chain', String(SEPOLIA_CHAIN_ID),
                '--claim-ids', String(claimId),
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('remainingPrincipal');
            expect(parsed).toHaveProperty('grossInterest');
        });
    });
});
