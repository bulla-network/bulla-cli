import { registry } from '@bulla/registry';
import { Effect, Layer } from 'effect';
import { RegistryService } from '../../application/ports/registry-port.js';
import { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ChainId, EthAddress } from '../../domain/types/eth.js';
import { isChainId } from '../../domain/types/eth.js';

/** The registry.json groups the CLI reads contracts from, keyed by source repo. */
type ContractGroup = 'bulla-contracts' | 'bulla-contracts-v2';

const unsupportedChain = (chainId: number) =>
    new UnsupportedChainError({
        chainId,
        message: `Chain ${chainId} is not supported`,
    });

/** Look up a contract address in @bulla/registry for a chain the CLI supports. */
const contractAddress = (
    chainId: ChainId,
    group: ContractGroup,
    key: string,
    contractName: string,
): Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError> => {
    if (!isChainId(chainId)) return Effect.fail(unsupportedChain(chainId));

    const address = registry.networks[String(chainId)]?.contracts[group]?.[key];
    if (!address) {
        return Effect.fail(
            new ContractNotFoundError({
                chainId,
                contractName,
                message: `No ${contractName} contract found for chain ${chainId}`,
            }),
        );
    }

    return Effect.succeed(address as EthAddress);
};

export const StaticRegistryServiceLive = Layer.succeed(RegistryService, {
    getInstantPaymentAddress: chainId => contractAddress(chainId, 'bulla-contracts', 'bullaInstantPayment', 'BullaInstantPayment'),
    getInvoiceAddress: chainId => contractAddress(chainId, 'bulla-contracts-v2', 'bullaInvoice', 'BullaInvoice'),
    getFrendLendAddress: chainId => contractAddress(chainId, 'bulla-contracts-v2', 'frendLendV2', 'BullaFrendLendV2'),
    getApprovalRegistryAddress: chainId => contractAddress(chainId, 'bulla-contracts-v2', 'bullaApprovalRegistry', 'BullaApprovalRegistry'),
    getClaimAddress: chainId => contractAddress(chainId, 'bulla-contracts-v2', 'bullaClaimV2', 'BullaClaimV2'),
    /**
     * Accepts any pool @bulla/registry lists on the chain, archived ones included: an archived pool
     * still resolves, and its depositors may still need to redeem from it.
     */
    validateFactoringPool: (chainId: ChainId, address: EthAddress) => {
        if (!isChainId(chainId)) return Effect.fail(unsupportedChain(chainId));

        const known = registry.pools.some(p => p.chainId === chainId && p.address.toLowerCase() === address.toLowerCase());
        if (!known) {
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
