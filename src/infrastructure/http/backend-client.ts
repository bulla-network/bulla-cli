import { Effect, Layer } from 'effect';
import { BackendClientService } from '../../application/ports/backend-client-port.js';
import type {
    GetMessageResponse,
    TapCreditRequest,
    TapCreditResponse,
    UnderwriteRequest,
    UnderwriteResponse,
    VerifyMessageResponse,
} from '../../domain/types/backend.js';

const AUTH_BASE_URL = 'https://apiauth.bulla.network';
const UNDERWRITER_BASE_URL = 'https://apiuw.bulla.network';

const fetchJson = <T>(url: string, init?: RequestInit): Effect.Effect<T, Error> =>
    Effect.tryPromise({
        try: async () => {
            const res = await fetch(url, init);
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status} from ${url}: ${body}`);
            }
            return (await res.json()) as T;
        },
        catch: (err) => (err instanceof Error ? err : new Error(String(err))),
    });

export const BackendClientLive = Layer.succeed(BackendClientService, {
    getMessage: (wallet: string) =>
        fetchJson<GetMessageResponse>(`${AUTH_BASE_URL}/auth/${wallet}/getMessage`),

    verifyMessage: (wallet: string, signature: string) =>
        fetchJson<VerifyMessageResponse>(`${AUTH_BASE_URL}/auth/${wallet}/verifyMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: signature,
        }),

    underwrite: (authToken: string, wallet: string, chainId: number, poolAddress: string, body: UnderwriteRequest) =>
        fetchJson<UnderwriteResponse>(`${UNDERWRITER_BASE_URL}/underwrite/${wallet}/chain/${chainId}/pool/${poolAddress}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }),

    tapCredit: (authToken: string, wallet: string, chainId: number, poolAddress: string, body: TapCreditRequest) =>
        fetchJson<TapCreditResponse>(
            `${UNDERWRITER_BASE_URL}/tapCredit/batch/${wallet}/chain/${chainId}/pool/${poolAddress}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            },
        ),
});
