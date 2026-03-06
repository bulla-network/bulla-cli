import type { OutputFormat } from './index.js';

/** Generic formatter for view command results. Serializes bigints as strings. */
const bigintReplacer = (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value);

export const formatViewResult = (data: Record<string, unknown>, format: OutputFormat): string => {
    if (format === 'json') {
        return JSON.stringify(data, bigintReplacer, 2);
    }

    const lines: string[] = [];
    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
            lines.push(`  ${key}: [${value.map(v => (typeof v === 'bigint' ? v.toString() : String(v))).join(', ')}]`);
        } else if (typeof value === 'bigint') {
            lines.push(`  ${key}: ${value.toString()}`);
        } else {
            lines.push(`  ${key}: ${String(value)}`);
        }
    }
    return lines.join('\n');
};
