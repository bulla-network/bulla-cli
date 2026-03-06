import { Data } from 'effect';

export class InvalidAddressError extends Data.TaggedError('InvalidAddressError')<{
    readonly address: string;
    readonly message: string;
}> {}

export class InvalidAmountError extends Data.TaggedError('InvalidAmountError')<{
    readonly amount: string;
    readonly message: string;
}> {}

export class UnsupportedChainError extends Data.TaggedError('UnsupportedChainError')<{
    readonly chainId: number;
    readonly message: string;
}> {}

export class ContractNotFoundError extends Data.TaggedError('ContractNotFoundError')<{
    readonly chainId: number;
    readonly contractName: string;
    readonly message: string;
}> {}

export class TransactionFailedError extends Data.TaggedError('TransactionFailedError')<{
    readonly txHash: string;
    readonly message: string;
}> {}

export class SignerRequiredError extends Data.TaggedError('SignerRequiredError')<{
    readonly message: string;
}> {}

export class InvalidChainError extends Data.TaggedError('InvalidChainError')<{
    readonly chainId: number;
    readonly message: string;
}> {}

export class InvalidBindingError extends Data.TaggedError('InvalidBindingError')<{
    readonly binding: number;
    readonly message: string;
}> {}

export class InvalidCallbackSelectorError extends Data.TaggedError('InvalidCallbackSelectorError')<{
    readonly selector: string;
    readonly message: string;
}> {}

export class InvoiceNotFoundError extends Data.TaggedError('InvoiceNotFoundError')<{
    readonly chainId: number;
    readonly claimId: bigint;
    readonly message: string;
}> {}

export class LoanNotFoundError extends Data.TaggedError('LoanNotFoundError')<{
    readonly chainId: number;
    readonly claimId: bigint;
    readonly message: string;
}> {}

export class RpcConnectionError extends Data.TaggedError('RpcConnectionError')<{
    readonly rpcUrl: string;
    readonly message: string;
}> {}
