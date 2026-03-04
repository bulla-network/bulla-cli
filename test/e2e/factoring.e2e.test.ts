import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runCliExecute } from './helpers/cli-runner.js';
import { approveCreateClaim } from './helpers/erc20-setup.js';
import {
    approveERC20,
    approveNFTForPool,
    dealERC20,
    fixInvoiceProviderAdapter,
    getPoolShares,
    readPoolInfo,
    setPoolUnderwriter,
    whitelistOnPermissions,
    type PoolInfo,
} from './helpers/factoring-setup.js';
import { getNewTokenIdFromReceipt, getOfferIdFromReceipt } from './helpers/receipt-parser.js';
import { startAnvil, type AnvilInstance } from './setup/anvil.js';
import { ANVIL_ACCOUNTS, CONTRACTS, SEPOLIA_CHAIN_ID } from './setup/constants.js';

const forkUrl = process.env.SEPOLIA_RPC_URL;
const POOL = CONTRACTS.factoringPool;
const account0 = ANVIL_ACCOUNTS.account0;
const account1 = ANVIL_ACCOUNTS.account1;

// Use 6-decimal amounts (typical USDC). Adjusted in beforeAll if different.
const DEPOSIT_AMOUNT = 10_000_000_000n; // 10,000 tokens
const INVOICE_AMOUNT = 100_000_000n; // 100 tokens
const LOAN_AMOUNT = 100_000_000n; // 100 tokens

describe.skipIf(!forkUrl)('bulla factoring (e2e)', () => {
    let anvil: AnvilInstance;
    let poolInfo: PoolInfo;
    let assetToken: `0x${string}`;

    beforeAll(async () => {
        anvil = await startAnvil(forkUrl!);

        // Read pool configuration
        poolInfo = await readPoolInfo(anvil.rpcUrl, POOL);
        assetToken = poolInfo.asset;

        // Deploy a new adapter with correct BullaClaimV2 and point the pool to it
        await fixInvoiceProviderAdapter(
            anvil.rpcUrl,
            POOL,
            CONTRACTS.bullaInvoice,
            CONTRACTS.frendLendV2,
            account0.privateKey as `0x${string}`,
        );

        // Make account0 the pool underwriter (impersonate pool owner)
        await setPoolUnderwriter(anvil.rpcUrl, POOL, poolInfo.owner, account0.address as `0x${string}`);

        // Whitelist account0 on deposit, redeem, and factoring permissions
        await whitelistOnPermissions(anvil.rpcUrl, poolInfo.depositPermissions, account0.address as `0x${string}`);
        await whitelistOnPermissions(anvil.rpcUrl, poolInfo.redeemPermissions, account0.address as `0x${string}`);
        await whitelistOnPermissions(anvil.rpcUrl, poolInfo.factoringPermissions, account0.address as `0x${string}`);

        // Deal asset tokens to both accounts
        await dealERC20(anvil.rpcUrl, assetToken, account0.address as `0x${string}`, DEPOSIT_AMOUNT * 2n);
        await dealERC20(anvil.rpcUrl, assetToken, account1.address as `0x${string}`, DEPOSIT_AMOUNT);

        // Approve pool to spend account0's tokens (for deposits)
        await approveERC20(anvil.rpcUrl, account0.privateKey as `0x${string}`, assetToken, POOL, DEPOSIT_AMOUNT * 2n);

        // Approve invoice and frendlend contracts on BullaApprovalRegistry
        await approveCreateClaim(anvil.rpcUrl, account0.privateKey as `0x${string}`, CONTRACTS.bullaInvoice);
        await approveCreateClaim(anvil.rpcUrl, account1.privateKey as `0x${string}`, CONTRACTS.bullaInvoice);
        await approveCreateClaim(anvil.rpcUrl, account1.privateKey as `0x${string}`, CONTRACTS.frendLendV2);

        // Approve invoice and frendlend to spend account1's tokens (for paying back)
        await approveERC20(anvil.rpcUrl, account1.privateKey as `0x${string}`, assetToken, CONTRACTS.bullaInvoice, DEPOSIT_AMOUNT);
        await approveERC20(anvil.rpcUrl, account1.privateKey as `0x${string}`, assetToken, CONTRACTS.frendLendV2, DEPOSIT_AMOUNT);

    });

    afterAll(() => {
        anvil?.stop();
    });

    // =========================================================================
    // DEPOSIT
    // =========================================================================

    it('deposits into the factoring pool', async () => {
        const result = runCliExecute([
            'factoring',
            'deposit',
            'execute',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--pool-address',
            POOL,
            '--assets',
            String(DEPOSIT_AMOUNT),
            '--receiver',
            account0.address,
            '--private-key',
            account0.privateKey,
            '--rpc-url',
            anvil.rpcUrl,
        ]);

        expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(result.chainId).toBe(SEPOLIA_CHAIN_ID);

        // Verify shares were minted
        const shares = await getPoolShares(anvil.rpcUrl, POOL, account0.address as `0x${string}`);
        expect(shares).toBeGreaterThan(0n);
    });

    // =========================================================================
    // INVOICE LIFECYCLE: create → approve → fund → pay back
    // =========================================================================

    describe('invoice factoring lifecycle', () => {
        let claimId: bigint;

        it('creates an invoice', async () => {
            const result = runCliExecute([
                'invoice',
                'create',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--debtor',
                account1.address,
                '--creditor',
                account0.address,
                '--amount',
                String(INVOICE_AMOUNT),
                '--token',
                assetToken,
                '--description',
                'factoring e2e invoice',
                '--due-by',
                String(Math.floor(Date.now() / 1000) + 30 * 86400), // 30 days from now
                '--private-key',
                account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            claimId = await getNewTokenIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(claimId).toBeGreaterThan(0n);
        });

        it('approves the invoice for factoring', () => {
            const result = runCliExecute([
                'factoring',
                'approve-invoice',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--pool-address',
                POOL,
                '--invoice-id',
                String(claimId),
                '--target-yield-bps',
                '800',
                '--spread-bps',
                '100',
                '--upfront-bps',
                '100',
                '--private-key',
                account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });

        it('funds the invoice from the pool', async () => {
            // Approve pool to transfer this specific invoice NFT via BullaInvoice controller
            await approveNFTForPool(
                anvil.rpcUrl,
                account0.privateKey as `0x${string}`,
                CONTRACTS.bullaInvoice,
                POOL,
                claimId,
            );

            const result = runCliExecute([
                'factoring',
                'fund-invoice',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--pool-address',
                POOL,
                '--invoice-id',
                String(claimId),
                '--upfront-bps',
                '100',
                '--receiver',
                account0.address,
                '--private-key',
                account0.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });

        it('pays the invoice back', () => {
            const result = runCliExecute([
                'invoice',
                'pay',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--claim-id',
                String(claimId),
                '--payment-amount',
                String(INVOICE_AMOUNT),
                '--private-key',
                account1.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });
    });

    // =========================================================================
    // LOAN LIFECYCLE: offer → accept → pay back
    // =========================================================================

    describe('pool loan lifecycle', () => {
        let offerId: bigint;
        let loanClaimId: bigint;

        it('offers a loan from the pool', async () => {
            const result = runCliExecute([
                'factoring',
                'offer-loan',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--pool-address',
                POOL,
                '--debtor',
                account1.address,
                '--target-yield-bps',
                '800',
                '--spread-bps',
                '100',
                '--principal-amount',
                String(LOAN_AMOUNT),
                '--term-length',
                '2592000',
                '--periods-per-year',
                '12',
                '--description',
                'factoring e2e loan',
                '--private-key',
                account0.privateKey,
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
                account1.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
            loanClaimId = await getNewTokenIdFromReceipt(anvil.rpcUrl, result.txHash as `0x${string}`);
            expect(loanClaimId).toBeGreaterThan(0n);
        });

        it('pays the loan back', () => {
            const result = runCliExecute([
                'frendlend',
                'pay-loan',
                'execute',
                '--chain',
                String(SEPOLIA_CHAIN_ID),
                '--claim-id',
                String(loanClaimId),
                '--payment-amount',
                String(LOAN_AMOUNT),
                '--private-key',
                account1.privateKey,
                '--rpc-url',
                anvil.rpcUrl,
            ]);

            expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        });
    });

    // =========================================================================
    // REDEEM
    // =========================================================================

    it('redeems shares from the pool', async () => {
        const shares = await getPoolShares(anvil.rpcUrl, POOL, account0.address as `0x${string}`);
        expect(shares).toBeGreaterThan(0n);

        // Redeem half the shares
        const toRedeem = shares / 2n;

        const result = runCliExecute([
            'factoring',
            'redeem',
            'execute',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--pool-address',
            POOL,
            '--shares',
            String(toRedeem),
            '--receiver',
            account0.address,
            '--owner',
            account0.address,
            '--private-key',
            account0.privateKey,
            '--rpc-url',
            anvil.rpcUrl,
        ]);

        expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    });
});
