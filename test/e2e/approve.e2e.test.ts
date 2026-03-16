import { describe, expect, it } from 'vitest';
import { runCli } from './helpers/cli-runner.js';
import { ANVIL_ACCOUNTS, SEPOLIA_CHAIN_ID } from './setup/constants.js';

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

    it('approve nft build outputs valid JSON transaction', () => {
        const result = runCli([
            'approve',
            'nft',
            'build',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--to',
            ANVIL_ACCOUNTS.account1.address,
            '--claim-id',
            '42',
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

    it('approve --help shows all subcommands', () => {
        const result = runCli(['approve', '--help']);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('create-claim');
        expect(result.stdout).toContain('nft');
        expect(result.stdout).toContain('erc20');
    });
});
