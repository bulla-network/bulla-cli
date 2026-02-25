import { Effect, Layer } from 'effect';
import { encodeFunctionData } from 'viem';
import { BlockchainService } from '../../application/ports/blockchain-port.js';
import type { Hex } from '../../domain/types/eth.js';
import { bullaInstantPaymentAbi } from '../abi/bulla-instant-payment.js';

export const ViemBlockchainServiceLive = Layer.succeed(BlockchainService, {
    encodeInstantPayment: params =>
        Effect.try({
            try: () =>
                encodeFunctionData({
                    abi: bullaInstantPaymentAbi,
                    functionName: 'instantPayment',
                    args: [
                        params.to as `0x${string}`,
                        params.amount,
                        params.tokenAddress as `0x${string}`,
                        params.description,
                        params.tag,
                        params.ipfsHash,
                    ],
                }) as Hex,
            catch: err => {
                throw new Error(`Failed to encode instantPayment calldata: ${err}`);
            },
        }),
});
