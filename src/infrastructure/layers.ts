import { Layer } from 'effect';
import { StaticRegistryServiceLive } from './registry/static-registry-service.js';
import { ViemInstantPaymentEncoderLive } from './encoding/viem-instant-payment-encoder.js';
import { ViemInvoiceEncoderLive } from './encoding/viem-invoice-encoder.js';
import { makePrivateKeySignerService } from './signer/private-key-signer-service.js';
import type { Hex } from '../domain/types/eth.js';

/** Layer for "build" mode: no signer needed. */
export const BuildModeLayers = Layer.mergeAll(StaticRegistryServiceLive, ViemInstantPaymentEncoderLive, ViemInvoiceEncoderLive);

/** Additive signer layer for execute mode: requires a private key. */
export const makeSignerLayer = (privateKey: Hex, rpcUrl?: string) => makePrivateKeySignerService(privateKey, rpcUrl);
