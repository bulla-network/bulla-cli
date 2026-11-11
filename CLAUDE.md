# bulla-cli

A TypeScript CLI for the Bulla Protocol, built with Effect: `src/domain` (types, errors, validation), `src/application` (services and the ports they depend on), `src/infrastructure` (viem encoders, readers, signer, HTTP client, the layers that wire them) and `src/cli` (commands, options, formatters). Yarn 4, tsup, Vitest, Prettier.

## Specs and tests

Humans own specs, agents own tests and code, CI owns the verdict. A spec says what the product does; tests make each of its claims checkable; code makes the tests pass. The same loop runs in every Bulla repo.

To take an issue through it step by step, follow `docs/specs/agents/work-on-issue.md` (shared by every Bulla repo) with this repo's profile in `.claude/commands/work-on-issue.md`; in Claude Code that's `/work-on-issue <issue ID>`.

### Specs

- One markdown file per capability in `docs/specs/` (the shared `bulla-specs` repo, vendored as a submodule; run `git submodule update --init` after cloning). Each has a short code and numbered scenarios, e.g. `INVCREATE-03`, written as Given / When / Then, each with a `Verified by:` line naming the repos and layers that prove it. The ones this repo proves name `cli` (`Verified by: cli vitest`).
- Read the relevant spec before touching code. The issue names the scenarios it adds or changes.
- A behaviour change starts with a spec diff, approved by a human before any test or code is written. Never change a spec to fit the code.
- A bug fix adds the scenario that would have caught the bug. Also check the spec's rules: if the bug broke something that should always hold, add or tighten a rule in the same spec diff.
- Scenario IDs are never reused. A changed scenario keeps its ID.
- Write rules, and scenarios that hold for a range of inputs, as properties: "for any valid address …", "Given any amount above the balance …". They become property-based tests (below), so say which inputs vary and what stays true.
- **Spec PRs and the pin:** a spec change lands in bulla-specs first. The PR here that implements it can bump the submodule as usual, or, while the spec PR is still open, link it with this line in the PR description instead (optional):

    ```
    Spec: https://github.com/bulla-network/bulla-specs/pull/<n>
    ```

    With the line, CI checks traceability against that spec PR's head commit, so spec revisions need no pin bump here. When the spec PR merges, bulla-specs pushes `chore: pin bulla-specs to <sha> (bulla-specs#<n>)` to this PR's branch, so pull before you push again. The `spec pin` check passes only once `docs/specs` points at a commit on bulla-specs `main`; while the linked spec PR is open it fails as pending re-pin. To pin by hand, run `node docs/specs/scripts/spec-pin.mjs <bulla-specs PR url>`: it pins and stages the submodule. One `Spec:` line per PR.

### Separate sessions for tests and code

Tests and implementation are written in different sessions, so a test can't simply mirror the code it was written against.

1. **Test session:** works from the spec. It may read public interfaces (domain types and errors in `src/domain`, the ports in `src/application/ports`, service and validation function signatures, CLI command names and options, the helpers under `test/e2e/helpers`, `test/e2e/setup` and `test/support`) but not the logic it is testing. New tests must fail against the current code; a test that already passes asserts nothing new. CI's "red before green" job checks this for every new test whose title starts with a scenario ID; `node scripts/red-before-green.mjs --base origin/main` runs it locally. It runs the new tests in a temporary worktree where everything except `test/` (so `src/`, `scripts/`, `package.json` and the configs) is put back to the merge base. A test file that no longer loads there (it imports a module the branch adds) counts as red for all its new tests. A new test only has to fail once: the ones that pass are run again, each time in a fresh Vitest run where every property draws new random cases, up to 20 runs or 5 minutes, so a property whose new behaviour shows only on some inputs still counts as red. A property that fails on just a sliver of its inputs can still slip through; give that sliver its own example test as well. The exception is a PR that only adds tests for behaviour the CLI already has, such as covering an existing spec: give it the `tests-backfill` label (the job re-runs when a label changes).
2. **Implementation session:** makes the tests pass without editing their assertions. If a test looks wrong, stop and raise it: either the test or the spec is wrong, and a human decides which.

### Test conventions

- **Runner:** Vitest. `yarn test` runs the unit tests (`vitest.config.ts`: `test/**/*.test.ts` except `*.e2e.test.ts`). `yarn test:e2e` runs the e2e tests (`vitest.config.e2e.ts`: `test/**/*.e2e.test.ts`). They run the built CLI (`dist/index.js`), so `yarn build` first; the ones against a chain also need Foundry's `anvil` on `PATH` and `SEPOLIA_RPC_URL` set (CI uses `https://ethereum-sepolia-rpc.publicnode.com`), and skip without it.
- **Location:** in `test/`, outside `src/`, mirroring its layout: `src/domain/validation/eth.ts` → `test/domain/validation/eth.test.ts`. Shared property settings and generators live in `test/support/properties.ts`; e2e helpers in `test/e2e/helpers` and `test/e2e/setup`.
- **Naming:** a test for a scenario starts with its ID, followed by the outcome in plain words. The traceability check finds tests by that ID in the test files under `test/`, and red before green finds new ones by a title that starts with it.

    ```typescript
    it('INVCREATE-03 rejects a due date in the past', () => { ... });
    ```

    Tests that aren't tied to a scenario (helpers, harness, regression pins) carry no ID.

- **Layers:** use the lowest layer that proves the scenario.
    - **Unit (the default):** `test/domain` for validation and domain functions, `test/application` for services (provide fake ports with `Layer.succeed(<Port>Service, …)` and assert the transaction they build: `to`, `value` and the decoded calldata), `test/cli` for option parsing and command validation. No network, no chain.
    - **e2e:** `test/e2e/*.e2e.test.ts`, which run the built CLI against an Anvil fork of Sepolia (`startAnvil` in `test/e2e/setup/anvil.ts`) and check the contract state it produced; and other `*.e2e.test.ts` files that run the built CLI against an in-process fake server (e.g. `test/cli/factoring/backend-commands.e2e.test.ts`). Only for what a unit test can't prove: that a command really sends, signs or talks to the backend.
- **Property-based tests:** when a rule or scenario holds for a range of inputs, test it as a property with fast-check: generate the inputs, assert what must stay true. Prefer it over a single hand-picked example wherever the spec says "any". Run counts by layer come from `propertyRuns` in `test/support/properties.ts`: unit tests draw fast-check's default of 100 cases (`{ numRuns: propertyRuns.unit }`); e2e tests draw 1 case and don't shrink a failure (`{ numRuns: propertyRuns.e2e, endOnFailure: true }`), because each case runs the CLI against a fork, and every CI run then tries a different one (red before green reruns a passing one up to 20 times, see above). Shared generators live in the same file (`anyAddress()`); add new ones there with a property test of their own. A failing property prints its seed and path: replay it with `fc.assert(..., { seed, path })` and treat it as a real counterexample, not flakiness.
- **Errors:** assert the error's tag (`_tag`) or the exit code a scenario names, never the wording of a message, unless the test is about the message.
- **Money:** assert exact `bigint` values (`expect(amount).toBe(1_500_000n)`), never rounded or formatted strings, unless the test is about formatting.
- **Determinism:** fake timers for time-dependent code (`vi.useFakeTimers()`), no sleeps, no reliance on test order.

### Definition of done

Every PR meets all of these:

1. The spec for the capability exists or is updated, and the PR description names the scenario IDs added or changed (or links an open spec PR with a `Spec:` line). Either way, `docs/specs` is pinned to bulla-specs `main` before merging.
2. Tests exist at the right layer for every scenario touched, named with the scenario ID, and are property-based wherever the scenario holds for a range of inputs.
3. New tests were written from the spec without reading the implementation, and failed before the implementation landed (the "red before green" job checks the second half).
4. `yarn typecheck`, `yarn test`, `yarn build` and `yarn test:e2e` pass, the files you changed pass `npx prettier --check <files>`, and so do `spec traceability`, `spec pin` and `red before green`.
5. A self-review has run and its findings are addressed or explained in the PR.
6. For a bug fix, the first commit adds the scenario that would have caught it.
