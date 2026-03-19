import { Context, Effect } from 'effect';
import type {
    GetMessageResponse,
    TapCreditRequest,
    TapCreditResponse,
    UnderwriteRequest,
    UnderwriteResponse,
    VerifyMessageResponse,
} from '../../domain/types/backend.js';

/**
 * Port for interacting with the Bulla backend API.
 * Covers authentication, underwriting, and tap-credit flows.
 */
export interface BackendClientService {
    /** GET /message/{wallet} — fetch SIWE challenge message. */
    readonly getMessage: (wallet: string) => Effect.Effect<GetMessageResponse, Error>;

    /** POST /auth/{wallet}/verifyMessage — submit signed message and receive JWT. */
    readonly verifyMessage: (wallet: string, signature: string) => Effect.Effect<VerifyMessageResponse, Error>;

    /** POST /underwrite/{wallet}/chain/{chainId}/pool/{poolAddress} — underwrite claims. */
    readonly underwrite: (
        authToken: string,
        wallet: string,
        chainId: number,
        poolAddress: string,
        body: UnderwriteRequest,
    ) => Effect.Effect<UnderwriteResponse, Error>;

    /** POST /tapCredit/batch/{wallet}/chain/{chainId}/pool/{poolAddress} — batch tap-credit. */
    readonly tapCredit: (
        authToken: string,
        wallet: string,
        chainId: number,
        poolAddress: string,
        body: TapCreditRequest,
    ) => Effect.Effect<TapCreditResponse, Error>;
}

export const BackendClientService = Context.GenericTag<BackendClientService>('@services/BackendClientService');
