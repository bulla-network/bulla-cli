import type { EthAddress } from './eth.js';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as EthAddress;

export const isNativeToken = (tokenAddress: EthAddress): boolean => tokenAddress === ZERO_ADDRESS;
