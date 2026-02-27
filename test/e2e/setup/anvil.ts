import { type ChildProcess, spawn } from 'node:child_process';

export interface AnvilInstance {
    process: ChildProcess;
    rpcUrl: string;
    stop: () => void;
}

/** Each test file gets a unique port to avoid conflicts when running in parallel. */
function randomPort(): number {
    return 10000 + Math.floor(Math.random() * 50000);
}

export async function startAnvil(forkUrl: string): Promise<AnvilInstance> {
    const port = randomPort();
    const rpcUrl = `http://127.0.0.1:${port}`;
    const args = ['--fork-url', forkUrl, '--port', String(port), '--silent'];

    const proc = spawn('anvil', args, {
        stdio: 'pipe',
        shell: process.platform === 'win32',
    });

    proc.on('error', err => {
        throw new Error(`Failed to start anvil: ${err.message}. Is foundry installed?`);
    });

    await waitForAnvil(rpcUrl, 30_000);

    return {
        process: proc,
        rpcUrl,
        stop: () => {
            if (process.platform === 'win32') {
                if (proc.pid) spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { shell: true });
            } else {
                proc.kill('SIGTERM');
            }
        },
    };
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
    throw new Error(`Anvil failed to start within ${timeoutMs}ms`);
}
