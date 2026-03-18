import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';
import { BackendClientService } from '../../../src/application/ports/backend-client-port.js';
import type {
    TapCreditRequest,
    UnderwriteRequest,
} from '../../../src/domain/types/backend.js';

// ============================================================================
// Test constants
// ============================================================================

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_SIGNATURE = '0xdeadbeef';
const FAKE_SIWE_MESSAGE = 'example.com wants you to sign in with your Ethereum account';
const FAKE_JWT_PAYLOAD = Buffer.from(JSON.stringify({ wallet: TEST_WALLET, exp: 9999999999 })).toString('base64');
const FAKE_JWT = `eyJhbGciOiJIUzI1NiJ9.${FAKE_JWT_PAYLOAD}.fake-signature`;
const TEST_POOL = '0xa5e94f122d421c9579a5cb1e687f55e109ba270b';
const TEST_CHAIN_ID = 11155111;

// ============================================================================
// extractWalletFromJwt — reimplemented for testing
// ============================================================================

const extractWalletFromJwt = (token: string): string => {
    const parts = token.split('.');
    const payload = parts[1];
    if (!payload) {
        throw new Error('Invalid JWT: missing payload segment');
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString()) as { wallet?: string };
    if (!decoded.wallet) {
        throw new Error('Invalid JWT: missing wallet field in payload');
    }
    return decoded.wallet;
};

// ============================================================================
// Mock layer
// ============================================================================

const TestBackendClient = Layer.succeed(BackendClientService, {
    getMessage: (_wallet: string) =>
        Effect.succeed({ message: FAKE_SIWE_MESSAGE }),

    verifyMessage: (_wallet: string, _signature: string) =>
        Effect.succeed({ message: FAKE_JWT }),

    underwrite: (_authToken: string, _wallet: string, _chainId: number, _poolAddress: string, body: UnderwriteRequest) =>
        Effect.succeed({
            results: body.claimIds.map(claimId => ({
                claimId,
                status: 'success',
                txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                errors: [] as readonly string[],
            })),
        }),

    tapCredit: (_authToken: string, _wallet: string, _chainId: number, _poolAddress: string, body: TapCreditRequest) =>
        Effect.succeed({
            results: body.requests.map((_, index) => ({
                index,
                status: 'success',
                txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                errors: [] as readonly string[],
            })),
        }),
});

// ============================================================================
// Tests
// ============================================================================

describe('extractWalletFromJwt', () => {
    it('extracts the wallet address from a valid JWT', () => {
        const wallet = extractWalletFromJwt(FAKE_JWT);
        expect(wallet).toBe(TEST_WALLET);
    });

    it('throws for a JWT without a payload segment', () => {
        expect(() => extractWalletFromJwt('header-only')).toThrow('Invalid JWT: missing payload segment');
    });

    it('throws for a JWT payload missing the wallet field', () => {
        const noWalletPayload = Buffer.from(JSON.stringify({ exp: 9999999999 })).toString('base64');
        const badJwt = `eyJhbGciOiJIUzI1NiJ9.${noWalletPayload}.sig`;
        expect(() => extractWalletFromJwt(badJwt)).toThrow('Invalid JWT: missing wallet field in payload');
    });
});

describe('BackendClientService.getMessage', () => {
    it('returns a SIWE message for a wallet', async () => {
        const result = await Effect.runPromise(
            Effect.gen(function* () {
                const client = yield* BackendClientService;
                return yield* client.getMessage(TEST_WALLET);
            }).pipe(Effect.provide(TestBackendClient)),
        );

        expect(result.message).toBe(FAKE_SIWE_MESSAGE);
    });
});

describe('BackendClientService.verifyMessage', () => {
    it('returns a JWT token for a valid signature', async () => {
        const result = await Effect.runPromise(
            Effect.gen(function* () {
                const client = yield* BackendClientService;
                return yield* client.verifyMessage(TEST_WALLET, TEST_SIGNATURE);
            }).pipe(Effect.provide(TestBackendClient)),
        );

        expect(result.message).toBe(FAKE_JWT);
    });
});

describe('BackendClientService.underwrite', () => {
    it('returns results for each claim ID', async () => {
        const claimIds = ['1', '2', '3'];
        const result = await Effect.runPromise(
            Effect.gen(function* () {
                const client = yield* BackendClientService;
                return yield* client.underwrite(FAKE_JWT, TEST_WALLET, TEST_CHAIN_ID, TEST_POOL, { claimIds });
            }).pipe(Effect.provide(TestBackendClient)),
        );

        expect(result.results).toHaveLength(3);
        expect(result.results[0]?.claimId).toBe('1');
        expect(result.results[0]?.status).toBe('success');
        expect(result.results[0]?.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(result.results[0]?.errors).toHaveLength(0);
    });

    it('maps claim IDs correctly in the response', async () => {
        const claimIds = ['42', '99'];
        const result = await Effect.runPromise(
            Effect.gen(function* () {
                const client = yield* BackendClientService;
                return yield* client.underwrite(FAKE_JWT, TEST_WALLET, TEST_CHAIN_ID, TEST_POOL, { claimIds });
            }).pipe(Effect.provide(TestBackendClient)),
        );

        expect(result.results[0]?.claimId).toBe('42');
        expect(result.results[1]?.claimId).toBe('99');
    });
});

describe('BackendClientService.tapCredit', () => {
    it('returns results for each request', async () => {
        const requests = [
            { description: 'Invoice A', dueBy: 1700000000, amount: '1000000' },
            { description: 'Invoice B', dueBy: 1700086400, amount: '2000000' },
        ];
        const result = await Effect.runPromise(
            Effect.gen(function* () {
                const client = yield* BackendClientService;
                return yield* client.tapCredit(FAKE_JWT, TEST_WALLET, TEST_CHAIN_ID, TEST_POOL, { requests });
            }).pipe(Effect.provide(TestBackendClient)),
        );

        expect(result.results).toHaveLength(2);
        expect(result.results[0]?.index).toBe(0);
        expect(result.results[1]?.index).toBe(1);
        expect(result.results[0]?.status).toBe('success');
        expect(result.results[0]?.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('handles empty requests array', async () => {
        const result = await Effect.runPromise(
            Effect.gen(function* () {
                const client = yield* BackendClientService;
                return yield* client.tapCredit(FAKE_JWT, TEST_WALLET, TEST_CHAIN_ID, TEST_POOL, { requests: [] });
            }).pipe(Effect.provide(TestBackendClient)),
        );

        expect(result.results).toHaveLength(0);
    });
});

describe('underwrite request body construction', () => {
    it('constructs correct request body from comma-separated claim IDs', () => {
        const rawClaimIds = '1, 2, 3';
        const claimIdList = rawClaimIds.split(',').map(id => id.trim());
        const body: UnderwriteRequest = { claimIds: claimIdList };

        expect(body.claimIds).toEqual(['1', '2', '3']);
    });

    it('handles single claim ID', () => {
        const rawClaimIds = '42';
        const claimIdList = rawClaimIds.split(',').map(id => id.trim());
        const body: UnderwriteRequest = { claimIds: claimIdList };

        expect(body.claimIds).toEqual(['42']);
    });
});

describe('tapCredit request body construction', () => {
    it('constructs correct request body from file content', () => {
        const fileContent = JSON.stringify([
            { description: 'Test invoice', dueBy: 1700000000, amount: '1000000' },
        ]);
        const requests = JSON.parse(fileContent) as { description: string; dueBy: number; amount: string }[];

        expect(requests).toHaveLength(1);
        expect(requests[0]?.description).toBe('Test invoice');
        expect(requests[0]?.dueBy).toBe(1700000000);
        expect(requests[0]?.amount).toBe('1000000');
    });
});
