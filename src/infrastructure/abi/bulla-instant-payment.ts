/** BullaInstantPayment ABI — declared `as const` for viem type inference. */
export const bullaInstantPaymentAbi = [
    {
        inputs: [],
        name: 'ValueMustNoBeZero',
        type: 'error',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'from', type: 'address' },
            { indexed: true, internalType: 'address', name: 'to', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'tokenAddress', type: 'address' },
            { indexed: false, internalType: 'string', name: 'description', type: 'string' },
            { indexed: false, internalType: 'string', name: 'tag', type: 'string' },
            { indexed: false, internalType: 'string', name: 'ipfsHash', type: 'string' },
            { indexed: false, internalType: 'uint256', name: 'blocktime', type: 'uint256' },
        ],
        name: 'InstantPayment',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'bytes32', name: 'txAndLogIndexHash', type: 'bytes32' },
            { indexed: true, internalType: 'address', name: 'updatedBy', type: 'address' },
            { indexed: false, internalType: 'string', name: 'tag', type: 'string' },
            { indexed: false, internalType: 'uint256', name: 'blocktime', type: 'uint256' },
        ],
        name: 'InstantPaymentTagUpdated',
        type: 'event',
    },
    {
        inputs: [
            { internalType: 'bytes[]', name: 'calls', type: 'bytes[]' },
            { internalType: 'bool', name: 'revertOnFail', type: 'bool' },
        ],
        name: 'batch',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'tokenAddress', type: 'address' },
            { internalType: 'string', name: 'description', type: 'string' },
            { internalType: 'string', name: 'tag', type: 'string' },
            { internalType: 'string', name: 'ipfsHash', type: 'string' },
        ],
        name: 'instantPayment',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'txAndLogIndexHash', type: 'bytes32' },
            { internalType: 'string', name: 'newTag', type: 'string' },
        ],
        name: 'updateBullaTag',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;
