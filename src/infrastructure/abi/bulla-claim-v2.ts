/** BullaClaimV2 (ERC721) ABI — only the approve function. */
export const bullaClaimV2Abi = [
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;
