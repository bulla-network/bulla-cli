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
