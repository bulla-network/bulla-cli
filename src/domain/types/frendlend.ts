import type { ChainId, EthAddress } from './eth.js';
import type { ClaimMetadata, InterestConfig } from './invoice.js';

// Reuse ClaimBinding and Status enums from invoice (same underlying Types.sol)
export { ClaimBinding } from './invoice.js';

// Loan status mirrors invoice status (same Types.sol enum)
export enum LoanStatus {
    Pending = 0,
    Repaying = 1,
    Paid = 2,
    Rejected = 3,
    Rescinded = 4,
    Impaired = 5,
}

// LoanRequestParams from IBullaFrendLendV2.sol
export interface OfferLoanParams {
    chainId: ChainId;
    termLength: bigint; // seconds
    interestConfig: InterestConfig;
    loanAmount: bigint;
    creditor: EthAddress;
    debtor: EthAddress;
    description: string;
    token: EthAddress;
    impairmentGracePeriod: bigint; // seconds
    expiresAt: bigint; // timestamp, 0 = no expiry
    callbackContract: EthAddress; // 0x0 = no callback
    callbackSelector: string; // bytes4 hex, 0x00000000 = no callback
    metadata?: ClaimMetadata;
}

// For rejectLoanOffer
export interface RejectLoanOfferParams {
    chainId: ChainId;
    offerId: bigint;
}

// For acceptLoan / acceptLoanWithReceiver
export interface AcceptLoanParams {
    chainId: ChainId;
    offerId: bigint;
    receiver?: EthAddress; // if present, uses acceptLoanWithReceiver
}

// For payLoan
export interface PayLoanParams {
    chainId: ChainId;
    claimId: bigint;
    paymentAmount: bigint;
}

// For generic loan operations (impair, mark-paid)
export interface LoanOperationParams {
    chainId: ChainId;
    claimId: bigint;
}

// For setPaidLoanCallback
export interface SetLoanCallbackParams {
    chainId: ChainId;
    loanId: bigint;
    callbackContract: EthAddress;
    callbackSelector: string; // bytes4 hex
}

// Interest computation state from on-chain
export interface InterestComputationState {
    accruedInterest: bigint;
    latestPeriodNumber: bigint;
    protocolFeeBps: number;
    totalGrossInterestPaid: bigint;
}

// On-chain loan data returned by getLoan
export interface LoanOnChain {
    claimAmount: bigint;
    paidAmount: bigint;
    status: LoanStatus;
    binding: number;
    debtor: EthAddress;
    creditor: EthAddress;
    token: EthAddress;
    controller: EthAddress;
    dueBy: bigint;
    acceptedAt: bigint;
    interestConfig: InterestConfig;
    interestComputationState: InterestComputationState;
}

// On-chain loan offer data returned by getLoanOffer
export interface LoanOfferOnChain {
    params: {
        termLength: bigint;
        interestConfig: InterestConfig;
        loanAmount: bigint;
        creditor: EthAddress;
        debtor: EthAddress;
        description: string;
        token: EthAddress;
        impairmentGracePeriod: bigint;
        expiresAt: bigint;
        callbackContract: EthAddress;
        callbackSelector: string;
    };
    requestedByCreditor: boolean;
}
