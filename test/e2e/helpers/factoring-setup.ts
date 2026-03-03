import {
    concat,
    createPublicClient,
    createWalletClient,
    encodeAbiParameters,
    http,
    keccak256,
    numberToHex,
    pad,
    parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

/** Minimal ABI for BullaFactoringV2_1 admin/view functions used in e2e setup. */
const factoringPoolAbi = parseAbi([
    'function asset() view returns (address)',
    'function owner() view returns (address)',
    'function underwriter() view returns (address)',
    'function depositPermissions() view returns (address)',
    'function redeemPermissions() view returns (address)',
    'function factoringPermissions() view returns (address)',
    'function invoiceProviderAdapter() view returns (address)',
    'function totalAssets() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function setUnderwriter(address) nonpayable',
    'function setDepositPermissions(address) nonpayable',
    'function setRedeemPermissions(address) nonpayable',
]);

/** ABI for reading BullaInvoice's _bullaClaim getter (inherited from BullaClaimControllerBase). */
const bullaInvoiceAbi = parseAbi(['function _bullaClaim() view returns (address)']);

/** Minimal ABI for Permissions contracts (DepositPermissions, RedeemPermissions, FactoringPermissions). */
const permissionsAbi = parseAbi([
    'function owner() view returns (address)',
    'function isAllowed(address _address) view returns (bool)',
    'function allow(address _address) nonpayable',
]);

/** Minimal ABI for ERC721 approve on BullaInvoice (controller-delegated approval for a specific tokenId). */
const erc721ApproveAbi = parseAbi(['function approve(address to, uint256 tokenId)']);

/** Minimal ABI for ERC20 operations. */
const erc20Abi = parseAbi([
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
]);

export interface PoolInfo {
    asset: `0x${string}`;
    owner: `0x${string}`;
    underwriter: `0x${string}`;
    depositPermissions: `0x${string}`;
    redeemPermissions: `0x${string}`;
    factoringPermissions: `0x${string}`;
}

function pub(rpcUrl: string) {
    return createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
}

/** Read key pool info for test setup. */
export async function readPoolInfo(rpcUrl: string, poolAddress: `0x${string}`): Promise<PoolInfo> {
    const client = pub(rpcUrl);
    const [asset, owner, underwriter, depositPermissions, redeemPermissions, factoringPermissions] = await Promise.all([
        client.readContract({ address: poolAddress, abi: factoringPoolAbi, functionName: 'asset' }),
        client.readContract({ address: poolAddress, abi: factoringPoolAbi, functionName: 'owner' }),
        client.readContract({ address: poolAddress, abi: factoringPoolAbi, functionName: 'underwriter' }),
        client.readContract({ address: poolAddress, abi: factoringPoolAbi, functionName: 'depositPermissions' }),
        client.readContract({ address: poolAddress, abi: factoringPoolAbi, functionName: 'redeemPermissions' }),
        client.readContract({ address: poolAddress, abi: factoringPoolAbi, functionName: 'factoringPermissions' }),
    ]);
    return { asset, owner, underwriter, depositPermissions, redeemPermissions, factoringPermissions };
}

/** Impersonate an account on Anvil, execute a callback, then stop impersonation. */
async function withImpersonation(rpcUrl: string, address: `0x${string}`, fn: () => Promise<void>) {
    const client = pub(rpcUrl);
    await client.request({ method: 'anvil_impersonateAccount' as any, params: [address] } as any);
    // Fund the impersonated account with ETH for gas
    await client.request({ method: 'anvil_setBalance' as any, params: [address, numberToHex(10n ** 18n)] } as any);
    try {
        await fn();
    } finally {
        await client.request({ method: 'anvil_stopImpersonatingAccount' as any, params: [address] } as any);
    }
}

/** Change the pool's underwriter to a new address (requires impersonating the pool owner). */
export async function setPoolUnderwriter(
    rpcUrl: string,
    poolAddress: `0x${string}`,
    poolOwner: `0x${string}`,
    newUnderwriter: `0x${string}`,
) {
    await withImpersonation(rpcUrl, poolOwner, async () => {
        const wallet = createWalletClient({ account: poolOwner, chain: sepolia, transport: http(rpcUrl) });
        const hash = await wallet.writeContract({
            address: poolAddress,
            abi: factoringPoolAbi,
            functionName: 'setUnderwriter',
            args: [newUnderwriter],
        });
        await pub(rpcUrl).waitForTransactionReceipt({ hash });
    });
}

/** Whitelist an address on a Permissions contract by impersonating its owner. */
export async function whitelistOnPermissions(rpcUrl: string, permissionsAddress: `0x${string}`, account: `0x${string}`) {
    const client = pub(rpcUrl);

    // Check if already allowed
    const allowed = await client.readContract({
        address: permissionsAddress,
        abi: permissionsAbi,
        functionName: 'isAllowed',
        args: [account],
    });
    if (allowed) return;

    const permOwner = await client.readContract({
        address: permissionsAddress,
        abi: permissionsAbi,
        functionName: 'owner',
    });

    await withImpersonation(rpcUrl, permOwner, async () => {
        const wallet = createWalletClient({ account: permOwner, chain: sepolia, transport: http(rpcUrl) });
        const hash = await wallet.writeContract({
            address: permissionsAddress,
            abi: permissionsAbi,
            functionName: 'allow',
            args: [account],
        });
        await pub(rpcUrl).waitForTransactionReceipt({ hash });
    });
}

/**
 * Deal ERC20 tokens to an account by probing storage slots on the Anvil fork.
 * Tries mapping slots 0-20 to find the balanceOf mapping, then sets the balance.
 */
export async function dealERC20(rpcUrl: string, token: `0x${string}`, to: `0x${string}`, amount: bigint) {
    const client = pub(rpcUrl);

    for (let slot = 0; slot < 20; slot++) {
        // Solidity mapping storage: keccak256(abi.encode(key, mappingSlot))
        const storageSlot = keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [to, BigInt(slot)]));

        // Save old balance
        const oldBalance = await client.readContract({ address: token, abi: erc20Abi, functionName: 'balanceOf', args: [to] });

        // Set storage
        await client.request({
            method: 'anvil_setStorageAt' as any,
            params: [token, storageSlot, pad(numberToHex(amount), { size: 32 })],
        } as any);

        // Check if balance changed
        const newBalance = await client.readContract({ address: token, abi: erc20Abi, functionName: 'balanceOf', args: [to] });
        if (newBalance === amount) {
            return;
        }

        // Restore old value if this wasn't the right slot
        const oldValue = oldBalance > 0n ? pad(numberToHex(oldBalance), { size: 32 }) : pad('0x0', { size: 32 });
        await client.request({
            method: 'anvil_setStorageAt' as any,
            params: [token, storageSlot, oldValue],
        } as any);
    }

    throw new Error(`Could not deal ERC20 ${token} to ${to}: balance mapping slot not found in slots 0-19`);
}

/** Approve a spender to use an ERC20 token. */
export async function approveERC20(
    rpcUrl: string,
    privateKey: `0x${string}`,
    token: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
) {
    const account = privateKeyToAccount(privateKey);
    const wallet = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
    const hash = await wallet.writeContract({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
    });
    await pub(rpcUrl).waitForTransactionReceipt({ hash });
}

/**
 * Approve a spender for a specific invoice NFT on the BullaInvoice controller contract.
 * BullaClaimV2 disables setApprovalForAll, so approval must be done per-token via the controller.
 */
export async function approveNFTForPool(
    rpcUrl: string,
    privateKey: `0x${string}`,
    bullaInvoiceAddress: `0x${string}`,
    spender: `0x${string}`,
    tokenId: bigint,
) {
    const account = privateKeyToAccount(privateKey);
    const wallet = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
    const hash = await wallet.writeContract({
        address: bullaInvoiceAddress,
        abi: erc721ApproveAbi,
        functionName: 'approve',
        args: [spender, tokenId],
    });
    await pub(rpcUrl).waitForTransactionReceipt({ hash });
}

/** Read the decimals of an ERC20 token. */
export async function getTokenDecimals(rpcUrl: string, token: `0x${string}`): Promise<number> {
    return pub(rpcUrl).readContract({ address: token, abi: erc20Abi, functionName: 'decimals' });
}

/** Read the pool share balance for an account. */
export async function getPoolShares(rpcUrl: string, poolAddress: `0x${string}`, account: `0x${string}`): Promise<bigint> {
    return pub(rpcUrl).readContract({ address: poolAddress, abi: factoringPoolAbi, functionName: 'balanceOf', args: [account] });
}

/**
 * Deploy a new BullaClaimV2InvoiceProviderAdapterV2 and point the pool to it.
 *
 * The Sepolia deployment has a mismatch: the existing adapter was deployed with
 * a different BullaClaimV2 than the one BullaInvoice creates claims on. Since
 * the adapter stores BullaFrendLend and BullaInvoice as immutables (embedded in
 * bytecode), we must deploy a fresh adapter with the correct constructor args and
 * then overwrite the pool's storage slot to point to the new adapter.
 */
export async function fixInvoiceProviderAdapter(
    rpcUrl: string,
    poolAddress: `0x${string}`,
    bullaInvoiceAddress: `0x${string}`,
    frendLendAddress: `0x${string}`,
    deployerPrivateKey: `0x${string}`,
) {
    const client = pub(rpcUrl);

    // Read the correct BullaClaimV2 address from BullaInvoice
    const correctBullaClaimV2 = await client.readContract({
        address: bullaInvoiceAddress,
        abi: bullaInvoiceAbi,
        functionName: '_bullaClaim',
    });

    // Read the pool's current adapter address
    const oldAdapter = await client.readContract({
        address: poolAddress,
        abi: factoringPoolAbi,
        functionName: 'invoiceProviderAdapter',
    });

    // Deploy new adapter: constructor(address _bullaClaimV2, address _bullaFrendLend, address _bullaInvoice)
    const constructorArgs = encodeAbiParameters(
        [{ type: 'address' }, { type: 'address' }, { type: 'address' }],
        [correctBullaClaimV2, frendLendAddress, bullaInvoiceAddress],
    );
    const deployData = concat([ADAPTER_BYTECODE, constructorArgs]);

    const deployer = privateKeyToAccount(deployerPrivateKey);
    const wallet = createWalletClient({ account: deployer, chain: sepolia, transport: http(rpcUrl) });
    const deployHash = await wallet.sendTransaction({ data: deployData });
    const receipt = await client.waitForTransactionReceipt({ hash: deployHash });
    const newAdapter = receipt.contractAddress;
    if (!newAdapter) throw new Error('Adapter deployment failed — no contract address in receipt');

    // Find and overwrite the pool's storage slot that holds the adapter address
    const oldAdapterPadded = pad(oldAdapter, { size: 32 }).toLowerCase();
    for (let slot = 0; slot < 60; slot++) {
        const slotHex = `0x${slot.toString(16)}` as `0x${string}`;
        const value = await client.getStorageAt({ address: poolAddress, slot: slotHex });
        if (value?.toLowerCase() === oldAdapterPadded) {
            await client.request({
                method: 'anvil_setStorageAt' as any,
                params: [poolAddress, slotHex, pad(newAdapter, { size: 32 })],
            } as any);
            return;
        }
    }

    throw new Error(`Could not find adapter storage slot in pool ${poolAddress} (scanned slots 0-59)`);
}

/** BullaClaimV2InvoiceProviderAdapterV2 creation bytecode (from Foundry artifact). */
const ADAPTER_BYTECODE =
    '0x60c0346100b457601f610c8038819003918201601f19168301916001600160401b038311848410176100b8578084926060946040528339810103126100b457610047816100cc565b906100606040610059602084016100cc565b92016100cc565b5f80546001600160a01b0319166001600160a01b039485161790559082166080521660a052604051610b9f90816100e182396080518181816102c501526106e2015260a05181818161030401526109070152f35b5f80fd5b634e487b7160e01b5f52604160045260245ffd5b51906001600160a01b03821682036100b45756fe60806040526004361015610011575f80fd5b5f3560e01c80636223195b1461025857806387bb8b3c14610126578063909a708a1461009b5763e8a5bfb814610045575f80fd5b3461009757602036600319011261009757610061600435610b2e565b6001600160a01b03811661008f575060206001600160a01b035f54165b6001600160a01b0360405191168152f35b60209061007e565b5f80fd5b34610097576020366003190112610097576101206100ba60043561055e565b6001600160a01b03610100604051928051845260208101516020850152604081015160408501526060810151606085015282608082015116608085015260a0810151151560a085015260c0810151151560c08501528260e08201511660e0850152015116610100820152f35b346100975760203660031901126100975760043560246101606001600160a01b035f541660405192838092635aef244760e01b82528660048301525afa90811561024d575f9161021e575b506001600160a01b0360c0820151161580610209575b6101fa57806001600160a01b03610100606093015116835f52600160205260405f20907fffffffffffffffffffffffff00000000000000000000000000000000000000008254161790550151815f52600260205260405f20555f52600360205260405f20600160ff198254161790555f80f35b632d34562f60e21b5f5260045ffd5b506001600160a01b0360a08201511615610187565b61024091506101603d8111610246575b610238818361039d565b8101906103d3565b82610171565b503d61022e565b6040513d5f823e3d90fd5b34610097576020366003190112610097576040610276600435610294565b6001600160a01b0383519216825263ffffffff60e01b166020820152f35b6102a56001600160a01b0391610b2e565b16806102c357505f546001600160a01b03169063a94c68df60e01b90565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169080820361030257509063ea7d616b60e01b90565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316915081036103405790633af4885360e21b90565b636db370e760e01b5f5260045ffd5b610160810190811067ffffffffffffffff82111761036c57604052565b634e487b7160e01b5f52604160045260245ffd5b610120810190811067ffffffffffffffff82111761036c57604052565b90601f8019910116810190811067ffffffffffffffff82111761036c57604052565b51906001600160a01b038216820361009757565b908161016091031261009757604051906103ec8261034f565b8051825260208101516020830152604081015160408301526060810151606083015261041a608082016103bf565b608083015261042b60a082016103bf565b60a083015261043c60c082016103bf565b60c083015261044d60e082016103bf565b60e083015261045f61010082016103bf565b6101008301526101208101519060068210156100975761014091610120840152015160038110156100975761014082015290565b519061ffff8216820361009757565b9190826040910312610097576040516040810181811067ffffffffffffffff82111761036c5760405260206104e48183956104dc81610493565b855201610493565b910152565b9190826080910312610097576040516080810181811067ffffffffffffffff82111761036c576040526060808294805184526020810151602085015261053160408201610493565b60408501520151910152565b9190820180921161054a57565b634e487b7160e01b5f52601160045260245ffd5b60405161056a81610380565b5f81525f60208201525f60408201525f60608201525f60808201525f60a08201525f60c08201525f60e08201525f610100820152506001600160a01b036105b082610b2e565b16806106e057506101606001600160a01b035f541691602460405180948193635aef244760e01b835260048301525afa90811561024d575f916106c1575b506020810151908051916001600160a01b0360c083015116916001600160a01b0360a0820151169160408201516001600160a01b0360e0840151169461012084019182516006811015610697576003149283156106ab575b51936006851015610697576060600296015191604051996106668b610380565b8a5260208a0152604089015260608801526080870152151560a08601521460c084015260e083015261010082015290565b634e487b7160e01b5f52602160045260245ffd5b8093505160068110156106975760041492610646565b6106da91506101603d811161024657610238818361039d565b5f6105ee565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690808203610905575061020060249160405192838092632820036560e11b82528660048301525afa90811561024d575f916107fc575b50610160810151610770606082015191519161076b61076382602087015161053d565b93855161053d565b61053d565b926001600160a01b0360a084015116916001600160a01b03608085015116926101008501519060406001600160a01b0360c08801511696019182516006811015610697576003149283156107e6575b51936006851015610697576002955f528560205260405f205491604051996106668b610380565b80935051600681101561069757600414926107bf565b90506102003d81116108fe575b610813818361039d565b810190610200818303126100975760405191610180830183811067ffffffffffffffff82111761036c5760405281518352602082015160208401526040820151600681101561009757604084015260608201516003811015610097576108f292610180916060860152610888608082016103bf565b608086015261089960a082016103bf565b60a08601526108aa60c082016103bf565b60c08601526108bb60e082016103bf565b60e08601526101008101516101008601526101208101516101208601526108e68361014083016104a2565b610140860152016104e9565b6101608201525f610740565b503d610809565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316915081036103405761022060249160405192838092631d11e60560e11b82528660048301525afa90811561024d575f916109fb575b50610140810151610987606082015191519161076b61076382602087015161053d565b926001600160a01b03606084015116916001600160a01b036080850151169260408501519060c06001600160a01b0360a08801511696019182516006811015610697576003149283156107e65751936006851015610697576002955f528560205260405f205491604051996106668b610380565b90506102203d8111610b27575b610a12818361039d565b8101908082039161022083126100975760405192610a2f8461034f565b825184526020830151602085015260408301516040850152610a53606084016103bf565b6060850152610a64608084016103bf565b6080850152610a7560a084016103bf565b60a085015260c083015160068110156100975760c085015260e08301519060038210156100975760609160e086015260ff19011261009757604051916060830183811067ffffffffffffffff82111761036c576040526101008101518352610120810151602084015261014081015190811515820361009757836101a0926040610b1b960152610100860152610b0f8361016083016104a2565b610120860152016104e9565b6101408201525f610964565b503d610a08565b805f52600360205260ff60405f205416610b5157632d34562f60e21b5f5260045ffd5b5f5260016020526001600160a01b0360405f2054169056fea2646970667358221220fdea5b33b6c28e433b64164929276773f6dbab8314d9704c56a968b3ab3e828964736f6c634300081e0033' as `0x${string}`;
