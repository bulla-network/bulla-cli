import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { recoverMessageAddress } from 'viem';
import { runCli, runCliAsync } from '../../e2e/helpers/cli-runner.js';

// ============================================================================
// Test constants
// ============================================================================

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat #0
const TEST_ACCOUNT = privateKeyToAccount(TEST_PRIVATE_KEY);
const TEST_WALLET = TEST_ACCOUNT.address;
const TEST_POOL = '0xa5e94f122d421c9579a5cb1e687f55e109ba270b';
const TEST_CHAIN = '11155111';

// Build a JWT with the test wallet so extractWalletFromJwt works
const JWT_PAYLOAD = Buffer.from(JSON.stringify({ wallet: TEST_WALLET, exp: 9999999999 })).toString('base64');
const FAKE_JWT = `eyJhbGciOiJIUzI1NiJ9.${JWT_PAYLOAD}.fake-signature`;

/** Bulla's sign-in message for a wallet, as the auth backend issues it. */
const signInMessage = (wallet: string, nonce: string) =>
    [
        'Bulla Banker wants you to sign in with your Ethereum account:',
        wallet,
        '',
        'URI: https://banker.bulla.network/#/onboard',
        'Version: 2',
        `Nonce: ${nonce}`,
        'Chain ID: 1',
        `Issued At: ${new Date().toISOString()}`,
    ].join('\n');

// ============================================================================
// Mock HTTP server
// ============================================================================

const TEST_SAFE = '0x1234567890abcdef1234567890abcdef12345678';

let mockServer: Server;
let mockPort: number;
let tmpDir: string;
let lastRequestedUrl: string;

/**
 * Mock backend state. Like the real one, it issues one sign-in message per wallet, accepts a
 * signature of it once, and accepts only session tokens it issued, for the wallet they belong to.
 */
const issuedMessages = new Map<string, string>(); // wallet (lowercase) -> pending sign-in message
const sessions = new Map<string, string>(); // session token -> wallet (lowercase)
let refuseVerify = false;

const issueSession = (wallet: string): string => {
    const payload = Buffer.from(JSON.stringify({ wallet, exp: 9999999999, sid: randomUUID() })).toString('base64');
    const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.mock-signature`;
    sessions.set(token, wallet.toLowerCase());
    return token;
};

/** Wallet of the session in the request's bearer token, or undefined if the backend didn't issue it. */
const sessionWallet = (req: IncomingMessage): string | undefined => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    return token ? sessions.get(token) : undefined;
};

/** True when the request carries a session the backend accepts for the wallet in its path. */
const isAuthorized = (req: IncomingMessage, pathWallet: string, isSafe: boolean): boolean => {
    const wallet = sessionWallet(req);
    if (!wallet) return false;
    // Safe requests are made with an owner's session; the mock doesn't model Safe owners.
    return isSafe || wallet === pathWallet.toLowerCase();
};

const unauthorized = (res: ServerResponse) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
};

/** Read the full request body as a string. */
const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk: Buffer) => (data += chunk.toString()));
        req.on('end', () => resolve(data));
    });

/** Route handler for the mock backend. */
const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '';
    const method = req.method ?? 'GET';
    lastRequestedUrl = url;
    const pathname = url.split('?')[0];

    const isSafe = new URLSearchParams(url.split('?')[1] ?? '').get('account_type') === 'gnosis';

    // GET /message/{wallet}
    const messageMatch = method === 'GET' ? pathname.match(/^\/message\/(0x[0-9a-fA-F]{40})$/) : null;
    if (messageMatch) {
        const wallet = messageMatch[1];
        const message = signInMessage(wallet, randomUUID().replace(/-/g, ''));
        issuedMessages.set(wallet.toLowerCase(), message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message }));
        return;
    }

    // POST /verify/{wallet}
    const verifyMatch = method === 'POST' ? pathname.match(/^\/verify\/(0x[0-9a-fA-F]{40})$/) : null;
    if (verifyMatch) {
        const signature = await readBody(req);
        const wallet = verifyMatch[1];

        // The pending message for this wallet can be used once.
        const message = issuedMessages.get(wallet.toLowerCase());
        issuedMessages.delete(wallet.toLowerCase());
        if (!message || refuseVerify) {
            unauthorized(res);
            return;
        }

        // The signature must be of that exact message, by that wallet.
        try {
            const recovered = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
            if (recovered.toLowerCase() !== wallet.toLowerCase()) {
                unauthorized(res);
                return;
            }
        } catch {
            unauthorized(res);
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: issueSession(wallet) }));
        return;
    }

    // POST /underwrite/{wallet}/chain/{chainId}/pool/{poolAddress}
    const underwriteMatch =
        method === 'POST' ? pathname.match(/^\/underwrite\/(0x[0-9a-fA-F]+)\/chain\/\d+\/pool\/0x[0-9a-fA-F]+$/) : null;
    if (underwriteMatch) {
        if (!isAuthorized(req, underwriteMatch[1], isSafe)) {
            unauthorized(res);
            return;
        }
        const body = JSON.parse(await readBody(req)) as { claimIds: string[] };
        const results = body.claimIds.map((claimId) => ({
            claimId,
            status: 'Ok',
            txHash: '0x' + 'ab'.repeat(32),
            errors: [],
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results }));
        return;
    }

    // POST /tapCredit/batch/{wallet}/chain/{chainId}/pool/{poolAddress}
    const tapCreditMatch =
        method === 'POST'
            ? pathname.match(/^\/tapCredit\/batch\/(0x[0-9a-fA-F]+)\/chain\/\d+\/pool\/0x[0-9a-fA-F]+$/)
            : null;
    if (tapCreditMatch) {
        if (!isAuthorized(req, tapCreditMatch[1], isSafe)) {
            unauthorized(res);
            return;
        }
        const body = JSON.parse(await readBody(req)) as { requests: unknown[] };
        const results = body.requests.map((_, index) => ({
            index,
            status: 'Ok',
            txHash: '0x' + 'cd'.repeat(32),
            errors: [],
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Unknown route: ${method} ${url}` }));
};

/** Env vars that point the CLI at the mock server. */
const mockEnv = () => ({
    BULLA_AUTH_URL: `http://127.0.0.1:${mockPort}`,
    BULLA_UW_URL: `http://127.0.0.1:${mockPort}`,
});

// ============================================================================
// Setup / teardown
// ============================================================================

beforeAll(async () => {
    // FAKE_JWT stands for a session the backend issued to TEST_WALLET earlier.
    sessions.set(FAKE_JWT, TEST_WALLET.toLowerCase());

    tmpDir = join(tmpdir(), `bulla-cli-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    mockServer = createServer((req, res) => {
        handleRequest(req, res).catch(() => {
            res.writeHead(500);
            res.end();
        });
    });

    await new Promise<void>((resolve) => {
        mockServer.listen(0, '127.0.0.1', () => {
            const addr = mockServer.address();
            mockPort = typeof addr === 'object' && addr ? addr.port : 0;
            resolve();
        });
    });
});

afterAll(async () => {
    rmSync(tmpDir, { recursive: true, force: true });
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
});

// ============================================================================
// authenticate command
// ============================================================================

describe('factoring authenticate', () => {
    it('fails when --private-key is missing', () => {
        const result = runCli(['factoring', 'authenticate']);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('authenticates successfully with a valid private key', async () => {
        const result = await runCliAsync(
            ['factoring', 'authenticate', '--private-key', TEST_PRIVATE_KEY],
            mockEnv(),
        );
        expect(result.exitCode).toBe(0);
        // The output should be a JWT (three dot-separated base64 segments)
        expect(result.stdout).toMatch(/^[A-Za-z0-9_+/=-]+\.[A-Za-z0-9_+/=-]+\.[A-Za-z0-9_+/=-]+$/);

        // Decode the JWT payload and verify the wallet
        const payload = JSON.parse(Buffer.from(result.stdout.split('.')[1], 'base64').toString());
        expect(payload.wallet.toLowerCase()).toBe(TEST_WALLET.toLowerCase());
    });
});

// ============================================================================
// SIGNIN-12 Signing in from the CLI (bulla-specs signin.md)
// ============================================================================

describe('SIGNIN-12 Signing in from the CLI', () => {
    const authenticate = (privateKey: string) =>
        runCliAsync(['factoring', 'authenticate', '--private-key', privateKey], mockEnv());

    const underwrite = (token: string) =>
        runCliAsync(
            [
                'factoring', 'underwrite',
                '--auth-token', token,
                '--pool-address', TEST_POOL,
                '--chain', TEST_CHAIN,
                '--claim-ids', '7',
                '--format', 'json',
            ],
            mockEnv(),
        );

    const tapCredit = (token: string) => {
        const requestsFile = join(tmpDir, `requests-signin-${randomUUID()}.json`);
        writeFileSync(requestsFile, JSON.stringify([{ description: 'SIGNIN-12', dueBy: 1700000000, amount: '1000' }]));
        return runCliAsync(
            [
                'factoring', 'tap-credit',
                '--auth-token', token,
                '--pool-address', TEST_POOL,
                '--chain', TEST_CHAIN,
                '--requests-file', requestsFile,
                '--format', 'json',
            ],
            mockEnv(),
        );
    };

    // "Given any private key": a fixed well-known key plus freshly generated ones.
    const privateKeys = [TEST_PRIVATE_KEY, generatePrivateKey(), generatePrivateKey()];

    it.each(privateKeys)(
        'signs the message Bulla issued for the wallet of %s, prints its session token, and the other factoring commands accept it',
        async (privateKey) => {
            const wallet = privateKeyToAccount(privateKey as `0x${string}`).address;

            const auth = await authenticate(privateKey);
            expect(auth.stderr).toBe('');
            expect(auth.exitCode).toBe(0);

            // The CLI prints exactly the session token the backend issued for this wallet, and nothing else.
            const token = auth.stdout;
            expect(sessions.get(token)).toBe(wallet.toLowerCase());
            // Its message was consumed by a successful verify, so it can't be used again.
            expect(issuedMessages.has(wallet.toLowerCase())).toBe(false);

            const uw = await underwrite(token);
            expect(uw.exitCode).toBe(0);
            expect(lastRequestedUrl).toContain(`/underwrite/${wallet}/`);
            expect(uw.stdout).toContain('"status": "Ok"');

            const tc = await tapCredit(token);
            expect(tc.exitCode).toBe(0);
            expect(lastRequestedUrl).toContain(`/tapCredit/batch/${wallet}/`);
            expect(tc.stdout).toContain('"status": "Ok"');
        },
    );

    it('a token the backend did not issue is refused by the other factoring commands', async () => {
        // Same shape and wallet as a real token, but never issued by the backend.
        const forged = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ wallet: TEST_WALLET, exp: 9999999999 })).toString('base64')}.forged`;

        const uw = await underwrite(forged);
        expect(uw.exitCode).toBeGreaterThanOrEqual(1);
        expect(uw.stdout).not.toContain('"status": "Ok"');

        const tc = await tapCredit(forged);
        expect(tc.exitCode).toBeGreaterThanOrEqual(1);
        expect(tc.stdout).not.toContain('"status": "Ok"');
    });

    it('prints no token when the backend refuses the signature', async () => {
        refuseVerify = true;
        const sessionsBefore = sessions.size;
        try {
            const auth = await authenticate(generatePrivateKey());
            expect(auth.exitCode).toBeGreaterThanOrEqual(1);
            expect(sessions.size).toBe(sessionsBefore);
            // stdout carries the error report, but no token-shaped line.
            expect(auth.stdout).toContain('HTTP 401');
            expect(auth.stdout.split('\n')).not.toContainEqual(expect.stringMatching(/^eyJ[\w+/=-]*\.[\w+/=-]+\.[\w+/=-]+$/));
        } finally {
            refuseVerify = false;
        }
    });
});

// ============================================================================
// underwrite command
// ============================================================================

describe('factoring underwrite', () => {
    it('fails when --auth-token is missing', () => {
        const result = runCli([
            'factoring', 'underwrite', '--pool-address', TEST_POOL, '--chain', TEST_CHAIN, '--claim-ids', '1,2,3',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when --pool-address is missing', () => {
        const result = runCli([
            'factoring', 'underwrite', '--auth-token', FAKE_JWT, '--chain', TEST_CHAIN, '--claim-ids', '1,2,3',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when --claim-ids is missing', () => {
        const result = runCli([
            'factoring', 'underwrite', '--auth-token', FAKE_JWT, '--pool-address', TEST_POOL, '--chain', TEST_CHAIN,
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails with invalid JWT (no payload)', () => {
        const result = runCli([
            'factoring', 'underwrite', '--auth-token', 'not-a-jwt', '--pool-address', TEST_POOL,
            '--chain', TEST_CHAIN, '--claim-ids', '1',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails with JWT missing wallet field', () => {
        const badPayload = Buffer.from(JSON.stringify({ exp: 999 })).toString('base64');
        const badJwt = `header.${badPayload}.sig`;
        const result = runCli([
            'factoring', 'underwrite', '--auth-token', badJwt, '--pool-address', TEST_POOL,
            '--chain', TEST_CHAIN, '--claim-ids', '1',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('underwrites claims successfully', async () => {
        const result = await runCliAsync(
            [
                'factoring', 'underwrite',
                '--auth-token', FAKE_JWT,
                '--pool-address', TEST_POOL,
                '--chain', TEST_CHAIN,
                '--claim-ids', '100,200,300',
                '--format', 'json',
            ],
            mockEnv(),
        );
        expect(result.exitCode).toBe(0);

        const output = result.stdout;
        expect(output).toContain('"claimId": "100"');
        expect(output).toContain('"claimId": "200"');
        expect(output).toContain('"claimId": "300"');
        expect(output).toContain('"status": "Ok"');
        expect(output).toContain('"txHash"');
    });

    it('uses safe address in URL and adds account_type=gnosis when --safe-address is provided', async () => {
        const result = await runCliAsync(
            [
                'factoring', 'underwrite',
                '--auth-token', FAKE_JWT,
                '--pool-address', TEST_POOL,
                '--chain', TEST_CHAIN,
                '--claim-ids', '1',
                '--safe-address', TEST_SAFE,
                '--format', 'json',
            ],
            mockEnv(),
        );
        expect(result.exitCode).toBe(0);
        expect(lastRequestedUrl).toContain(`/underwrite/${TEST_SAFE}/`);
        expect(lastRequestedUrl).not.toContain(TEST_WALLET);
        expect(lastRequestedUrl).toContain('account_type=gnosis');
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
            'factoring', 'tap-credit', '--pool-address', TEST_POOL, '--chain', TEST_CHAIN,
            '--requests-file', requestsFile,
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when --requests-file is missing', () => {
        const result = runCli([
            'factoring', 'tap-credit', '--auth-token', FAKE_JWT, '--pool-address', TEST_POOL, '--chain', TEST_CHAIN,
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when requests file does not exist', () => {
        const result = runCli([
            'factoring', 'tap-credit', '--auth-token', FAKE_JWT, '--pool-address', TEST_POOL,
            '--chain', TEST_CHAIN, '--requests-file', '/tmp/nonexistent-file-12345.json',
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('fails when requests file contains invalid JSON', () => {
        const badFile = join(tmpDir, 'bad-requests.json');
        writeFileSync(badFile, 'not valid json {{{');
        const result = runCli([
            'factoring', 'tap-credit', '--auth-token', FAKE_JWT, '--pool-address', TEST_POOL,
            '--chain', TEST_CHAIN, '--requests-file', badFile,
        ]);
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
    });

    it('processes tap-credit requests successfully', async () => {
        const requestsFile = join(tmpDir, 'requests-ok.json');
        writeFileSync(
            requestsFile,
            JSON.stringify([
                { description: 'Invoice A', dueBy: 1700000000, amount: '1000000' },
                { description: 'Invoice B', dueBy: 1700100000, amount: '2000000' },
            ]),
        );

        const result = await runCliAsync(
            [
                'factoring', 'tap-credit',
                '--auth-token', FAKE_JWT,
                '--pool-address', TEST_POOL,
                '--chain', TEST_CHAIN,
                '--requests-file', requestsFile,
                '--format', 'json',
            ],
            mockEnv(),
        );
        expect(result.exitCode).toBe(0);

        const output = result.stdout;
        expect(output).toContain('"index": 0');
        expect(output).toContain('"index": 1');
        expect(output).toContain('"status": "Ok"');
        expect(output).toContain('"txHash"');
    });

    it('uses safe address in URL and adds account_type=gnosis when --safe-address is provided', async () => {
        const requestsFile = join(tmpDir, 'requests-safe.json');
        writeFileSync(
            requestsFile,
            JSON.stringify([{ description: 'Safe Invoice', dueBy: 1700000000, amount: '500000' }]),
        );

        const result = await runCliAsync(
            [
                'factoring', 'tap-credit',
                '--auth-token', FAKE_JWT,
                '--pool-address', TEST_POOL,
                '--chain', TEST_CHAIN,
                '--requests-file', requestsFile,
                '--safe-address', TEST_SAFE,
                '--format', 'json',
            ],
            mockEnv(),
        );
        expect(result.exitCode).toBe(0);
        expect(lastRequestedUrl).toContain(`/tapCredit/batch/${TEST_SAFE}/`);
        expect(lastRequestedUrl).not.toContain(TEST_WALLET);
        expect(lastRequestedUrl).toContain('account_type=gnosis');
    });
});
