---
description: Work a Linear issue through the spec-first loop (spec PR → merge → sub-issues → tests → code → checks)
argument-hint: <Linear issue ID, e.g. DEV-1234>
---

Work Linear issue $ARGUMENTS through the shared spec-first loop in `docs/specs/agents/work-on-issue.md` (the bulla-specs submodule; Claude Code doesn't load commands from inside a submodule, hence this stub). Read it first and follow it step by step, stopping at each checkpoint, with this repo's profile:

- **Component:** `cli` (the name in `Verified by:` lines and `Work:` blocks).
- **Base branch:** `main`. Branch with the issue's Linear branch name, cut from `origin/main`.
- **Specs:** `docs/specs`. Pin with `node docs/specs/scripts/spec-pin.mjs <bulla-specs PR url>`.
- **Checks:** `yarn typecheck`, `yarn test` (unit), `yarn build` then `yarn test:e2e` (e2e: runs the built CLI; the chain tests need Foundry's `anvil` on `PATH` and `SEPOLIA_RPC_URL`, e.g. `https://ethereum-sepolia-rpc.publicnode.com`, and skip without them), and `npx prettier --check <the files you changed>` (`yarn format:check` covers only `src/`, and already fails on `main` for files nobody has touched since). Red before green: `node scripts/red-before-green.mjs --base origin/main`. Spec traceability: `node docs/specs/scripts/check-traceability.mjs --component cli --tests test`.
- **Test conventions:** `CLAUDE.md` § Specs and tests (scenario-ID test names, unit layers `test/domain`, `test/application`, `test/cli`, e2e in `*.e2e.test.ts`, fast-check run counts in `test/support/properties.ts`).
- **Must follow:** the rest of `CLAUDE.md` (the Effect layering: domain → application services and ports → infrastructure → cli; errors as `Data.TaggedError`). Workflow files under `.github/` need a human to commit them.

If `docs/specs/agents/work-on-issue.md` doesn't exist at the pinned commit, pull the submodule to bulla-specs `main`.
