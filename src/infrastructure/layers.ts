import { Layer } from 'effect';
import type { Hex } from '../domain/types/eth.js';
import { ViemInstantPaymentEncoderLive } from './encoding/viem-instant-payment-encoder.js';
import { ViemInvoiceEncoderLive } from './encoding/viem-invoice-encoder.js';
import { makeInvoiceReaderLayer } from './reading/viem-invoice-reader.js';
import { StaticRegistryServiceLive } from './registry/static-registry-service.js';
import { makePrivateKeySignerService } from './signer/private-key-signer-service.js';

/** Layer for "build" mode: no signer needed. */
export const BuildModeLayers = Layer.mergeAll(StaticRegistryServiceLive, ViemInstantPaymentEncoderLive, ViemInvoiceEncoderLive);

/** Additive signer layer for execute mode: requires a private key. */
export const makeSignerLayer = (privateKey: Hex, rpcUrl?: string) => makePrivateKeySignerService(privateKey, rpcUrl);

/** Additive reader layer for commands that need on-chain data (e.g. payInvoice, acceptPO). */
export const makeReaderLayer = (rpcUrl: string) => makeInvoiceReaderLayer(rpcUrl);
