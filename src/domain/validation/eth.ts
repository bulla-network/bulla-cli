import { Either } from 'effect';
import type { EthAddress } from '../types/eth.js';
import { InvalidAddressError, InvalidAmountError } from '../errors.js';

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export const validateAddress = (input: string): Either.Either<EthAddress, InvalidAddressError> => {
    if (!ETH_ADDRESS_RE.test(input)) {
        return Either.left(new InvalidAddressError({ address: input, message: `Invalid Ethereum address: ${input}` }));
    }
    return Either.right(input.toLowerCase() as EthAddress);
};

export const validateAmount = (input: string): Either.Either<bigint, InvalidAmountError> => {
    try {
        const val = BigInt(input);
        if (val <= 0n) {
            return Either.left(new InvalidAmountError({ amount: input, message: 'Amount must be greater than zero' }));
        }
        return Either.right(val);
    } catch {
        return Either.left(new InvalidAmountError({ amount: input, message: `Invalid amount: ${input}` }));
    }
};

export const validateAmountOrZero = (input: string): Either.Either<bigint, InvalidAmountError> => {
    try {
        const val = BigInt(input);
        if (val < 0n) {
            return Either.left(new InvalidAmountError({ amount: input, message: 'Amount must be non-negative' }));
        }
        return Either.right(val);
    } catch {
        return Either.left(new InvalidAmountError({ amount: input, message: `Invalid amount: ${input}` }));
    }
};
