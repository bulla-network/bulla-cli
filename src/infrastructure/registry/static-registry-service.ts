import { Effect, Layer } from 'effect';
import { RegistryService } from '../../application/ports/registry-port.js';
import { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ChainId, EthAddress } from '../../domain/types/eth.js';
import { isChainId } from '../../domain/types/eth.js';
import { FACTORING_POOLS, REGISTRY } from '../../generated/registry.js';

export const StaticRegistryServiceLive = Layer.succeed(RegistryService, {
    getInstantPaymentAddress: (chainId: ChainId) => {
        if (!isChainId(chainId)) {
            return Effect.fail(
                new UnsupportedChainError({
                    chainId,
                    message: `Chain ${chainId} is not supported`,
                }),
            );
        }

        const chain = REGISTRY[chainId];
        if (!chain) {
            return Effect.fail(
                new ContractNotFoundError({
                    chainId,
                    contractName: 'BullaInstantPayment',
                    message: `No BullaInstantPayment contract found for chain ${chainId}`,
                }),
            );
        }

        return Effect.succeed(chain.bullaInstantPayment);
    },
    getInvoiceAddress: (chainId: ChainId) => {
        if (!isChainId(chainId)) {
            return Effect.fail(
                new UnsupportedChainError({
                    chainId,
                    message: `Chain ${chainId} is not supported`,
                }),
            );
        }

        const address = REGISTRY[chainId]?.bullaInvoice;
        if (!address) {
            return Effect.fail(
                new ContractNotFoundError({
                    chainId,
                    contractName: 'BullaInvoice',
                    message: `No BullaInvoice contract found for chain ${chainId}`,
                }),
            );
        }

        return Effect.succeed(address);
    },
    getFrendLendAddress: (chainId: ChainId) => {
        if (!isChainId(chainId)) {
            return Effect.fail(
                new UnsupportedChainError({
                    chainId,
                    message: `Chain ${chainId} is not supported`,
                }),
            );
        }

        const address = REGISTRY[chainId]?.frendLendV2;
        if (!address) {
            return Effect.fail(
                new ContractNotFoundError({
                    chainId,
                    contractName: 'BullaFrendLendV2',
                    message: `No BullaFrendLendV2 contract found for chain ${chainId}`,
                }),
            );
        }

        return Effect.succeed(address);
    },
    validateFactoringPool: (chainId: ChainId, address: EthAddress) => {
        if (!isChainId(chainId)) {
            return Effect.fail(
                new UnsupportedChainError({
                    chainId,
                    message: `Chain ${chainId} is not supported`,
                }),
            );
        }

        const pools = FACTORING_POOLS[chainId];
        if (!pools || !pools.some(p => p.address.toLowerCase() === address.toLowerCase())) {
            return Effect.fail(
                new ContractNotFoundError({
                    chainId,
                    contractName: 'BullaFactoring',
                    message: `No factoring pool found at ${address} for chain ${chainId}`,
                }),
            );
        }

        return Effect.void;
    },
});
