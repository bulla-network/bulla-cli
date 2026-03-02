import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runCliExecute } from './helpers/cli-runner.js';
import { type AnvilInstance, startAnvil } from './setup/anvil.js';
import { ANVIL_ACCOUNTS, SEPOLIA_CHAIN_ID } from './setup/constants.js';

const forkUrl = process.env.SEPOLIA_RPC_URL;

describe.skipIf(!forkUrl)('bulla pay execute (e2e)', () => {
    let anvil: AnvilInstance;

    beforeAll(async () => {
        anvil = await startAnvil(forkUrl!);
    });

    afterAll(() => {
        anvil?.stop();
    });

    it('sends a native token instant payment', () => {
        const result = runCliExecute([
            'pay',
            'execute',
            '--chain',
            String(SEPOLIA_CHAIN_ID),
            '--to',
            ANVIL_ACCOUNTS.account1.address,
            '--amount',
            '1000000000000000000',
            '--description',
            'e2e test payment',
            '--private-key',
            ANVIL_ACCOUNTS.account0.privateKey,
            '--rpc-url',
            anvil.rpcUrl,
        ]);

        expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(result.chainId).toBe(SEPOLIA_CHAIN_ID);
    });
});
