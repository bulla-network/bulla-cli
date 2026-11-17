import { type ChildProcess, spawn } from 'node:child_process';
import { ANVIL_ACCOUNTS } from './constants.js';

export interface AnvilInstance {
    process: ChildProcess;
    rpcUrl: string;
    stop: () => void;
}

/** Each test file gets a unique port to avoid conflicts when running in parallel. */
function randomPort(): number {
    return 10000 + Math.floor(Math.random() * 50000);
}

/** Attempts to start a forked anvil before giving up. Each attempt uses a fresh port. */
const START_ATTEMPTS = 3;
const START_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

/**
 * Start anvil forking `forkUrl`. Anvil exits at once when it can't start (the fork RPC fails, the port
 * is taken), so an early exit fails the attempt with anvil's own error instead of waiting for the
 * timeout. Failed attempts are retried on a new port, because a public fork RPC fails now and then
 * when several test files fork it at the same time.
 */
export async function startAnvil(forkUrl: string): Promise<AnvilInstance> {
    const errors: string[] = [];
    for (let attempt = 1; attempt <= START_ATTEMPTS; attempt++) {
        try {
            return await startAnvilOnce(forkUrl);
        } catch (err) {
            errors.push(`attempt ${attempt}: ${(err as Error).message}`);
            if (attempt < START_ATTEMPTS) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
    }
    throw new Error(`Anvil failed to start after ${START_ATTEMPTS} attempts:\n${errors.join('\n')}`);
}

async function startAnvilOnce(forkUrl: string): Promise<AnvilInstance> {
    const port = randomPort();
    const rpcUrl = `http://127.0.0.1:${port}`;
    const args = ['--fork-url', forkUrl, '--port', String(port), '--silent'];

    const proc = spawn('anvil', args, {
        stdio: 'pipe',
        shell: process.platform === 'win32',
    });

    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    proc.stdout?.resume();

    const stop = () => {
        if (process.platform === 'win32') {
            if (proc.pid) spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { shell: true });
        } else {
            proc.kill('SIGTERM');
        }
    };

    const exited = new Promise<never>((_, reject) => {
        proc.on('error', err => reject(new Error(`Failed to start anvil: ${err.message}. Is foundry installed?`)));
        proc.on('exit', code => reject(new Error(`anvil exited with code ${code} on port ${port}: ${stderr.trim() || '(no output)'}`)));
    });

    try {
        await Promise.race([waitForAnvil(rpcUrl, START_TIMEOUT_MS), exited]);
    } catch (err) {
        stop();
        throw err;
    }
    exited.catch(() => {}); // anvil exiting later, e.g. on stop(), is not a startup failure

    // Clear any contract code at anvil test accounts.
    // On Sepolia, these well-known Hardhat addresses have EOF contracts deployed,
    // which causes safeTransferFrom to call onERC721Received and revert.
    await clearAccountCode(rpcUrl, ANVIL_ACCOUNTS.account0.address);
    await clearAccountCode(rpcUrl, ANVIL_ACCOUNTS.account1.address);

    return { process: proc, rpcUrl, stop };
}

async function clearAccountCode(rpcUrl: string, address: string): Promise<void> {
    await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'anvil_setCode', params: [address, '0x'], id: 1 }),
    });
}

async function waitForAnvil(rpcUrl: string, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
            });
            if (response.ok) return;
        } catch {
            // Not ready yet
        }
        await new Promise(r => setTimeout(r, 500));
    }
    throw new Error(`anvil did not answer on ${rpcUrl} within ${timeoutMs}ms`);
}
