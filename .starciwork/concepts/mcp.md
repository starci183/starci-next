# mcp

The StarCi Next MCP server is how a learner studies a lesson with their own Claude or ChatGPT: the AI reads what the learner may read,
sees the learner's own runs, and asks the learner's machine to re-run a scenario. It is a module of core, in the process of the relay,
and every lesson has it without a line of its own because every tool reads by `lessonId`.

## Terms
- **Access token**: a personal token (`scmcp_…`) the learner creates on `/connect`, shown once and kept only as a digest; the AI client
  sends it as `Authorization: Bearer`. It acts for exactly one learner. *Not to confuse with* a device token of the relay.
- **Lesson checkout**: `<MCP_SOURCE_ROOT>/<lessonId>/` with `repo/` (the teacher's source, TypeScript only, at the pinned commit) and
  `starci-source.json` beside it (commit, scenarios, invariants, extra denied prefixes), never inside `repo/`.
- **Public catalog**: the part of `starci-source.json` the AI may read, projected field by field: a hidden scenario is dropped when the
  file is read, and an unnamed field (expected output, answer, mutant) is never copied.

## Rules
1. Lesson text comes only from `LessonReadService.find`, the projection and gating the app serves: a locked section has no body, and no
   answer key, expected evidence or option correctness is in it. The MCP has no second path to lesson data.
2. Source, scenarios, invariants, runs and run requests need Premium, like the lesson workspace.
3. The AI never reads, lists, searches or embeds a hidden test, a mutant, a challenge submission, a rubric or its expected evidence, an
   answer key, a credential file, a path outside `repo/` (a `..` or a symlink included) or a prefix the teacher denied. One path rule
   (`readablePathOf`) guards every read, listing and search, and a spec plants a marker in each of them.
4. An invariant is shown only after its scenario was run by the learner (or when it names none); a hidden scenario is never listed,
   never run through the MCP and never shown in `my_runs`.
5. `my_runs` reads only the asking learner's own relay events of that lesson's public scenarios.
6. `request_run` sends a signed manifest of one allowlisted `starci-next run <lesson> --scenario <id> [--guard <id>=off]` to the
   learner's online device; the CLI shows the command and asks the learner before it runs, and the result comes back through the relay.
   The AI may edit the learner's own code with the learner's agreement; it never edits a scenario or switches a guard off to turn green.
7. Semantic search (`search_lesson`, `search_code`) embeds only text the asking learner may read now: unlocked sections, and the
   readable files of the repository. Embeddings come from the local model through a port (Ollama `qwen3-embedding:8b`, cut to 1024
   dimensions and normalised); with no embedder declared, or one that is down, search answers by keywords and says so.
8. Proof is unchanged: using an AI is allowed, and Proved still comes only from CI with GitHub OIDC or a server rerun.

## Example
A learner's scenario `double-spend` is red. Their AI calls the `fix_scenario` prompt: `my_runs` for the log, `invariants` for the broken
law, `read_file` for the code, a proposed diff on the learner's local code, then `request_run` to check; the learner confirms the command
on their machine and `my_runs` shows green.

## Don't / Instead
- Don't add a lesson-specific tool; read by `lessonId` from the lesson's data and its checkout.
- Don't return a field of a catalog or a lesson that no projection names; add it to the projection and a spec.
- Don't read a lesson or a scenario outside the services; the MCP never reaches the lesson table or a repository directly.

## Where
`be/src/modules/domain/mcp/`, `be/src/features/api/mcp/`, `be/src/modules/domain/relay/` (the scenario manifest and the learner's run
events), `fe/apps/app/src/components/blocks/ConnectAi/`

Related: [essentials](essentials.md), [learner-cli-relay](learner-cli-relay.md), [premium](premium.md), [identity](identity.md)
