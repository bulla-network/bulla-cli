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

const AUTH_BASE_URL = process.env.BULLA_AUTH_URL ?? 'https://apiauth.bulla.network';
const UNDERWRITER_BASE_URL = process.env.BULLA_UW_URL ?? 'https://apiuw.bulla.network';

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
        fetchJson<GetMessageResponse>(`${AUTH_BASE_URL}/message/${wallet}`),

    verifyMessage: (wallet: string, signature: string) =>
        fetchJson<VerifyMessageResponse>(`${AUTH_BASE_URL}/verify/${wallet}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: signature,
        }),

    underwrite: (authToken: string, wallet: string, chainId: number, poolAddress: string, body: UnderwriteRequest, isSafe?: boolean) => {
        const params = new URLSearchParams({ isV2: 'true' });
        if (isSafe) params.set('account_type', 'gnosis');
        return fetchJson<UnderwriteResponse>(
            `${UNDERWRITER_BASE_URL}/underwrite/${wallet}/chain/${chainId}/pool/${poolAddress}?${params}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            },
        );
    },

    tapCredit: (authToken: string, wallet: string, chainId: number, poolAddress: string, body: TapCreditRequest, isSafe?: boolean) => {
        const params = isSafe ? '?account_type=gnosis' : '';
        return fetchJson<TapCreditResponse>(
            `${UNDERWRITER_BASE_URL}/tapCredit/batch/${wallet}/chain/${chainId}/pool/${poolAddress}${params}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            },
        );
    },
});
