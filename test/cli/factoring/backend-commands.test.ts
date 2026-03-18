import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { runCli } from '../../e2e/helpers/cli-runner.js';

// ============================================================================
// Test constants
// ============================================================================

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat #0
const TEST_ACCOUNT = privateKeyToAccount(TEST_PRIVATE_KEY);
const TEST_WALLET = TEST_ACCOUNT.address;

// Build a JWT with the test wallet so extractWalletFromJwt works
const JWT_PAYLOAD = Buffer.from(JSON.stringify({ wallet: TEST_WALLET, exp: 9999999999 })).toString('base64');
const FAKE_JWT = `eyJhbGciOiJIUzI1NiJ9.${JWT_PAYLOAD}.fake-signature`;

const TEST_POOL = '0xa5e94f122d421c9579a5cb1e687f55e109ba270b';

let tmpDir: string;

beforeAll(() => {
    tmpDir = join(tmpdir(), `bulla-cli-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// authenticate command
// ============================================================================

describe('factoring authenticate', () => {
    it('fails when --private-key is missing', () => {
        const result = runCli(['factoring', 'authenticate']);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('signs a SIWE message with the private key (real signature)', async () => {
        // Verify that viem can sign a SIWE-style message with the test key
        const siweMessage = `Bulla Banker wants you to sign in with your Ethereum account:\n${TEST_WALLET}\n\nURI: https://banker.bulla.network/#/onboard\nVersion: 2\nNonce: 12345678\nChain ID: 1\nIssued At: 2026-02-23T12:00:00.000Z`;
        const signature = await TEST_ACCOUNT.signMessage({ message: siweMessage });

        // Signature should be a valid hex string (65 bytes = 130 hex chars + 0x prefix)
        expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
    });
});

// ============================================================================
// underwrite command
// ============================================================================

describe('factoring underwrite', () => {
    it('fails when --auth-token is missing', () => {
        const result = runCli([
            'factoring', 'underwrite',
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--claim-ids', '1,2,3',
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when --pool-address is missing', () => {
        const result = runCli([
            'factoring', 'underwrite',
            '--auth-token', FAKE_JWT,
            '--chain', '11155111',
            '--claim-ids', '1,2,3',
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when --claim-ids is missing', () => {
        const result = runCli([
            'factoring', 'underwrite',
            '--auth-token', FAKE_JWT,
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails with invalid JWT (no payload)', () => {
        const result = runCli([
            'factoring', 'underwrite',
            '--auth-token', 'not-a-jwt',
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--claim-ids', '1',
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails with JWT missing wallet field', () => {
        const badPayload = Buffer.from(JSON.stringify({ exp: 999 })).toString('base64');
        const badJwt = `header.${badPayload}.sig`;
        const result = runCli([
            'factoring', 'underwrite',
            '--auth-token', badJwt,
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--claim-ids', '1',
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });
});

// ============================================================================
// tap-credit command
// ============================================================================

describe('factoring tap-credit', () => {
    it('fails when --auth-token is missing', () => {
        const requestsFile = join(tmpDir, 'requests-noauth.json');
        writeFileSync(requestsFile, JSON.stringify([{ description: 'test', dueBy: 1700000000, amount: '1000000' }]));

        const result = runCli([
            'factoring', 'tap-credit',
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--requests-file', requestsFile,
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when --requests-file is missing', () => {
        const result = runCli([
            'factoring', 'tap-credit',
            '--auth-token', FAKE_JWT,
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when requests file does not exist', () => {
        const result = runCli([
            'factoring', 'tap-credit',
            '--auth-token', FAKE_JWT,
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--requests-file', '/tmp/nonexistent-file-12345.json',
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when requests file contains invalid JSON', () => {
        const badFile = join(tmpDir, 'bad-requests.json');
        writeFileSync(badFile, 'not valid json {{{');

        const result = runCli([
            'factoring', 'tap-credit',
            '--auth-token', FAKE_JWT,
            '--pool-address', TEST_POOL,
            '--chain', '11155111',
            '--requests-file', badFile,
            '--format', 'json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });
});

// ============================================================================
// SIWE signing integration
// ============================================================================

describe('SIWE signing integration', () => {
    it('produces a recoverable signature from a SIWE message', async () => {
        // Simulate the authenticate flow: get message → sign → verify signature locally
        const siweMessage = [
            `Bulla Banker wants you to sign in with your Ethereum account:`,
            TEST_WALLET,
            '',
            `URI: https://banker.bulla.network/#/onboard`,
            `Version: 2`,
            `Nonce: 12345678`,
            `Chain ID: 1`,
            `Issued At: 2026-02-23T12:00:00.000Z`,
        ].join('\n');

        // Sign with the test private key (same as authenticate command does)
        const signature = await TEST_ACCOUNT.signMessage({ message: siweMessage });
        expect(signature).toMatch(/^0x[0-9a-f]{130}$/);

        // Verify the signature recovers to the correct address
        const { recoverMessageAddress } = await import('viem');
        const recovered = await recoverMessageAddress({ message: siweMessage, signature });
        expect(recovered.toLowerCase()).toBe(TEST_WALLET.toLowerCase());
    });
});
