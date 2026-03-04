/** BullaFactoringV2_1 ABI — declared `as const` for viem type inference. Only includes functions used by the CLI. */
export const bullaFactoringV2_1Abi = [
    {
        inputs: [
            { internalType: 'uint256', name: 'assets', type: 'uint256' },
            { internalType: 'address', name: 'receiver', type: 'address' },
        ],
        name: 'deposit',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'shares', type: 'uint256' },
            { internalType: 'address', name: 'receiver', type: 'address' },
            { internalType: 'address', name: '_owner', type: 'address' },
        ],
        name: 'redeem',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'assets', type: 'uint256' },
            { internalType: 'address', name: 'receiver', type: 'address' },
            { internalType: 'address', name: '_owner', type: 'address' },
        ],
        name: 'withdraw',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'invoiceId', type: 'uint256' },
            { internalType: 'uint16', name: '_targetYieldBps', type: 'uint16' },
            { internalType: 'uint16', name: '_spreadBps', type: 'uint16' },
            { internalType: 'uint16', name: '_upfrontBps', type: 'uint16' },
            { internalType: 'uint256', name: '_initialInvoiceValueOverride', type: 'uint256' },
        ],
        name: 'approveInvoice',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'invoiceId', type: 'uint256' },
            { internalType: 'uint16', name: 'factorerUpfrontBps', type: 'uint16' },
            { internalType: 'address', name: 'receiverAddress', type: 'address' },
        ],
        name: 'fundInvoice',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'invoiceId', type: 'uint256' }],
        name: 'unfactorInvoice',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'debtor', type: 'address' },
            { internalType: 'uint16', name: '_targetYieldBps', type: 'uint16' },
            { internalType: 'uint16', name: 'spreadBps', type: 'uint16' },
            { internalType: 'uint256', name: 'principalAmount', type: 'uint256' },
            { internalType: 'uint256', name: 'termLength', type: 'uint256' },
            { internalType: 'uint16', name: 'numberOfPeriodsPerYear', type: 'uint16' },
            { internalType: 'string', name: 'description', type: 'string' },
        ],
        name: 'offerLoan',
        outputs: [{ internalType: 'uint256', name: 'loanOfferId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getRedemptionQueue',
        outputs: [{ internalType: 'contract IRedemptionQueue', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;
