import { Effect, Exit, Option } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { MissingChainConfigError, RpcConnectionError, UnsupportedChainError } from '../../../src/domain/errors.js';
import { getChainId } from '../../../src/cli/options/common.js';

// Mock the chain-resolver module so we don't need a real RPC
vi.mock('../../../src/infrastructure/chain-resolver.js', () => ({
    resolveChainId: (rpcUrl: string) => {
        if (rpcUrl === 'http://good-rpc') {
            return Effect.succeed(8453 as const); // Base
        }
        if (rpcUrl === 'http://unsupported-chain') {
            return Effect.fail(new UnsupportedChainError({ chainId: 999, message: 'Unsupported chain ID: 999' }));
        }
        return Effect.fail(new RpcConnectionError({ rpcUrl, message: `Failed to connect to RPC: ${rpcUrl}` }));
    },
}));

describe('getChainId', () => {
    it('returns chain ID when --chain is a valid supported chain', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.some(8453), Option.none()));
        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
            expect(exit.value).toBe(8453);
        }
    });

    it('fails with UnsupportedChainError when --chain is not a supported chain', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.some(999), Option.none()));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
            const error = exit.cause;
            const failure = error._tag === 'Fail' ? error.error : undefined;
            expect(failure).toBeInstanceOf(UnsupportedChainError);
            expect((failure as UnsupportedChainError).chainId).toBe(999);
        }
    });

    it('resolves chain ID from --rpc-url when --chain is omitted', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.none(), 'http://good-rpc'));
        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
            expect(exit.value).toBe(8453);
        }
    });

    it('resolves chain ID from --rpc-url when passed as Option.some', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.none(), Option.some('http://good-rpc')));
        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
            expect(exit.value).toBe(8453);
        }
    });

    it('fails with RpcConnectionError when RPC is unreachable', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.none(), 'http://bad-rpc'));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
            const failure = exit.cause._tag === 'Fail' ? exit.cause.error : undefined;
            expect(failure).toBeInstanceOf(RpcConnectionError);
        }
    });

    it('fails with UnsupportedChainError when RPC returns unsupported chain', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.none(), 'http://unsupported-chain'));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
            const failure = exit.cause._tag === 'Fail' ? exit.cause.error : undefined;
            expect(failure).toBeInstanceOf(UnsupportedChainError);
        }
    });

    it('fails with MissingChainConfigError when neither --chain nor --rpc-url is provided', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.none(), Option.none()));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
            const failure = exit.cause._tag === 'Fail' ? exit.cause.error : undefined;
            expect(failure).toBeInstanceOf(MissingChainConfigError);
        }
    });

    it('fails with MissingChainConfigError when rpcUrl is undefined', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.none(), undefined));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
            const failure = exit.cause._tag === 'Fail' ? exit.cause.error : undefined;
            expect(failure).toBeInstanceOf(MissingChainConfigError);
        }
    });

    it('prefers --chain over --rpc-url when both are provided', async () => {
        const exit = await Effect.runPromiseExit(getChainId(Option.some(137), 'http://good-rpc'));
        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
            expect(exit.value).toBe(137); // Polygon, not Base from RPC
        }
    });
});
