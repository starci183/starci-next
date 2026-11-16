# projects

Dự án: the learner brings their own projects, on any topic, language and structure, and puts the `starci/` folder into each. A
milestone is a list of Bản chất concepts; it passes when each concept has evidence. There is no sample project (owner).

## Terms
- **Project**: the learner's own repository, kind `app` or `agent` (an agent project is the proof of the agent lab).
- **Milestone**: a list of Bản chất concepts from the content repo's project catalog.
- **Evidence slot**: a tagged test, an e2e flow, a StarCi probe of the deployed address, or the AI code read.
- **Đang luyện** (practising) versus **Đã chứng minh** (proved); see [learner-cli-relay](learner-cli-relay.md).
- **Check set**: the catalog (concepts, milestones, the milestones of each project kind) and every probe, data in the content repo's
  `raw/projects/` (`catalog.yaml`, `probes/<id>.yaml`, `kit/starci/e2e/<concept>.md`), read by `ProjectCheckSetService`.
- **check-flow**: the one declarative language of probes and e2e flows (HTTP steps with templates, fan-out, waits, a sink, captures,
  assertions on status, headers, JSON paths, counts and timing) and its one interpreter, `be/src/modules/platform/check-flow`, which the
  server runner and the CLI both run. Reference: the content repo's `docs/check-flow.md`.
- **Cheat fixture**: a fake learner app, driven by flags, whose behaviour is wrong although its own tests could be green; every probe
  and e2e flow names the reason it must fail with on each cheat.

## Rules
1. There is no StarCi Shop sample, no sample steps, hints or solution, and no template a project starts from.
2. Projects are subscription-only. `PROJECT_FREE_PROJECTS` and `PROJECT_FREE_MILESTONES` are settings that default to 0 and none; they
   only tell the screen what a free learner may see. The back end refuses every project create, concept pointer change, relay upload or
   manifest, probe run, CI delivery and AI read from a learner without Premium with `PROJECT_PREMIUM_REQUIRED` (`RELAY_PROJECT_PREMIUM_REQUIRED`
   at the relay), read through the one entitlement question; no screen state is relied on. A project made before this rule keeps its
   read-only history (list, milestone, concept, runs) and accepts no new run until the learner subscribes. Why: a free account must never
   cost a probe call, an AI call or a CV line.
3. What a concept needs is data in the catalog (`requires`: every group is needed, one slot of a group is enough, and a red slot of a
   group is never hidden by a green sibling). A behaviour concept with an HTTP surface needs a test or an e2e flow, and a server probe;
   a behaviour concept with no HTTP surface needs an e2e flow and the AI code read; a structure concept needs a test and the AI code read.
   A slot is proved only by its own source: a test or e2e flow by a CI run GitHub attests, a probe by the server runner, a code read by
   the AI teacher; the same results from the learner machine or unattested CI are `Đang luyện`. Green tests with a red probe are never proved.
4. The current check set (owner 2026-11-17) is ten app concepts: request-response-lifecycle, health-probe-semantics, idempotent-retry,
   transactional-outbox, cache-freshness, rate-limiting, cursor-pagination, authz-no-idor, error-contract and unit-testing-behavior;
   the agent track (tools-permissions, operate and its structure concepts) stays for agent projects. It will grow to 50 to 100.
5. Adding a concept or a probe is data only: a catalog entry, a probe file, an e2e flow and their fixtures, never app code. App code
   exists only for primitives (an HTTP step, fan-out, a wait, the sink, an assertion operator, a fake-app flag). The content validator
   enforces rule 3 for every concept mechanically and checks every probe, e2e flow, fixture and learn link; the app runs every
   fixture, so a new probe proves on a good app and stays unproved on each cheat before it ships.
6. A probe is black-box, safe and read-mostly: every request stays on the learner's address and carries `X-StarCi-Probe: <run id>`;
   a write goes only to the endpoint path the learner declared for the concept (or below it); a flow holds at most 40 requests, 12
   writes, a fan-out of 20 and 15 s of waits; the server sends through the guarded client (public addresses only, DNS resolved and
   pinned at connection, no redirect, deadline and byte cap) a few runs an hour per project. A skipped or unanswered probe proves
   nothing either way. The outbox concept's events go to `POST /probe-sink/<id>`, an in-memory door open only while its run waits.
7. CI posts only test and e2e results (`npx @starci/next ci-report`, JUnit plus the e2e flows run against the service the workflow
   started), signed with the project's CI secret and carrying the run's GitHub OIDC token, which `GithubOidcClient` verifies (RS256
   against GitHub's keys, issuer, audience, lifetime, repository and its id, commit, run and attempt). A probe result from CI is refused.
8. The StarCi harness is never forced on a learner's project: no spec records, no architecture lint, no mutation score.
9. Practice comes through the relay and is never proof. Proof is a CI run GitHub attests, the server probe runner (public http or
   https only), or the AI read of the excerpt the learner pastes; the server never clones the repository.
10. A newly proved concept reaches the Bản chất experience line; a proved milestone and a probed deployment reach the career producer;
   each run is one project-run streak action. A proof is claimed once and is not taken back when a later probe turns red.
11. The AI code read grades the pasted excerpt and a two-to-three sentence explanation against the rubric of the concept's lesson with the
   one teacher model; the criterion levels with their quoted evidence and the question are stored with the result, the excerpt is not.
12. The project screen reads two extras, both Premium-only (`PROJECT_PREMIUM_REQUIRED` otherwise): `projectCodeRead` (every rubric criterion with
   its verdict, the SHA-256 of the excerpt, when it was graded; never the expected evidence) and `projectCvPreview` (the line a proved
   concept or milestone would give, drafted from StarCi evidence only, with the CI run, probe run or code read under it; it produces
   nothing). The project list carries `practisingConceptCount` and the newest CI run's status and time, as history readable without Premium.

## Example
A learner makes "my-blog-api" and "shop-bot", copies `starci/` into both, runs `starci-next run` and sees "3/8 concept đã chứng minh"
on each after their GitHub Action runs; neither started from a template.

## Don't / Instead
- Don't seed or offer a sample project; show the empty list with "Tạo dự án".
- Don't count a relayed run as proof; wait for the attested CI run, the probe or the AI read.
- Don't add a planner, a judge or a label in app code for a new check; write the probe file, the e2e flow and their fixtures.
- Don't let a probe write anywhere but the declared endpoint path, or reach anything but the learner's public address.

## Where
`be/src/modules/domain/project/`, `be/src/modules/platform/check-flow/`, `be/src/features/webhooks/probe-sink/`,
`be/src/modules/integrations/relay-client/` (`project-e2e.cli.ts`, `project-ci-report.cli.ts`), `be/src/features/api/project/`, `fe/apps/app/src/app/[locale]/(app)/projects/`,
`fe/apps/app/src/components/blocks/ProjectsList/`

Related: [learner-cli-relay](learner-cli-relay.md), [essentials](essentials.md), [verified-experience](verified-experience.md),
[learning-program](learning-program.md), [content](content.md)
