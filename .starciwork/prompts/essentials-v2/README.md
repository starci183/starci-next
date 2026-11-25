# Essentials v2: a lesson and its lab

The rules for an agent that writes an Essentials v2 lesson and the lab it runs on: the six learner pages, the REF rule that decides which
words a page may use, and what each page holds. [lab.md](lab.md) holds the lab (manifest, cases, ladder, grader, MCP, framework version),
[code.md](code.md) holds how the lab's TypeScript is written and commented.

An Essentials v2 lesson is one incident in one running system, learned by fixing a lab until its cases pass. It replaces the five parts of
[the v1 essentials rules](../essentials/README.md), whose rules do not apply here; v1 lessons keep using them.

**Reference example: Saga.** Every rule below is shown in the Saga lesson, the only v2 lesson for now:

- the lesson folder `<content repo>/raw/essentials-v2/shop-giay/saga-compensation/` and the course `<content repo>/raw/essentials-v2/shop-giay/course.yaml` in the content
  repository (`starci-next-seed-standard`); it carries `<lesson folder>/starci-lab.yaml` (a fixture built from the Saga spec until the coordinator cuts the real lab; the old nine-beat script is gone);
- the lab `starci-next-labs/shop-giay` (Express, `pg`, `ioredis`, Jest), the framework version `starci-next-labs/shop-giay-nest`;
- the manifest schema `<content repo>/schemas/essentials-lab.schema.json` of the content repository, and the learner flow canvas
  <https://claude.ai/artifact/Jka1KqNpiPhtXeqv5TGzdC>.

A rule that Saga shows is stated here once; when Saga and a rule disagree, the owner decides and this folder changes.

## What else applies

Read [the shared rules](../shared/) whole first: the refs, Vietnamese, voice, audience and numbers rules apply to every learner-facing word of v2.
Exception: [stack.md](../shared/stack.md) says "no framework"; that holds for the lab, and the NestJS version is the one
framework build, handed over on page 6 ([lab.md](lab.md) "The framework version"). How the relay and the MCP work is not written here: it
is [learner-cli-relay](../../concepts/learner-cli-relay.md) and [mcp](../../concepts/mcp.md). What the
content repository checks of a course and its lab (the manifest against `<course folder>/course.yaml`, the concept graph chain, the ladder, the invariants,
the deps) is `<content repo>/scripts/validate-courses.mjs`, and its adapter writes the lab as the seed set `essentials-labs` without ladder refs, grader
files or MCP urls; this folder never restates either. That no page 1 to 4 word is one of the lesson's own terms is held by review.

## The REF rule

A law of all StarCi Next content: [refs.md](../shared/refs.md). Every learner-facing word of a v2 lesson and its lab (page copy,
case titles, invariants, hints, MCP answers, the lab README, code comments, test names and messages, the framework version) names only the
lesson's concept, its keywords and its transitive `requires`, and no teaser names a later concept.

For Saga the allowed set is saga (distributed transaction, compensating transaction, bước bù, orchestration, choreography, saga log,
recovery, pivot step) and its requires: request-lifecycle, data-modeling, service-boundary, transaction-acid, timeout, retry,
idempotency-key. Not allowed in Saga: race condition, lock, semantic lock, outbox, 2PC, message queue, BullMQ, dead-letter queue, event
sourcing, CQRS and every other later concept. So a double click is an idempotent checkout (the second checkout of an order returns the
first result), never a lock, and the Nest version retries in a provider with no queue.

## The six pages

A lesson is six pages in this order. Each has one job; content of one page never moves into another. Pages 1 to 4 do not use the
lesson's own terms (`terms` of `<course folder>/course.yaml`); page 5 names them.

| Page                | Its one job                                                | It holds                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Intro            | show the system and what the learner will do               | the architecture drawn from the manifest (`stack.services`, `stack.deps`, the course's system map), the incident in one scene, the outcomes as the titles of the happy and unhappy cases, `requires` as what to know first                                                                 |
| 2. Setup            | get the lab running on the learner's machine               | install and pair the relay, choose the directory, the lab at `c0-naive` with its deps up, the commands in the bash form ([stack.md](../shared/stack.md))                                                                                                                         |
| 3. Happy loop       | prove the system works when nothing goes wrong             | run the happy cases on the naive code until green, read the one learner file, the invariants each case checks; nothing is broken yet                                                                                                                                                       |
| 4. Unhappy loop     | break it, then fix it until done                           | the unhappy cases in order: the case runs red with the chaos it sets and the invariant that failed, the learner edits the learner file and runs the case again, MCP hints in 3 levels and read-only views, the diff to the reference after green, "reset to the reference step" when stuck |
| 5. Name the pattern | give what the learner built its name                       | the concept: its name, a short definition, the everyday analogy, the flow, the terms it brings; each unhappy case's `teaches` set against the name                                                                                                                                         |
| 6. Submit           | prove it under the full matrix and hand over the framework | the hidden grader matrix run on the learner's relay, and on a pass the NestJS source with its map ([lab.md](lab.md) "The grader matrix", "The framework version")                                                                                                                          |

Page 4 is where the time goes: its cases are the lesson. Their order, titles and hints are the lab manifest's, not page copy; a page reads
the manifest and never restates a case in its own words.
