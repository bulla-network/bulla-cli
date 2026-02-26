import { Context, Effect } from 'effect';
import type { EthAddress, ChainId } from '../../domain/types/eth.js';
import type { ContractNotFoundError, UnsupportedChainError } from '../../domain/errors.js';

export interface RegistryService {
    readonly getInstantPaymentAddress: (
        chainId: ChainId,
    ) => Effect.Effect<EthAddress, ContractNotFoundError | UnsupportedChainError>;
}

export const RegistryService = Context.GenericTag<RegistryService>('RegistryService');
