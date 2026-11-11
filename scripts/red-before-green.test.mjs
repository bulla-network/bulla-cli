import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    byConfig,
    configFor,
    isTestFile,
    mergeReports,
    namePattern,
    newScenarioTests,
    scenarioTests,
    stillPassing,
    titleMatcher,
    violations,
} from './red-before-green.mjs';

const source = `
import { describe, expect, it, test } from 'vitest';

describe('bulla invoice create', () => {
    it('INVCREATE-03 rejects a due date in the past', () => {});
    test.only("INVCREATE-04 builds the createClaim call", () => {});
    it(\`APP-01 works on any chain\`, () => {});
    it('rejects an address without 0x prefix', () => {});
    it('APP-02 it\\'s escaped', () => {});
    it.each([
        { name: 'Base' },
        { name: 'Celo' },
    ])('APP-03 pays on $name', ({ name }) => {});
});
`;

describe('scenarioTests', () => {
    it('finds tests whose title starts with a scenario ID, and nothing else', () => {
        assert.deepEqual(scenarioTests(source), [
            'INVCREATE-03 rejects a due date in the past',
            'INVCREATE-04 builds the createClaim call',
            'APP-01 works on any chain',
            "APP-02 it\\'s escaped",
            'APP-03 pays on $name',
        ]);
    });

    it("ignores a describe titled with an ID, and an ID that isn't at the start", () => {
        assert.deepEqual(scenarioTests(`describe('APP-04 group', () => { it('covers APP-05', () => {}); });`), []);
    });
});

describe('newScenarioTests', () => {
    it('lists every scenario test of a new file', () => {
        assert.equal(newScenarioTests(undefined, source).length, 5);
    });

    it('lists only the titles the base file lacks', () => {
        const base = "it('INVCREATE-03 rejects a due date in the past', () => {});\nit('APP-01 works on any chain', () => {});";
        assert.deepEqual(newScenarioTests(base, source), [
            'INVCREATE-04 builds the createClaim call',
            "APP-02 it\\'s escaped",
            'APP-03 pays on $name',
        ]);
    });
});

describe('titleMatcher', () => {
    it('matches the title exactly, with regex characters escaped', () => {
        const matches = titleMatcher('APP-06 refuses 1.5 (a fraction)');
        assert.ok(matches.test('APP-06 refuses 1.5 (a fraction)'));
        assert.ok(!matches.test('APP-06 refuses 105 (a fraction)'));
        assert.ok(!matches.test('APP-06 refuses 1.5 (a fraction) twice'));
    });

    it('matches the cases it.each fills in', () => {
        assert.ok(titleMatcher('APP-03 pays on $name').test('APP-03 pays on Base'));
        assert.ok(titleMatcher('APP-07 accepts %s').test('APP-07 accepts 0xabc'));
    });
});

describe('isTestFile and configFor', () => {
    it('takes .test.ts files only', () => {
        assert.ok(isTestFile('test/domain/validation/eth.test.ts'));
        assert.ok(isTestFile('test/e2e/invoice.e2e.test.ts'));
        assert.ok(!isTestFile('test/e2e/helpers/cli-runner.ts'));
        assert.ok(!isTestFile('test/support/properties.ts'));
    });

    it('runs *.e2e.test.ts with the e2e config, wherever it lives, and the rest with the unit config', () => {
        assert.equal(configFor('test/e2e/invoice.e2e.test.ts'), 'vitest.config.e2e.ts');
        assert.equal(configFor('test/cli/factoring/backend-commands.e2e.test.ts'), 'vitest.config.e2e.ts');
        assert.equal(configFor('test/domain/validation/eth.test.ts'), 'vitest.config.ts');
    });
});

describe('byConfig', () => {
    it('groups the new tests by the config their files run with', () => {
        const unit = { file: 'test/domain/a.test.ts', titles: ['APP-01 a'] };
        const e2e = { file: 'test/e2e/b.e2e.test.ts', titles: ['APP-02 b'] };
        const unit2 = { file: 'test/cli/c.test.ts', titles: ['APP-03 c'] };
        assert.deepEqual(byConfig([unit, e2e, unit2]), [
            ['vitest.config.ts', [unit, unit2]],
            ['vitest.config.e2e.ts', [e2e]],
        ]);
    });
});

describe('violations and stillPassing', () => {
    const file = 'test/domain/a.test.ts';
    const newTests = [{ file, titles: ['APP-20 red', 'APP-21 green', 'APP-22 skipped', 'APP-23 missing', 'APP-24 on $name'] }];
    const report = mergeReports([
        {
            testResults: [
                {
                    name: `/tmp/repo/${file}`,
                    status: 'failed',
                    assertionResults: [
                        { title: 'APP-20 red', status: 'failed' },
                        { title: 'APP-21 green', status: 'passed' },
                        { title: 'APP-22 skipped', status: 'skipped' },
                        { title: 'APP-24 on Base', status: 'failed' },
                        { title: 'APP-24 on Celo', status: 'passed' },
                    ],
                },
            ],
        },
        { testResults: [{ name: '/tmp/repo/test/e2e/b.e2e.test.ts', status: 'failed', assertionResults: [] }] },
    ]);

    it('reports each new test that passed, was skipped or did not run; an it.each must fail on every case', () => {
        assert.deepEqual(violations(newTests, report), [
            { title: 'APP-21 green', file, problem: 'already passes' },
            { title: 'APP-22 skipped', file, problem: 'was skipped' },
            { title: 'APP-23 missing', file, problem: "didn't run (no result with this title)" },
            { title: 'APP-24 on Celo', file, problem: 'already passes' },
        ]);
    });

    it("counts every new test of a file that didn't load as red", () => {
        assert.deepEqual(violations([{ file: 'test/e2e/b.e2e.test.ts', titles: ['APP-25 x'] }], report), []);
        assert.deepEqual(violations([{ file: 'test/e2e/absent.e2e.test.ts', titles: ['APP-26 x'] }], report), []);
    });

    it('keeps only the tests that passed for another run', () => {
        assert.deepEqual(stillPassing(newTests, report), [{ file, titles: ['APP-21 green', 'APP-24 on $name'] }]);
    });
});

describe('namePattern', () => {
    it('matches the full names Vitest filters on, for just these tests', () => {
        const pattern = new RegExp(namePattern([{ file: 'f', titles: ['APP-21 green', 'APP-24 on $name'] }]));
        assert.ok(pattern.test('bulla invoice APP-21 green'));
        assert.ok(pattern.test('APP-24 on Celo'));
        assert.ok(!pattern.test('bulla invoice APP-20 red'));
        assert.ok(!pattern.test('bulla invoice XAPP-21 green'));
    });
});
