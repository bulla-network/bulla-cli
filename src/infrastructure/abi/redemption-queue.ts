/** RedemptionQueue ABI — declared `as const` for viem type inference. Only includes functions used by the CLI. */
export const redemptionQueueAbi = [
    {
        inputs: [{ internalType: 'uint256', name: 'queueIndex', type: 'uint256' }],
        name: 'cancelQueuedRedemption',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'getQueuedRedemptionsForOwner',
        outputs: [{ internalType: 'uint256[]', name: 'queueIndexes', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;
