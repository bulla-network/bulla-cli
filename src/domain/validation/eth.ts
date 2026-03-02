import { Either } from 'effect';
import { InvalidAddressError, InvalidAmountError, InvalidCallbackSelectorError, InvalidChainError } from '../errors.js';
import { isChainId, type ChainId, type EthAddress, type Hex } from '../types/eth.js';

export const validateChainId = (chain: number): Either.Either<ChainId, InvalidChainError> =>
    isChainId(chain)
        ? Either.right(chain)
        : Either.left(new InvalidChainError({ chainId: chain, message: `Unsupported chain ID: ${chain}` }));

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

export const validateCallbackSelector = (selector: string): Either.Either<Hex, InvalidCallbackSelectorError> =>
    /^0x[0-9a-fA-F]{8}$/.test(selector)
        ? Either.right(selector as Hex)
        : Either.left(
              new InvalidCallbackSelectorError({
                  selector,
                  message: `Invalid callback selector: ${selector}. Must be a bytes4 hex string (e.g., 0x12345678)`,
              }),
          );
