import { Layer } from 'effect';
import { StaticRegistryServiceLive } from './registry/static-registry-service.js';
import { ViemInstantPaymentEncoderLive } from './encoding/viem-instant-payment-encoder.js';
import { makePrivateKeySignerService } from './signer/private-key-signer-service.js';
import type { Hex } from '../domain/types/eth.js';

/** Layer for "build" mode: no signer needed. */
export const BuildModeLayers = Layer.mergeAll(StaticRegistryServiceLive, ViemInstantPaymentEncoderLive);

/** Layer for "execute" mode: requires a private key. */
export const makeExecuteModeLayers = (privateKey: Hex, rpcUrl?: string) =>
    Layer.mergeAll(StaticRegistryServiceLive, ViemInstantPaymentEncoderLive, makePrivateKeySignerService(privateKey, rpcUrl));
