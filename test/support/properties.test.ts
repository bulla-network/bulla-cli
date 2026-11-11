import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { anyAddress, propertyRuns } from './properties.js';

describe('anyAddress', () => {
    it('draws 20-byte lowercase hex addresses', () => {
        fc.assert(
            fc.property(anyAddress(), address => {
                expect(address).toMatch(/^0x[0-9a-f]{40}$/);
            }),
            { numRuns: propertyRuns.unit },
        );
    });
});
