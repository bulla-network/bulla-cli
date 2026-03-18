// ============================================================================
// Auth types
// ============================================================================

export interface GetMessageResponse {
    readonly message: string;
}

export interface VerifyMessageResponse {
    readonly message: string;
}

// ============================================================================
// Underwrite types
// ============================================================================

export interface UnderwriteRequest {
    readonly claimIds: readonly string[];
}

export interface UnderwriteResultItem {
    readonly claimId: string;
    readonly status: string;
    readonly txHash: string;
    readonly errors: readonly string[];
}

export interface UnderwriteResponse {
    readonly results: readonly UnderwriteResultItem[];
}

// ============================================================================
// Tap-credit types
// ============================================================================

export interface TapCreditRequestItem {
    readonly description: string;
    readonly dueBy: number;
    readonly amount: string;
}

export interface TapCreditRequest {
    readonly requests: readonly TapCreditRequestItem[];
}

export interface TapCreditResultItem {
    readonly index: number;
    readonly status: string;
    readonly txHash: string;
    readonly errors: readonly string[];
}

export interface TapCreditResponse {
    readonly results: readonly TapCreditResultItem[];
}
