import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runCli } from './helpers/cli-runner.js';
import { startAnvil, type AnvilInstance } from './setup/anvil.js';
import { CONTRACTS, SEPOLIA_CHAIN_ID } from './setup/constants.js';

const forkUrl = process.env.SEPOLIA_RPC_URL;
const POOL = CONTRACTS.factoringPool;

describe.skipIf(!forkUrl)('view functions (e2e)', () => {
    let anvil: AnvilInstance;

    beforeAll(async () => {
        anvil = await startAnvil(forkUrl!);
    });

    afterAll(() => {
        anvil?.stop();
    });

    // =========================================================================
    // FACTORING VIEW COMMANDS
    // =========================================================================

    describe('factoring view commands', () => {
        it('pool-status returns json output', () => {
            const result = runCli([
                'factoring', 'pool-status',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('impairedInvoiceIds');
            expect(parsed).toHaveProperty('hasMore');
        });

        it('pool-status returns human-readable output', () => {
            const result = runCli([
                'factoring', 'pool-status',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--format', 'human',
            ]);
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('impairedInvoiceIds');
            expect(result.stdout).toContain('hasMore');
        });

        it('fund-info returns valid data', () => {
            const result = runCli([
                'factoring', 'fund-info',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('name');
            expect(parsed).toHaveProperty('fundBalance');
            expect(parsed).toHaveProperty('deployedCapital');
            expect(parsed).toHaveProperty('capitalAccount');
            expect(parsed).toHaveProperty('price');
            expect(parsed).toHaveProperty('adminFeeBps');
            expect(parsed).toHaveProperty('targetYieldBps');
        });

        it('preview-deposit returns shares amount', () => {
            const result = runCli([
                'factoring', 'preview-deposit',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--assets', '1000000',
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('shares');
        });

        it('preview-redeem returns assets amount', () => {
            const result = runCli([
                'factoring', 'preview-redeem',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--shares', '1000000',
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('assets');
        });

        it('capital returns capital account value', () => {
            const result = runCli([
                'factoring', 'capital',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('capitalAccount');
        });

        it('accrued-profits returns profits value', () => {
            const result = runCli([
                'factoring', 'accrued-profits',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('accruedProfits');
        });

        it('queue stats returns queue statistics', () => {
            const result = runCli([
                'factoring', 'queue', 'stats',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('queueLength');
            expect(parsed).toHaveProperty('totalShares');
            expect(parsed).toHaveProperty('totalAssets');
        });

        it('queue is-empty returns boolean', () => {
            const result = runCli([
                'factoring', 'queue', 'is-empty',
                '--rpc-url', anvil.rpcUrl,
                '--pool-address', POOL,
                '--format', 'json',
            ]);
            expect(result.exitCode).toBe(0);
            const parsed = JSON.parse(result.stdout);
            expect(parsed).toHaveProperty('isEmpty');
            expect(typeof parsed.isEmpty).toBe('boolean');
        });
    });

    // =========================================================================
    // FRENDLEND VIEW COMMANDS
    // =========================================================================

    describe('frendlend view commands', () => {
        it('get-loan fails for non-existent claim', () => {
            const result = runCli([
                'frendlend', 'get-loan',
                '--rpc-url', anvil.rpcUrl,
                '--chain', String(SEPOLIA_CHAIN_ID),
                '--claim-ids', '9999',
                '--format', 'json',
            ]);
            expect(result.exitCode).toBeGreaterThanOrEqual(1);
        });

        it('get-offer fails for non-existent offer', () => {
            const result = runCli([
                'frendlend', 'get-offer',
                '--rpc-url', anvil.rpcUrl,
                '--chain', String(SEPOLIA_CHAIN_ID),
                '--offer-id', '9999',
                '--format', 'json',
            ]);
            expect(result.exitCode).toBeGreaterThanOrEqual(1);
        });

        it('total-due fails for non-existent claim', () => {
            const result = runCli([
                'frendlend', 'total-due',
                '--rpc-url', anvil.rpcUrl,
                '--chain', String(SEPOLIA_CHAIN_ID),
                '--claim-ids', '9999',
                '--format', 'json',
            ]);
            expect(result.exitCode).toBeGreaterThanOrEqual(1);
        });

        it('auto-detects chain from --rpc-url when --chain is omitted', () => {
            const result = runCli([
                'frendlend', 'get-loan',
                '--rpc-url', anvil.rpcUrl,
                '--claim-ids', '9999',
                '--format', 'json',
            ]);
            // Chain should be auto-detected from the RPC, not fail with missing chain error
            expect(result.exitCode).toBeGreaterThanOrEqual(1);
            expect(result.stderr).not.toContain('--chain or --rpc-url must be provided');
        });
    });
});
