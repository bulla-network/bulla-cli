import type { ChainId, EthAddress } from './eth.js';

export interface DepositParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    assets: bigint;
    receiver: EthAddress;
}

export interface RedeemParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    shares: bigint;
    receiver: EthAddress;
    owner: EthAddress;
}

export interface WithdrawParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    assets: bigint;
    receiver: EthAddress;
    owner: EthAddress;
}

export interface ApproveInvoiceParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    invoiceId: bigint;
    targetYieldBps: number;
    spreadBps: number;
    upfrontBps: number;
    initialInvoiceValueOverride: bigint;
}

export interface FundInvoiceParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    invoiceId: bigint;
    factorerUpfrontBps: number;
    receiverAddress: EthAddress;
}

export interface UnfactorInvoiceParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    invoiceId: bigint;
}

export interface PoolOfferLoanParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    debtor: EthAddress;
    targetYieldBps: number;
    spreadBps: number;
    principalAmount: bigint;
    termLength: bigint;
    numberOfPeriodsPerYear: number;
    description: string;
}

export interface CancelQueuedRedemptionParams {
    chainId: ChainId;
    poolAddress: EthAddress;
    owner: EthAddress;
}

// -- View function result types --

// Result of getFundInfo()
export interface FundInfo {
    totalAssets: bigint;
    totalSupply: bigint;
    adminFeeBalance: bigint;
    protocolFeeBalance: bigint;
}

// Result of viewPoolStatus(offset, limit)
export interface PoolStatus {
    impairedInvoiceIds: readonly bigint[];
    hasMore: boolean;
}

// Result of previewUnfactor(invoiceId) — int256 can be negative
export interface UnfactorPreview {
    totalRefundOrPaymentAmount: bigint;
}

// Result of calculateKickbackAmount(invoiceId)
export interface KickbackInfo {
    kickbackAmount: bigint;
    trueInterest: bigint;
    trueSpreadAmount: bigint;
    trueAdminFee: bigint;
}

// Result of calculateTargetFees(invoiceId, factorerUpfrontBps)
export interface TargetFeeBreakdown {
    fundedAmountGross: bigint;
    adminFee: bigint;
    targetInterest: bigint;
    targetSpreadAmount: bigint;
    protocolFee: bigint;
    netFundedAmount: bigint;
}

// Result of getQueueStats()
export interface QueueStats {
    queueLength: bigint;
    totalShares: bigint;
    totalAssets: bigint;
}

// Result of getNextRedemption() / getQueuedRedemption(index)
export interface QueuedRedemption {
    owner: EthAddress;
    shares: bigint;
    assets: bigint;
}
