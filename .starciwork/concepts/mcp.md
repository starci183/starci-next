# mcp

The StarCi Next MCP server is how a learner studies a lesson with their own Claude or ChatGPT: the AI reads what the learner may read,
sees the learner's own runs, and asks the learner's machine to re-run a scenario. It is a module of core, in the process of the relay,
and every lesson has it without a line of its own because every tool reads by `lessonId`.

## Terms
- **Access token**: a personal token (`scmcp_…`) the learner creates on `/connect`, shown once and kept only as a digest; the AI client
  sends it as `Authorization: Bearer`. It acts for exactly one learner. *Not to confuse with* a device token of the relay.
- **Source tree**: the files of `essentials/<topic>/<lesson>/source/` of the seed repository (TypeScript only) as the live lesson version holds them, at the
  content commit it was imported at, read through `LessonSourceTreeService` (the port `McpSourceTree`). `hidden/` sits beside `source/`
  in the seed and is not part of the tree: it travels only as signed challenge manifests.
- **Public catalog**: the scenarios, invariants and code walk locations of the tree, projected field by field from the lesson content: a hidden
  scenario, a challenge, a rubric, an expected output or a hint is never copied.

## Rules
1. Lesson text comes only from `LessonReadService` (`find` for a learner, `read` for the index), the projection and gating the app serves: a locked
   section has no body, and no answer key, hidden scenario, hidden test or rubric evidence is in it. The MCP has no second path to lesson data.
   The `lesson` tool returns the whole lesson the learner may read, in full and by part (`part`): every readable section with its headings, the
   opener, the invariants, the architecture and code walk, the scenarios (guards, command, expected result) and the challenge briefs and rubric
   criteria, exactly what the page shows. Two things the page releases late are released late here too: the key and the explanations of an opener
   question appear only once the learner submitted that question in the app (`AttemptOpenerService`, then `LessonReadService.openerAnswers`), and a
   scenario hint appears only after the learner's own red run of that scenario (`my_runs` events).
2. Access follows the one entitlement question the lesson read already answers (`isPremium`): Essentials Part 1 (opener and article) is free; Part 2 to 4 sections stay locked and have no text, and source, `read_file`, `search_code`, scenarios, invariants, `my_runs` and `request_run` need Premium. The harness (`search_harness`, its guides and docs) is free for every learner with a token and asks no entitlement. Projects are subscription-only and the MCP offers no project tool. A tool never keeps a second gate.
3. The AI never reads, lists, searches or embeds a hidden test, a mutant, a challenge submission, a rubric or its expected evidence, an
   answer key, a credential file, a path outside `repo/` (a `..` or a symlink included) or a prefix the teacher denied. One path rule
   (`readablePathOf`) guards every read, listing and search, and a spec plants a marker in each of them.
4. An invariant is shown only after its scenario was run by the learner (or when it names none); a hidden scenario is never listed,
   never run through the MCP and never shown in `my_runs`.
5. `my_runs` reads only the asking learner's own relay events of that lesson's public scenarios.
6. `request_run` sends a signed manifest of one allowlisted `starci-next run <lesson> --scenario <id> [--guard <id>=off]` to the
   learner's online device; the CLI shows the command and asks the learner before it runs, and the result comes back through the relay.
   The AI may edit the learner's own code with the learner's agreement; it never edits a scenario or switches a guard off to turn green.
7. Semantic search (`search_lesson`, `search_code`) embeds only text the asking learner may read now: the documents of the readable parts (the overview,
   each section cut by heading, the opener questions without a key, the invariants, the architecture, the code walk, the scenarios, the challenge briefs),
   and every readable file of the repository (cut by file and symbol: a script by top-level declaration, a long class by member, markdown by heading,
   other files in windows; a lock file stays readable and unsearched). Each chunk carries its path, its heading trail or symbol and its 1-based line range,
   so a hit says where to read on (`lesson_section`, `read_file`). Embeddings come from the local model through a port (`@starci/ai-router` 0.10.0 `kind:"local"`, `qwen3-embedding:8b` cut to 1024 dimensions by MRL truncation and normalised, declared in code over `MCP_EMBED_URL`: the shared host service `https://embed.starci.org/v1` in dev and in any deployed environment, with its token as the sealed `AI_API_KEY`; the gateway checks the token and caps the body at 1 MB). Vectors are kept the way NIVO keeps its brain: a Postgres row per indexed chunk (`mcp_vector_points`: content hash of model and text, source, access class, sync time) and one Qdrant point under the row id that carries only keywords (kind, source, locale, access, hash), never text. A chunk is embedded once per hash, a changed text or model is a new hash, and a write is rows, then points, then the sync time, so a lost write is written again by the next job. A search runs in Qdrant under a mandatory payload filter (kind, source, locale, the access classes the reader may see, and for a lesson or a repository the hashes of what the reader may read now), and the hashes are read back from Postgres. `list_files` lists every readable file with its size; `read_file` serves any of them up to 1000 lines per call and says `nextFrom` when it goes on.
   `cli mcp reindex` also indexes every live lesson in both locales (a chunk the free reader's view holds is written `free`, the rest `premium`) and its source.
   With no embedder, no Qdrant (`QDRANT_URL`, `QDRANT_VECTOR_SIZE=1024`) or one that is down, search answers by keywords and says so.
7a. `search_harness` reads only the `vi.md` and `en.md` of `guides/<tool>/<slug>/` and `docs/<slug>/` of the harness content (`MCP_HARNESS_DIR`); build kits, hidden parts, e2e, doctor probes and trial traps are never listed, searched or embedded. `cli mcp reindex` is the batch job: it embeds only chunks whose hash is new and deletes the points and rows no document holds. Qdrant runs in the dev stack on a loopback port of the 3200 range and never on the tunnel; production uses an owner-provisioned Qdrant.
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
`be/src/modules/domain/mcp/`, `be/src/features/api/mcp/`, `be/src/features/cli/mcp/`, `be/src/modules/domain/lesson/` (`lesson-source-tree.*`), `be/src/modules/domain/relay/` (the scenario manifest and the learner's run
events), `fe/apps/app/src/components/blocks/ConnectAi/`

Related: [essentials](essentials.md), [learner-cli-relay](learner-cli-relay.md), [premium](premium.md), [identity](identity.md)
