import { Layer } from 'effect';
import { StaticRegistryServiceLive } from './registry/static-registry-service.js';
import { ViemBlockchainServiceLive } from './blockchain/viem-blockchain-service.js';
import { makePrivateKeySignerService } from './signer/private-key-signer-service.js';
import type { Hex } from '../domain/types/eth.js';

/** Layer for "build" mode: no signer needed. */
export const BuildModeLayers = Layer.mergeAll(StaticRegistryServiceLive, ViemBlockchainServiceLive);

/** Layer for "execute" mode: requires a private key. */
export const makeExecuteModeLayers = (privateKey: Hex, rpcUrl?: string) =>
    Layer.mergeAll(StaticRegistryServiceLive, ViemBlockchainServiceLive, makePrivateKeySignerService(privateKey, rpcUrl));
