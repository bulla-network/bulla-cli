import fc from 'fast-check';

/**
 * fast-check run counts by layer (CLAUDE.md, "Test conventions"). Pass one as `numRuns`:
 * `fc.assert(fc.property(...), { numRuns: propertyRuns.unit })`.
 *
 * - `unit`: fast-check's default of 100 cases; unit tests are pure and fast.
 * - `e2e`: 1 case, no shrinking (pass `endOnFailure: true`), because each case runs the CLI against an
 *   Anvil fork. Every run draws a different case, and red before green reruns a passing one up to 20 times.
 */
export const propertyRuns = { unit: 100, e2e: 1 } as const;

/** Any EVM address, lowercase, as the CLI's validation returns it. */
export const anyAddress = (): fc.Arbitrary<`0x${string}`> =>
    fc.uint8Array({ minLength: 20, maxLength: 20 }).map(bytes => `0x${Buffer.from(bytes).toString('hex')}` as `0x${string}`);
