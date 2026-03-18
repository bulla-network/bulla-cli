import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLI_PATH = resolve(__dirname, '../../../dist/index.js');

export interface CliResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export interface TransactionOutput {
    txHash: string;
    chainId: number;
    blockNumber: number;
}

/** Run a bulla CLI command and return raw stdout/stderr/exitCode. */
export function runCli(args: string[], env?: Record<string, string>): CliResult {
    const result = spawnSync('node', [CLI_PATH, ...args], {
        encoding: 'utf-8',
        timeout: 60_000,
        env: env ? { ...process.env, ...env } : undefined,
    });
    return {
        stdout: (result.stdout ?? '').trim(),
        stderr: (result.stderr ?? '').trim(),
        exitCode: result.status ?? 1,
    };
}

/** Run a bulla CLI command asynchronously (non-blocking — allows in-process servers to respond). */
export function runCliAsync(args: string[], env?: Record<string, string>): Promise<CliResult> {
    return new Promise((resolve) => {
        const child = spawn('node', [CLI_PATH, ...args], {
            env: env ? { ...process.env, ...env } : undefined,
            timeout: 30_000,
        });

        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
        child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
        child.on('close', (code) => {
            resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? 1 });
        });
    });
}

/** Run a bulla CLI execute command with --format json and parse the TransactionOutput. */
export function runCliExecute(args: string[]): TransactionOutput {
    const result = runCli([...args, '--format', 'json']);
    if (result.exitCode !== 0 || !result.stdout) {
        throw new Error(
            `CLI failed (exit ${result.exitCode})\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
        );
    }
    return JSON.parse(result.stdout) as TransactionOutput;
}
