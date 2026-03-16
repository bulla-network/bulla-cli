import type { ChainId, EthAddress } from './eth.js';

export enum CreateClaimApprovalType {
    Unapproved = 0,
    CreditorOnly = 1,
    DebtorOnly = 2,
    Approved = 3,
}

export interface ApproveCreateClaimParams {
    chainId: ChainId;
    controller: EthAddress;
    approvalType: CreateClaimApprovalType;
    approvalCount: bigint;
    isBindingAllowed: boolean;
}

export interface ApproveNftParams {
    chainId: ChainId;
    to: EthAddress;
    claimId: bigint;
}

export interface TransferNftParams {
    chainId: ChainId;
    from: EthAddress;
    to: EthAddress;
    claimId: bigint;
}

export interface ApproveErc20Params {
    chainId: ChainId;
    token: EthAddress;
    spender: EthAddress;
    amount: bigint;
}
