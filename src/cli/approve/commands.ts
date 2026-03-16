import { Command } from '@effect/cli';
import { Console, Effect, Option } from 'effect';
import { buildApproveCreateClaim, buildApproveErc20, buildApproveNft } from '../../application/services/approve-service.js';
import { sendTransaction } from '../../application/services/transaction-utils.js';
import type { Hex } from '../../domain/types/eth.js';
import { makeSignerLayer } from '../../infrastructure/layers.js';
import { formatResult, formatTransaction, type OutputFormat } from '../formatters/index.js';
import { chainOption, formatOption, rpcUrlOption } from '../options/common.js';
import { privateKeyOption } from '../options/pay-options.js';
import {
    approvalCountOption,
    approvalTypeOption,
    approveAmountOption,
    approveClaimIdOption,
    approveToOption,
    bindingAllowedOption,
    controllerOption,
    erc20TokenOption,
    spenderOption,
} from './options.js';
import {
    validateApproveCreateClaimParams,
    validateApproveErc20Params,
    validateApproveNftParams,
} from './validation.js';

// ============================================================================
// APPROVE CREATE-CLAIM
// ============================================================================

const approveCreateClaimBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        controller: controllerOption,
        approvalType: approvalTypeOption,
        approvalCount: approvalCountOption,
        bindingAllowed: bindingAllowedOption,
        format: formatOption,
    },
    ({ chain, controller, approvalType, approvalCount, bindingAllowed, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveCreateClaimParams(chain, controller, approvalType, approvalCount, bindingAllowed);
            const tx = yield* buildApproveCreateClaim(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned approveCreateClaim transaction (no private key required)'));

const approveCreateClaimExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        controller: controllerOption,
        approvalType: approvalTypeOption,
        approvalCount: approvalCountOption,
        bindingAllowed: bindingAllowedOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, controller, approvalType, approvalCount, bindingAllowed, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveCreateClaimParams(chain, controller, approvalType, approvalCount, bindingAllowed);
            const tx = yield* buildApproveCreateClaim(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an approveCreateClaim transaction (requires private key)'));

const approveCreateClaimCommand = Command.make('create-claim', {}).pipe(
    Command.withDescription('Approve a controller to create claims on your behalf (BullaApprovalRegistry)'),
    Command.withSubcommands([approveCreateClaimBuildCommand, approveCreateClaimExecuteCommand]),
);

// ============================================================================
// APPROVE NFT
// ============================================================================

const approveNftBuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        to: approveToOption,
        claimId: approveClaimIdOption,
        format: formatOption,
    },
    ({ chain, to, claimId, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveNftParams(chain, to, claimId);
            const tx = yield* buildApproveNft(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned ERC721 approve transaction (no private key required)'));

const approveNftExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        to: approveToOption,
        claimId: approveClaimIdOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, to, claimId, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveNftParams(chain, to, claimId);
            const tx = yield* buildApproveNft(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an ERC721 approve transaction (requires private key)'));

const approveNftCommand = Command.make('nft', {}).pipe(
    Command.withDescription('Approve an address for a specific claim NFT (BullaClaimV2)'),
    Command.withSubcommands([approveNftBuildCommand, approveNftExecuteCommand]),
);

// ============================================================================
// APPROVE ERC20
// ============================================================================

const approveErc20BuildCommand = Command.make(
    'build',
    {
        chain: chainOption,
        token: erc20TokenOption,
        spender: spenderOption,
        amount: approveAmountOption,
        format: formatOption,
    },
    ({ chain, token, spender, amount, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveErc20Params(chain, token, spender, amount);
            const tx = yield* buildApproveErc20(params);
            yield* Console.log(formatTransaction(tx, params.chainId, format as OutputFormat));
        }),
).pipe(Command.withDescription('Build an unsigned ERC20 approve transaction (no private key required)'));

const approveErc20ExecuteCommand = Command.make(
    'execute',
    {
        chain: chainOption,
        token: erc20TokenOption,
        spender: spenderOption,
        amount: approveAmountOption,
        privateKey: privateKeyOption,
        rpcUrl: rpcUrlOption,
        format: formatOption,
    },
    ({ chain, token, spender, amount, privateKey, rpcUrl, format }) =>
        Effect.gen(function* () {
            const params = yield* validateApproveErc20Params(chain, token, spender, amount);
            const tx = yield* buildApproveErc20(params);
            const signerLayer = makeSignerLayer(privateKey as Hex, Option.getOrUndefined(rpcUrl));
            const result = yield* sendTransaction(params.chainId, tx).pipe(Effect.provide(signerLayer));
            yield* Console.log(formatResult(result, format as OutputFormat));
        }),
).pipe(Command.withDescription('Sign and send an ERC20 approve transaction (requires private key)'));

const approveErc20Command = Command.make('erc20', {}).pipe(
    Command.withDescription('Approve a spender for an ERC20 token'),
    Command.withSubcommands([approveErc20BuildCommand, approveErc20ExecuteCommand]),
);

// ============================================================================
// EXPORT ALL APPROVE COMMANDS
// ============================================================================

export const approveCommands = [
    approveCreateClaimCommand,
    approveNftCommand,
    approveErc20Command,
] as const;
