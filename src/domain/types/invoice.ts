import type { EthAddress, ChainId } from './eth.js';

// Enums from Types.sol
export enum ClaimBinding {
    Unbound = 0,
    BindingPending = 1,
    Bound = 2,
}

export enum InvoiceStatus {
    Pending = 0,
    Repaying = 1,
    Paid = 2,
    Rejected = 3,
    Rescinded = 4,
    Impaired = 5,
}

// InterestConfig from CompoundInterestLib.sol
export interface InterestConfig {
    interestRateBps: number; // basis points (1% = 100 bps)
    numberOfPeriodsPerYear: number; // 0 for simple interest, 1-365 for compound
}

// CreateInvoiceParams from IBullaInvoice.sol
export interface CreateInvoiceParams {
    chainId: ChainId;
    debtor: EthAddress;
    creditor: EthAddress;
    claimAmount: bigint;
    dueBy: bigint; // timestamp
    deliveryDate: bigint; // timestamp, 0 if no purchase order
    description: string;
    token: EthAddress;
    binding: ClaimBinding;
    lateFeeConfig: InterestConfig;
    impairmentGracePeriod: bigint; // seconds
    depositAmount: bigint; // 0 if no purchase order
}

// ClaimMetadata from Types.sol
export interface ClaimMetadata {
    tokenURI: string;
    attachmentURI: string;
}

// For payInvoice
export interface PayInvoiceParams {
    chainId: ChainId;
    claimId: bigint;
    paymentAmount: bigint;
}

// For updateBinding
export interface UpdateBindingParams {
    chainId: ChainId;
    claimId: bigint;
    binding: ClaimBinding;
}

// For cancelInvoice
export interface CancelInvoiceParams {
    chainId: ChainId;
    claimId: bigint;
    note: string;
}

// For generic invoice operations
export interface InvoiceOperationParams {
    chainId: ChainId;
    claimId: bigint;
}

// For acceptPurchaseOrder
export interface AcceptPurchaseOrderParams {
    chainId: ChainId;
    claimId: bigint;
    depositAmount: bigint;
}

// For setPaidInvoiceCallback
export interface SetCallbackParams {
    chainId: ChainId;
    invoiceId: bigint;
    callbackContract: EthAddress;
    callbackSelector: string; // bytes4 as hex string
}
