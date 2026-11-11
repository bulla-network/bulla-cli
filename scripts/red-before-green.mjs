#!/usr/bin/env node
/**
 * Red before green: every scenario test a branch adds must fail against the code it branched from.
 * A new test that already passes there asserts nothing new (CLAUDE.md, "Separate sessions for tests
 * and code").
 *
 *   node scripts/red-before-green.mjs --base origin/main
 *   node scripts/red-before-green.mjs --base origin/main --plan   # only list the new scenario tests
 *
 * A scenario test is an `it(...)`/`test(...)` whose title starts with a scenario ID (`INVCREATE-03 ...`).
 * Tests without an ID (helpers, harness, refactor pins) are exempt. For each test file the branch
 * adds or changes under test/, the titles not present at the merge base are "new". The script then
 * checks out the branch in a temporary git worktree, puts everything except test/ back to the merge
 * base (src/, scripts/, package.json and the configs alike, removing files the branch added), runs
 * those test files, and fails if any new test passes, is skipped, or doesn't run. A file that fails
 * to load counts as failing: its new tests are red.
 *
 * Unit test files run with vitest.config.ts, `*.e2e.test.ts` files with vitest.config.e2e.ts. The
 * e2e tests run the built CLI (dist/index.js), so the old code is built with tsup first; most of
 * them also need Foundry's `anvil` and SEPOLIA_RPC_URL, and are skipped (so reported) without it.
 *
 * A new test only has to fail once. A property draws new random cases on every run, and one whose new
 * behaviour shows on only some inputs can draw only cases the old code already handled. So the tests
 * that pass are run again, each time in a fresh Vitest run with new random cases, until each has
 * failed or the runs or time run out. Your own checkout is never touched.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A quoted title that starts with a scenario ID (`INVCREATE-03 ...`).
const TITLE = '([\'"`])([A-Z][A-Z0-9]*-\\d+\\b(?:(?!\\1)[^\\\\]|\\\\.)*)\\1';
// `it('INVCREATE-03 ...'` / `test.only("INVCREATE-03 ..."`, and `it.each(table)('INVCREATE-03 ... $name'`, whose table
// may span lines but not another test or describe.
const SCENARIO_TEST = new RegExp(
    String.raw`\b(?:it|test)(?:\.only)?(?:\.each\b(?:(?!\b(?:it|test|describe)\s*[.(])[\s\S])*?\)\s*)?\(\s*` + TITLE,
    'g',
);

/** The folder the tests live in, and which files in it are test files. */
export const TESTS = 'test';
export const isTestFile = file => /\.test\.ts$/.test(file);

/** The Vitest config a test file runs with: `*.e2e.test.ts` are e2e tests, the rest unit tests. */
export const configFor = file => (/\.e2e\.test\.ts$/.test(file) ? 'vitest.config.e2e.ts' : 'vitest.config.ts');

/** The titles of the scenario tests in a test file's source, as written (`it.each` placeholders included). */
export const scenarioTests = source => [...source.matchAll(SCENARIO_TEST)].map(match => match[2]);

/** Scenario test titles in `head` that aren't in `base` (undefined when the file is new). */
export const newScenarioTests = (base, head) => {
    const existing = new Set(scenarioTests(base ?? ''));
    return scenarioTests(head).filter(title => !existing.has(title));
};

/** Matches the titles Vitest reports for a title as written: `it.each` fills in `$name` and `%s`-style placeholders. */
export const titleMatcher = title => {
    const pattern = title
        .split(/(\$[\w.]+|%[sdifjoO#])/)
        .map((part, index) => (index % 2 === 1 ? '.+?' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        .join('');
    return new RegExp(`^${pattern}$`);
};

/**
 * Which new tests broke the rule, given Vitest's JSON report for the run against the merge base.
 * Returns `{ title, file, problem }` for each new test that passed, was skipped, or didn't run.
 * An `it.each` title covers all its cases: every one must fail.
 */
export const violations = (newTests, report) =>
    newTests.flatMap(({ file, titles }) => {
        const result = report.testResults.find(entry => entry.name.endsWith(`/${file}`));
        const loaded = result && !(result.status === 'failed' && result.assertionResults.length === 0);
        if (!loaded) return []; // the file couldn't even load against the old code: its new tests are red
        return titles.flatMap(title => {
            const matches = titleMatcher(title);
            const outcomes = result.assertionResults.filter(assertion => matches.test(assertion.title));
            if (outcomes.length === 0) return [{ title, file, problem: "didn't run (no result with this title)" }];
            const notFailed = outcomes.find(outcome => outcome.status !== 'failed');
            if (!notFailed) return [];
            return [
                { title: notFailed.title, file, problem: notFailed.status === 'passed' ? 'already passes' : `was ${notFailed.status}` },
            ];
        });
    });

/** The new tests that passed against the merge base: worth another run with new random cases. */
export const stillPassing = (newTests, report) =>
    newTests
        .map(({ file, titles }) => ({
            file,
            titles: titles.filter(title =>
                violations([{ file, titles: [title] }], report).some(({ problem }) => problem === 'already passes'),
            ),
        }))
        .filter(({ titles }) => titles.length > 0);

/** A Vitest `-t` pattern for just these tests. Vitest matches it against "<file> <describe…> <title>". */
export const namePattern = newTests =>
    `(?:^| )(?:${newTests.flatMap(({ titles }) => titles.map(title => titleMatcher(title).source.slice(1, -1))).join('|')})$`;

/** The new tests grouped by the Vitest config their files run with: `[[config, newTests]]`. */
export const byConfig = newTests => {
    const groups = new Map();
    newTests.forEach(entry => groups.set(configFor(entry.file), [...(groups.get(configFor(entry.file)) ?? []), entry]));
    return [...groups];
};

/** One report from several Vitest runs' JSON reports (one per config). */
export const mergeReports = reports => ({ testResults: reports.flatMap(report => report.testResults) });

/**
 * At most this many runs, and no new run after this long. A property that passes for a share `p` of
 * its inputs against the old code is still caught unless every run draws a passing case: `p ** runs`.
 */
const MAX_RUNS = 20;
const RETRY_BUDGET_MS = 5 * 60_000;

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const lines = text => text.split('\n').filter(Boolean);

const main = () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const baseIndex = process.argv.indexOf('--base');
    if (baseIndex === -1 || !process.argv[baseIndex + 1]) {
        console.error('usage: node scripts/red-before-green.mjs --base <ref> [--plan]');
        process.exit(2);
    }
    const mergeBase = git(['merge-base', process.argv[baseIndex + 1], 'HEAD'], root);

    const changed = lines(git(['diff', '--name-only', '--diff-filter=AM', `${mergeBase}...HEAD`, '--', TESTS], root)).filter(isTestFile);
    const newTests = changed
        .map(file => {
            let base;
            try {
                base = git(['show', `${mergeBase}:${file}`], root);
            } catch {
                base = undefined; // the branch added this file
            }
            return { file, titles: newScenarioTests(base, readFileSync(join(root, file), 'utf8')) };
        })
        .filter(({ titles }) => titles.length > 0);

    newTests.forEach(({ file, titles }) => titles.forEach(title => console.log(`new: ${file} › ${title}`)));
    if (newTests.length === 0) console.log('red-before-green: no new scenario tests on this branch.');

    // A PR that only adds tests for behaviour the CLI already has (e.g. covering an existing spec)
    // carries the `tests-backfill` label: those tests are expected to pass from the start.
    const backfill = process.env.RED_BEFORE_GREEN_BACKFILL === 'true' && newTests.length > 0;
    if (backfill) console.log('red-before-green: skipped. The PR has the tests-backfill label, so these tests cover existing behaviour.');

    // `--plan` only lists them (no install needed), so CI can skip installing when there's nothing to check.
    if (process.argv.includes('--plan')) {
        const hasNewTests = newTests.length > 0 && !backfill;
        const hasE2e = hasNewTests && newTests.some(({ file }) => configFor(file) === 'vitest.config.e2e.ts');
        if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `has-new-tests=${hasNewTests}\nhas-e2e=${hasE2e}\n`);
        return;
    }
    if (newTests.length === 0 || backfill) return;

    const scratch = mkdtempSync(join(tmpdir(), 'red-before-green-'));
    const worktree = join(scratch, 'repo');
    git(['worktree', 'add', '--detach', worktree, 'HEAD'], root);
    try {
        // Everything but the tests goes back to the merge base: src/, but also scripts/, package.json
        // and the configs, which are code here too. Files the branch added outside test/ are removed.
        git(['checkout', mergeBase, '--', '.', `:(exclude)${TESTS}`], worktree);
        lines(git(['diff', '--name-only', '--diff-filter=A', `${mergeBase}...HEAD`, '--', '.', `:(exclude)${TESTS}`], root)).forEach(file =>
            rmSync(join(worktree, file), { recursive: true, force: true }),
        );
        // The branch's dependencies, so new tests can use a test library the branch adds.
        symlinkSync(join(root, 'node_modules'), join(worktree, 'node_modules'), 'dir');

        // The e2e tests run the built CLI, so build the old code once. A build that fails leaves no
        // dist/, and the e2e tests then fail against it (red), which is the right verdict.
        if (newTests.some(({ file }) => configFor(file) === 'vitest.config.e2e.ts')) {
            const build = spawnSync(join(worktree, 'node_modules/.bin/tsup'), [], {
                cwd: worktree,
                stdio: ['ignore', 'ignore', 'inherit'],
            });
            if (build.status !== 0) console.log('red-before-green: the merge base did not build; its e2e tests fail against it.');
        }

        const startedAt = Date.now();
        /** Runs `pending` against the merge base, again while some still pass; returns what's left broken. */
        const check = (pending, run) => {
            const reports = byConfig(pending).map(([config, group], index) => {
                const report = join(scratch, `report-${index}.json`);
                // Reruns only the tests that passed, not the rest of their files.
                const only = run === 1 ? [] : ['-t', namePattern(group)];
                rmSync(report, { force: true });
                spawnSync(
                    join(worktree, 'node_modules/.bin/vitest'),
                    ['run', '--config', config, ...only, '--reporter=json', `--outputFile=${report}`, ...group.map(({ file }) => file)],
                    { cwd: worktree, stdio: ['ignore', 'ignore', 'inherit'] },
                );
                if (!existsSync(report)) throw new Error(`Vitest (${config}) wrote no report; see its output above.`);
                return JSON.parse(readFileSync(report, 'utf8'));
            });

            const result = mergeReports(reports);
            const passing = stillPassing(pending, result);
            const others = violations(pending, result).filter(({ problem }) => problem !== 'already passes');
            const count = passing.reduce((sum, { titles }) => sum + titles.length, 0);
            if (count === 0) return others;
            if (run >= MAX_RUNS || Date.now() - startedAt >= RETRY_BUDGET_MS) {
                console.error(`red-before-green: ${count} new test(s) still passed after ${run} run(s) against the merge base.`);
                return [...others, ...violations(passing, result)];
            }
            console.log(
                `red-before-green: run ${run}: ${count} new test(s) passed against the merge base; running them again with new random cases.`,
            );
            return [...others, ...check(passing, run + 1)];
        };

        const broken = check(newTests, 1);
        if (broken.length > 0) {
            console.error('\nred-before-green: these new scenario tests must fail against the code this branch started from:');
            broken.forEach(({ file, title, problem }) => console.error(`  ${file} › ${title}: ${problem}`));
            if (broken.some(({ file, problem }) => configFor(file) === 'vitest.config.e2e.ts' && problem === 'was skipped')) {
                console.error("  (e2e tests skip without SEPOLIA_RPC_URL; they also need Foundry's anvil on PATH.)");
            }
            process.exitCode = 1;
        } else {
            console.log('\nred-before-green: every new scenario test fails against the merge base.');
        }
    } finally {
        git(['worktree', 'remove', '--force', worktree], root);
        rmSync(scratch, { recursive: true, force: true });
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
