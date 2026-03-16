/** BullaApprovalRegistry ABI — declared `as const` for viem type inference. */
export const bullaApprovalRegistryAbi = [
    {
        inputs: [
            { internalType: 'address', name: 'controller', type: 'address' },
            { internalType: 'enum CreateClaimApprovalType', name: 'approvalType', type: 'uint8' },
            { internalType: 'uint64', name: 'approvalCount', type: 'uint64' },
            { internalType: 'bool', name: 'isBindingAllowed', type: 'bool' },
        ],
        name: 'approveCreateClaim',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;
