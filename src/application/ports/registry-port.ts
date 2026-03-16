import { Context, Effect } from 'effect';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';
import type { ChainId, EthAddress } from '../../domain/types/eth.js';

export interface RegistryService {
    readonly getInstantPaymentAddress: (chainId: ChainId) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError>;
    readonly getInvoiceAddress: (chainId: ChainId) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError>;
    readonly getFrendLendAddress: (chainId: ChainId) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError>;
    readonly getApprovalRegistryAddress: (chainId: ChainId) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError>;
    readonly getClaimAddress: (chainId: ChainId) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError>;
    readonly validateFactoringPool: (
        chainId: ChainId,
        address: EthAddress,
    ) => Effect.Effect<void, ContractNotFoundError | UnsupportedChainError>;
}

export const RegistryService = Context.GenericTag<RegistryService>('RegistryService');
