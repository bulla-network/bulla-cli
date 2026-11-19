import { registry } from '@bulla/registry';
import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import { RegistryService } from '../../../src/application/ports/registry-port.js';
import { ContractNotFoundError, UnsupportedChainError } from '../../../src/domain/errors.js';
import { CHAIN_NAMES, SUPPORTED_CHAIN_IDS, type ChainId, type EthAddress } from '../../../src/domain/types/eth.js';
import { StaticRegistryServiceLive } from '../../../src/infrastructure/registry/static-registry-service.js';

const run = <A, E>(f: (r: RegistryService) => Effect.Effect<A, E>) =>
    Effect.runPromiseExit(Effect.flatMap(RegistryService, f).pipe(Effect.provide(StaticRegistryServiceLive)));

const failureOf = <A, E>(exit: Exit.Exit<A, E>) => (Exit.isFailure(exit) && exit.cause._tag === 'Fail' ? exit.cause.error : undefined);

const network = (chainId: ChainId) => registry.networks[String(chainId)];

describe('@bulla/registry coverage of the supported chains', () => {
    it.each(SUPPORTED_CHAIN_IDS)('chain %i is in the registry, and its display name comes from it', chainId => {
        expect(network(chainId)).toBeDefined();
        expect(CHAIN_NAMES[chainId]).toBe(network(chainId)!.name);
    });
});

describe('StaticRegistryServiceLive', () => {
    it.each(SUPPORTED_CHAIN_IDS)('returns the registry BullaInstantPayment address on chain %i', async chainId => {
        const exit = await run(r => r.getInstantPaymentAddress(chainId));
        expect(exit).toEqual(Exit.succeed(network(chainId)!.contracts['bulla-contracts']!.bullaInstantPayment));
    });

    const v2Chains = SUPPORTED_CHAIN_IDS.filter(id => network(id)?.contracts['bulla-contracts-v2']);

    it.each(v2Chains)('returns the registry V2 addresses on chain %i', async chainId => {
        const v2 = network(chainId)!.contracts['bulla-contracts-v2']!;
        expect(await run(r => r.getInvoiceAddress(chainId))).toEqual(Exit.succeed(v2.bullaInvoice));
        expect(await run(r => r.getFrendLendAddress(chainId))).toEqual(Exit.succeed(v2.frendLendV2));
        expect(await run(r => r.getApprovalRegistryAddress(chainId))).toEqual(Exit.succeed(v2.bullaApprovalRegistry));
        expect(await run(r => r.getClaimAddress(chainId))).toEqual(Exit.succeed(v2.bullaClaimV2));
    });

    it('fails with ContractNotFoundError for a V2 contract on a chain without V2 (RedBelly)', async () => {
        const failure = failureOf(await run(r => r.getInvoiceAddress(151)));
        expect(failure).toBeInstanceOf(ContractNotFoundError);
        expect((failure as ContractNotFoundError).contractName).toBe('BullaInvoice');
    });

    it('fails with UnsupportedChainError for a chain the CLI does not support', async () => {
        const failure = failureOf(await run(r => r.getInvoiceAddress(999 as ChainId)));
        expect(failure).toBeInstanceOf(UnsupportedChainError);
    });

    describe('validateFactoringPool', () => {
        const supportedPools = registry.pools.filter(p => (SUPPORTED_CHAIN_IDS as readonly number[]).includes(p.chainId));

        it('accepts every registry pool on a supported chain, archived ones included, in any letter case', async () => {
            expect(supportedPools.some(p => p.category === 'archived')).toBe(true);
            for (const pool of supportedPools) {
                const exit = await run(r => r.validateFactoringPool(pool.chainId as ChainId, pool.address.toLowerCase() as EthAddress));
                expect(exit, `${pool.chainId} ${pool.address}`).toEqual(Exit.void);
            }
        });

        it('rejects a registry pool address on another chain', async () => {
            const pool = supportedPools.find(p => p.chainId !== 1)!;
            const failure = failureOf(await run(r => r.validateFactoringPool(1, pool.address as EthAddress)));
            expect(failure).toBeInstanceOf(ContractNotFoundError);
        });

        it('rejects an address that is not a registry pool', async () => {
            const failure = failureOf(
                await run(r => r.validateFactoringPool(11155111, '0x000000000000000000000000000000000000dEaD' as EthAddress)),
            );
            expect(failure).toBeInstanceOf(ContractNotFoundError);
        });
    });
});
