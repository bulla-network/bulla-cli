import { Command } from '@effect/cli';
import { readFileSync } from 'node:fs';
import { Console, Effect } from 'effect';
import { privateKeyToAccount } from 'viem/accounts';
import { BackendClientService } from '../../application/ports/backend-client-port.js';
import type { TapCreditRequestItem } from '../../domain/types/backend.js';
import type { Hex } from '../../domain/types/eth.js';
import { BackendClientLive } from '../../infrastructure/http/backend-client.js';
import type { OutputFormat } from '../formatters/index.js';
import { formatViewResult } from '../formatters/view.js';
import { chainOption, formatOption } from '../options/common.js';
import { getChainId } from '../options/common.js';
import { authTokenOption, claimIdsOption, poolAddressOption, requestsFileOption } from '../options/factoring-options.js';
import { privateKeyOption } from '../options/pay-options.js';

// ============================================================================
// HELPERS
// ============================================================================

/** Extract wallet address from a JWT token by decoding the base64 payload. */
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
// AUTHENTICATE
// ============================================================================

const authenticateCommand = Command.make(
    'authenticate',
    {
        privateKey: privateKeyOption,
    },
    ({ privateKey }) =>
        Effect.gen(function* () {
            const account = privateKeyToAccount(privateKey as Hex);
            const wallet = account.address;

            const client = yield* BackendClientService;

            // Step 1: Get SIWE challenge message
            const { message } = yield* client.getMessage(wallet);

            // Step 2: Sign the message
            const signature = yield* Effect.tryPromise({
                try: () => account.signMessage({ message }),
                catch: (err) => new Error(`Failed to sign message: ${err instanceof Error ? err.message : String(err)}`),
            });

            // Step 3: Verify and get JWT
            const { message: token } = yield* client.verifyMessage(wallet, signature);

            yield* Console.log(token);
        }).pipe(Effect.provide(BackendClientLive)),
).pipe(Command.withDescription('Authenticate with the Bulla backend and obtain a JWT token'));

// ============================================================================
// UNDERWRITE
// ============================================================================

const underwriteCommand = Command.make(
    'underwrite',
    {
        authToken: authTokenOption,
        poolAddress: poolAddressOption,
        chain: chainOption,
        claimIds: claimIdsOption,
        format: formatOption,
    },
    ({ authToken, poolAddress, chain, claimIds, format }) =>
        Effect.gen(function* () {
            const wallet = extractWalletFromJwt(authToken);
            const chainId = yield* getChainId(chain, undefined);

            const client = yield* BackendClientService;
            const claimIdList = claimIds.split(',').map(id => id.trim());

            const response = yield* client.underwrite(authToken, wallet, chainId, poolAddress, {
                claimIds: claimIdList,
            });

            for (const result of response.results) {
                yield* Console.log(
                    formatViewResult(
                        {
                            claimId: result.claimId,
                            status: result.status,
                            txHash: result.txHash,
                            errors: result.errors.length > 0 ? result.errors.join(', ') : 'none',
                        },
                        format as OutputFormat,
                    ),
                );
            }
        }).pipe(Effect.provide(BackendClientLive)),
).pipe(Command.withDescription('Underwrite claims via the Bulla backend'));

// ============================================================================
// TAP-CREDIT
// ============================================================================

const tapCreditCommand = Command.make(
    'tap-credit',
    {
        authToken: authTokenOption,
        poolAddress: poolAddressOption,
        chain: chainOption,
        requestsFile: requestsFileOption,
        format: formatOption,
    },
    ({ authToken, poolAddress, chain, requestsFile, format }) =>
        Effect.gen(function* () {
            const wallet = extractWalletFromJwt(authToken);
            const chainId = yield* getChainId(chain, undefined);

            // Read and parse the requests file
            const fileContent = yield* Effect.try({
                try: () => readFileSync(requestsFile, 'utf-8'),
                catch: (err) => new Error(`Failed to read requests file: ${err instanceof Error ? err.message : String(err)}`),
            });

            const requests = yield* Effect.try({
                try: () => JSON.parse(fileContent) as readonly TapCreditRequestItem[],
                catch: (err) => new Error(`Failed to parse requests file: ${err instanceof Error ? err.message : String(err)}`),
            });

            const client = yield* BackendClientService;

            const response = yield* client.tapCredit(authToken, wallet, chainId, poolAddress, { requests });

            for (const result of response.results) {
                yield* Console.log(
                    formatViewResult(
                        {
                            index: result.index,
                            status: result.status,
                            txHash: result.txHash,
                            errors: result.errors.length > 0 ? result.errors.join(', ') : 'none',
                        },
                        format as OutputFormat,
                    ),
                );
            }
        }).pipe(Effect.provide(BackendClientLive)),
).pipe(Command.withDescription('Batch tap-credit requests via the Bulla backend'));

// ============================================================================
// EXPORT
// ============================================================================

export const backendCommands = [authenticateCommand, underwriteCommand, tapCreditCommand] as const;
