import { createPublicClient, createWalletClient, http, maxUint64, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

/** Sepolia WETH9 address */
export const WETH_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9' as const;

/** Sepolia BullaApprovalRegistry address */
const APPROVAL_REGISTRY = '0xb1F9a06D72F8737B4fcf4550f1C8EA769772Ad76' as const;

const wethAbi = parseAbi([
    'function deposit() payable',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address) view returns (uint256)',
]);

const approvalRegistryAbi = parseAbi([
    'function approveCreateClaim(address controller, uint8 approvalType, uint64 approvalCount, bool isBindingAllowed)',
]);

function makeClients(rpcUrl: string, privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey);
    return {
        wallet: createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) }),
        public: createPublicClient({ chain: sepolia, transport: http(rpcUrl) }),
    };
}

/**
 * Wrap ETH into WETH for a given account and approve a spender contract.
 * This is used in e2e tests for invoice/frendlend which require ERC20 tokens.
 */
export async function wrapEthAndApprove(rpcUrl: string, privateKey: `0x${string}`, spender: `0x${string}`, amount: bigint) {
    const { wallet, public: pub } = makeClients(rpcUrl, privateKey);

    // Deposit ETH to get WETH
    const depositHash = await wallet.writeContract({
        address: WETH_ADDRESS,
        abi: wethAbi,
        functionName: 'deposit',
        value: amount,
    });
    await pub.waitForTransactionReceipt({ hash: depositHash });

    // Approve the spender to use our WETH
    const approveHash = await wallet.writeContract({
        address: WETH_ADDRESS,
        abi: wethAbi,
        functionName: 'approve',
        args: [spender, amount * 10n],
    });
    await pub.waitForTransactionReceipt({ hash: approveHash });
}

/**
 * Approve a Bulla controller contract (invoice/frendlend) on the BullaApprovalRegistry.
 * approvalType 3 = Approved (full permissions), maxUint64 = unlimited claims.
 */
export async function approveCreateClaim(rpcUrl: string, privateKey: `0x${string}`, controller: `0x${string}`) {
    const { wallet, public: pub } = makeClients(rpcUrl, privateKey);

    const hash = await wallet.writeContract({
        address: APPROVAL_REGISTRY,
        abi: approvalRegistryAbi,
        functionName: 'approveCreateClaim',
        args: [controller, 3, maxUint64, true],
    });
    await pub.waitForTransactionReceipt({ hash: hash });
}
