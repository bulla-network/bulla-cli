/**
 * sync-registry.ts
 *
 * Reads registry.json from bulla-registry and generates a typed TypeScript module
 * at src/generated/registry.ts. The generated file is committed to the repo.
 *
 * Also reads factoring-contracts/address_config.json for factoring pool addresses.
 *
 * Usage:
 *   yarn sync-registry
 *
 * Sources (tried in order):
 *   1. Local sibling: ../bulla-registry/registry.json (relative to repo root)
 *   2. Environment variable: BULLA_REGISTRY_PATH
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_CHAIN_IDS } from '../src/domain/types/eth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

interface RegistryNetwork {
    name: string;
    chainId: number;
    graphql: string;
    contracts: Record<string, Record<string, string>>;
}

interface Registry {
    generatedAt: string;
    networks: Record<string, RegistryNetwork>;
}

interface FactoringAddressConfig {
    repo: string;
    contracts: Record<string, Record<string, string>>;
}

function findRegistryPath(): string {
    if (process.env.BULLA_REGISTRY_PATH) {
        return process.env.BULLA_REGISTRY_PATH;
    }

    // Try common sibling locations
    const candidates = [
        resolve(projectRoot, '..', 'bulla-registry', 'registry.json'),
        resolve(projectRoot, '..', '..', 'bulla-registry', 'registry.json'),
    ];

    for (const candidate of candidates) {
        try {
            readFileSync(candidate, 'utf-8');
            return candidate;
        } catch {
            // continue
        }
    }

    throw new Error(
        `Could not find registry.json. Tried:\n${candidates.map(c => `  - ${c}`).join('\n')}\nSet BULLA_REGISTRY_PATH to override.`,
    );
}

function findFactoringConfigPath(registryPath: string): string | undefined {
    // Factoring config lives alongside registry.json in the bulla-registry repo
    const registryDir = dirname(registryPath);
    const candidates = [
        resolve(registryDir, 'factoring-contracts', 'address_config.json'),
        resolve(registryDir, '..', 'bulla-registry', 'factoring-contracts', 'address_config.json'),
    ];

    for (const candidate of candidates) {
        try {
            readFileSync(candidate, 'utf-8');
            return candidate;
        } catch {
            // continue
        }
    }
    return undefined;
}

/** Parse pool name from key like "bullaFactoringV2_1_TCS" → "TCS", "bullaFactoringV1_TARAM" → "TARAM" */
function parsePoolName(key: string): string {
    const parts = key.split('_');
    return parts[parts.length - 1]!;
}

function main() {
    const registryPath = findRegistryPath();
    console.log(`Reading registry from: ${registryPath}`);

    const raw = readFileSync(registryPath, 'utf-8');
    const registry: Registry = JSON.parse(raw);

    const contracts: string[] = [];
    const subgraphs: string[] = [];
    const chainNames: string[] = [];

    for (const chainIdStr of Object.keys(registry.networks)) {
        const chainId = Number(chainIdStr);
        if (!(SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId)) continue;

        const network = registry.networks[chainIdStr]!;

        // Extract bullaInstantPayment address from bulla-contracts group
        const bullaContracts = network.contracts['bulla-contracts'];
        const instantPaymentAddr = bullaContracts?.['bullaInstantPayment'];

        // Extract bullaInvoice and frendLendV2 addresses from bulla-contracts-v2 group
        const bullaContractsV2 = network.contracts['bulla-contracts-v2'];
        const invoiceAddr = bullaContractsV2?.['bullaInvoice'];
        const frendLendV2Addr = bullaContractsV2?.['frendLendV2'];

        if (!instantPaymentAddr) {
            console.warn(`  Warning: Missing bullaInstantPayment for chain ${chainId} (${network.name}), skipping`);
            continue;
        }

        const invoicePart = invoiceAddr ? `, bullaInvoice: '${invoiceAddr}' as EthAddress` : '';
        const frendLendV2Part = frendLendV2Addr ? `, frendLendV2: '${frendLendV2Addr}' as EthAddress` : '';
        contracts.push(`    ${chainId}: { bullaInstantPayment: '${instantPaymentAddr}' as EthAddress${invoicePart}${frendLendV2Part} },`);
        subgraphs.push(`    ${chainId}: '${network.graphql}',`);
        chainNames.push(`    ${chainId}: '${network.name}',`);
    }

    // Read factoring pool addresses
    const factoringConfigPath = findFactoringConfigPath(registryPath);
    const factoringPools: string[] = [];

    if (factoringConfigPath) {
        console.log(`Reading factoring config from: ${factoringConfigPath}`);
        const factoringRaw = readFileSync(factoringConfigPath, 'utf-8');
        const factoringConfig: FactoringAddressConfig = JSON.parse(factoringRaw);

        for (const [chainIdStr, pools] of Object.entries(factoringConfig.contracts)) {
            const chainId = Number(chainIdStr);
            if (!(SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId)) continue;

            const poolEntries: string[] = [];
            for (const [key, address] of Object.entries(pools)) {
                const name = parsePoolName(key);
                poolEntries.push(`{ name: '${name}', address: '${address}' as EthAddress }`);
            }

            if (poolEntries.length > 0) {
                factoringPools.push(`    ${chainId}: [${poolEntries.join(', ')}],`);
            }
        }
    } else {
        console.warn('  Warning: Factoring address_config.json not found, skipping factoring pools');
    }

    const factoringPoolsSection =
        factoringPools.length > 0
            ? `
export interface FactoringPool {
    readonly name: string;
    readonly address: EthAddress;
}

export const FACTORING_POOLS: Partial<Record<ChainId, readonly FactoringPool[]>> = {
${factoringPools.join('\n')}
};
`
            : `
export interface FactoringPool {
    readonly name: string;
    readonly address: EthAddress;
}

export const FACTORING_POOLS: Partial<Record<ChainId, readonly FactoringPool[]>> = {};
`;

    const output = `// AUTO-GENERATED by scripts/sync-registry.ts — do not edit manually.
// Source: ${registryPath}
// Generated at: ${new Date().toISOString()}

import type { EthAddress, ChainId } from '../domain/types/eth.js';

export interface ChainContracts {
    readonly bullaInstantPayment: EthAddress;
    readonly bullaInvoice?: EthAddress;
    readonly frendLendV2?: EthAddress;
}

export const REGISTRY: Record<ChainId, ChainContracts> = {
${contracts.join('\n')}
};

export const SUBGRAPH_ENDPOINTS: Record<ChainId, string> = {
${subgraphs.join('\n')}
};

export const CHAIN_DISPLAY_NAMES: Record<ChainId, string> = {
${chainNames.join('\n')}
};
${factoringPoolsSection}`;

    const outDir = resolve(projectRoot, 'src', 'generated');
    mkdirSync(outDir, { recursive: true });

    const outPath = resolve(outDir, 'registry.ts');
    writeFileSync(outPath, output, 'utf-8');
    console.log(`Generated: ${outPath}`);
}

main();
