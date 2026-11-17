import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.e2e.test.ts'],
        testTimeout: 120_000,
        // beforeAll hooks start a forked anvil, which may retry (see test/e2e/setup/anvil.ts).
        hookTimeout: 150_000,
    },
});
