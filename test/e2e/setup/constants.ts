// Anvil default accounts (derived from mnemonic: "test test test test test test test test test test test junk")
// Each account is pre-funded with 10000 ETH on the fork.
export const ANVIL_ACCOUNTS = {
    account0: {
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    },
    account1: {
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    },
} as const;

export const SEPOLIA_CHAIN_ID = 11155111;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Sepolia contract addresses (from generated registry)
export const CONTRACTS = {
    bullaInstantPayment: '0x1cD1A83C2965CB7aD55d60551877Eb390e9C3d7A' as `0x${string}`,
    bullaInvoice: '0xa2c4B7239A0d179A923751cC75277fe139AB092F' as `0x${string}`,
    frendLendV2: '0x4d6A66D32CF34270e4cc9C9F201CA4dB650Be3f2' as `0x${string}`,
};
