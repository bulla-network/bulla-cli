import { createPublicClient, decodeEventLog, http, keccak256, parseAbi, toHex } from 'viem';

const erc721TransferAbi = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)']);

/** topic[0] for LoanOffered(uint256 indexed offerId, address indexed offeredBy, LoanRequestParams, ClaimMetadata) */
const LOAN_OFFERED_TOPIC = keccak256(
    toHex(
        'LoanOffered(uint256,address,(uint256,(uint16,uint16),uint256,address,address,string,address,uint256,uint256,address,bytes4),(string,string))',
    ),
);

/**
 * Extract the newly minted token ID (claim ID) from a transaction receipt.
 * Scans for an ERC-721 Transfer event from address(0) — i.e. a mint.
 */
export async function getNewTokenIdFromReceipt(rpcUrl: string, txHash: `0x${string}`): Promise<bigint> {
    const client = createPublicClient({ transport: http(rpcUrl) });

    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    for (const log of receipt.logs) {
        try {
            const decoded = decodeEventLog({
                abi: erc721TransferAbi,
                data: log.data,
                topics: log.topics,
            });
            if (decoded.eventName === 'Transfer' && decoded.args.from === '0x0000000000000000000000000000000000000000') {
                return decoded.args.tokenId;
            }
        } catch {
            // Not a matching event, skip
        }
    }

    throw new Error(`No ERC-721 mint Transfer event found in tx ${txHash}`);
}

/**
 * Extract the offer ID from a FrendLend LoanOffered event in a transaction receipt.
 * LoanOffered has offerId as the first indexed parameter (topics[1]).
 */
export async function getOfferIdFromReceipt(rpcUrl: string, txHash: `0x${string}`): Promise<bigint> {
    const client = createPublicClient({ transport: http(rpcUrl) });

    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    for (const log of receipt.logs) {
        if (log.topics[0] === LOAN_OFFERED_TOPIC && log.topics[1]) {
            return BigInt(log.topics[1]);
        }
    }

    throw new Error(`No LoanOffered event found in tx ${txHash}`);
}
