import { Layer } from 'effect';
import type { Hex } from '../domain/types/eth.js';
import { ViemFactoringEncoderLive } from './encoding/viem-factoring-encoder.js';
import { ViemFrendLendEncoderLive } from './encoding/viem-frendlend-encoder.js';
import { ViemInstantPaymentEncoderLive } from './encoding/viem-instant-payment-encoder.js';
import { ViemInvoiceEncoderLive } from './encoding/viem-invoice-encoder.js';
import { makeFrendLendReaderLayer } from './reading/viem-frendlend-reader.js';
import { makeInvoiceReaderLayer } from './reading/viem-invoice-reader.js';
import { StaticRegistryServiceLive } from './registry/static-registry-service.js';
import { makePrivateKeySignerService } from './signer/private-key-signer-service.js';

/** Layer for "build" mode: no signer needed. */
export const BuildModeLayers = Layer.mergeAll(
    StaticRegistryServiceLive,
    ViemInstantPaymentEncoderLive,
    ViemInvoiceEncoderLive,
    ViemFrendLendEncoderLive,
    ViemFactoringEncoderLive,
);

/** Additive signer layer for execute mode: requires a private key. */
export const makeSignerLayer = (privateKey: Hex, rpcUrl?: string) => makePrivateKeySignerService(privateKey, rpcUrl);

/** Additive reader layer for invoice commands that need on-chain data (e.g. payInvoice, acceptPO). */
export const makeReaderLayer = (rpcUrl: string) => makeInvoiceReaderLayer(rpcUrl);

/** Additive reader layer for frendlend commands that need on-chain data (e.g. payLoan, acceptLoan). */
export const makeFrendLendReader = (rpcUrl: string) => makeFrendLendReaderLayer(rpcUrl);
