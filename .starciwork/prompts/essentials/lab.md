# Rules: the lab (lab@2)

The lab is the code the learner runs and fixes. It lives in its own repository (`starci-next-labs/<lab>`), is described by one manifest,
and is cut into the lesson folder by the coordinator. The REF rule ([../shared/refs.md](../shared/refs.md), Saga's set in [README.md](README.md)) governs every word in it.

## The manifest

`starci-lab.yaml` at the lab root, `schema: starci-next-labs/lab@2`, shaped by `schemas/essentials-lab.schema.json` of the content
repository; the schema is the field list and is not copied here. A lab declares, always:

- **its stack**: language, runtime, test runner, the services (each one process with its own database, port and role), and the deps
  (`postgres`, `redis`, `rabbitmq`…, with image and role). Page 1 draws the architecture from this and nothing else, so a service or a dep
  the lab uses and the manifest omits is a defect;
- **its happy cases**: they pass on the naive code. They prove the system works before anything breaks;
- **its unhappy list**: the cases the learner fixes until done, each with its `chaos`, `invariants`, the ladder `ref` that is its fix,
  what it `teaches`, three `hints` and its `mcp` (`explain`, `inspect`);
- the `learnerFile`, the `ladder`, the `grader` and `mcp.inspect`; `production`, the repositories page 6 compares against
  ("Production repos" below); `framework` when a framework version exists.

The rules the schema cannot hold: every `unhappy.ref` is in `ladder.refs`; every `unhappy.mcp.inspect` id is in `mcp.inspect`; every
`uses` names a declared dep; `learnerFile` exists in the lab. The content repository's `validate-courses.mjs`, the lab's `ladder:check` and the relay's manifest
read refuse a manifest that breaks one.

## Happy cases

Each runs with no fault or a harmless one (latency changes timing, never the outcome) and must be green on `c0-naive`. A happy case that
needs the learner's fix is an unhappy case. Why: the learner's first run must be green, so red later is read as the lab's chaos, not
a broken setup.

## Unhappy cases

One concern each, in the order the ladder fixes them: case k is fixed by rung k. A case sets its fault through `chaos` (a map of
`KEY: value`, put to `PUT /lab/chaos`), states what must hold in `invariants`, and fails on the rung before its own for that invariant
and no other. `teaches` is one sentence on what the case makes the learner notice; page 5 reads it. Chaos that two cases need is combined
in the later case (a fault during the undo of an earlier failure), never a second mechanism.

## The git ladder

The lab is a chain of tagged commits: `c0-naive` (the base) up to `main`, one concern per rung, named `c<k>-<concern>`.

- `c0-naive` is plain code that is right when nothing fails and says nothing about failure. Its happy cases pass.
- A rung adds exactly one concern and changes only the `learnerFile`. Whatever a rung needs besides that file (a table, an endpoint, a
  chaos hook) is already in `c0`, in infra the learner never edits. Why: the relay checks out one reference file on "reset to the
  reference step"; a rung that changes two files cannot be reset.
- `ladder:check` (a script of the lab, run in its CI): at ref k, the happy cases and cases 1 to k pass, and case k+1 fails because of its
  own invariant, not for another reason; `main` passes everything, including the grader matrix. A rung that fixes two cases, or whose
  case fails for a foreign reason, is wrong.
- The refs, `main` and the grader are never read by the MCP and never shown before their case is green.

## The learner edits one file

The `learnerFile` is the only file the learner changes; everything else in the lab is read-only to them (the relay's diff and reset
depend on it). It holds the logic the lesson is about and nothing that makes the lab a lab, so it reads like production code. Keep it
small enough to read in one sitting: the learner should see the whole mechanism on one screen.

## Chaos stays in infra

Faults are injected by infra code the learner does not edit: the shared http client and the middleware of each service, switched by
`PUT /lab/chaos` and cleared by `POST /lab/reset`. They are never in the learner file: a learner file that checks `CHAOS` or catches a
lab-only error is a test hook, and the learner would then fix the test, not the system. The keys and their meaning belong to the lab's
contract (for Saga: the HTTP contract in the lab's README); a new case adds a key to infra at `c0`, never a branch to the
learner file.

## Tests check invariants, never code shape

A test drives the services over HTTP and reads the result over HTTP or the database: statuses, balances, rows, emails sent. It states the
invariant it checks. It never imports the learner file, spies on a call, counts a function's invocations or reads source text. Why: any
correct fix passes, whatever shape the learner chose; a shape test would reject a right answer and teach the shape instead of the idea.

Each failure prints the invariant that failed, what was expected and what was found; `case_status` of the MCP returns exactly that.
The same suite runs against the Express lab and the framework version (one HTTP contract), so a test knows no framework.

## The grader matrix

The hidden grader runs on the learner's relay when they submit on page 6, against the learner's code. It is a matrix of steps by faults
(Saga: steps `order`, `payment`, `stock` by faults `fail-before`, `lost-response`, `crash`, `dup`, which is 12 cells); each cell injects
one fault at one step and checks the lab's invariants after. The manifest declares the matrix (`grader.matrix`) and the file and command;
the grader file lives in `hidden/` and never reaches the learner bundle, the MCP or the diff. It must pass on `main` and fail on every rung
before it. The matrix is wider than the unhappy list on purpose: the cases teach, the matrix proves the idea holds where the cases
did not look.

## MCP: three hints, inspect only

The MCP is generic; the lab gives it its content through the manifest ([mcp](../../concepts/mcp.md) owns the tools). The lab's
part:

- **Hints, 3 levels per unhappy case**, Vietnamese, unlocked one at a time and recorded: level 1 the direction (a question about the
  failing invariant, no code), level 2 where to look (the view to inspect, the step of the learner file), level 3 the shape of the fix in
  words. No level pastes the reference code or names a later concept (REF rule).
- **Inspect only**: `mcp.inspect` lists read-only URLs (the log of one run, a wallet, a stock row, the emails sent) that the MCP may fetch
  with the learner's own parameters. The MCP never writes, never fixes, never reads a ladder ref, `main` or the grader.
- `explain` takes a term from `concepts.yaml`, so it answers only what the graph has taught.

## Production repos

Owner, 2026-11-26: "bước cuối k phải thưởng mà là MUỐN hiểu cách implement chuẩn trong production? check, nhiều repo, tương lai thầy có thể
quăng nhiều prod repo". After the grader matrix passes, page 6 compares the learner's file with several real, public, production-grade
repositories; nothing is handed over as a reward.

The list is data, never page copy: the lab declares it in its manifest, so the owner can add repositories later without touching a page.
The field, as `schemas/essentials-lab.schema.json` of the content repository holds it:

```yaml
production:
  - repo: <owner>/<name> # a public repository
    lang: TypeScript
    checked: "2026-11-26" # the day each file was opened and checked
    files:
      - path: src/orders/checkout.ts
        url: https://github.com/<owner>/<name>/blob/<full commit sha>/src/orders/checkout.ts
    shows: # one key per unhappy case id of this manifest
      <caseId>: yes # yes | engine | partial | no | manual | unknown
    note: <one plain-Vietnamese line>
```

- **`shows`** has one key for every unhappy case and no other key. Page 6 draws it as the table: rows the repositories, columns the cases'
  ideas, cells `yes` Có, `engine` Nền tảng lo (the framework or database does it for them), `partial` Một phần, `no` Không, `manual` Tự viết, `unknown` Không rõ (the code was read and gives no verdict).
- **`note`** says in one plain-Vietnamese line how the repository does it and how that differs from the learner's file. It follows
  [voice.md](../shared/voice.md) §3 and the REF rule: for Saga no note says "outbox", "message queue", "broker" or any later concept name;
  a mechanism outside the allowed set is described in words the tree has, or the repository is left out.
- **Every link is pinned and checked.** A `url` points at a full commit SHA (at least 10 characters is accepted), never a branch, and at its own `repo` and `path`. Before a repository is listed, every `path`
  is verified to exist at that SHA (for GitHub, `gh api repos/<repo>/contents/<path>?ref=<sha>` answers 200), and `shows` is read from that
  code, not from the repository's README. Enforcer: the content repository's `validate-courses.mjs` (rule `production`: `shows` keys equal the unhappy case ids, every `url` is pinned and matches its repo and path); that the file exists at the SHA and the verdicts match the code is held by review.
- After the table, page 6 says what the learner did that none of the listed repositories ships, then answers the page-1 interview
  question in plain words.

### The NestJS version

The framework version stays as one entry of that list, not a reward: the same lesson in NestJS, so the learner sees where their one file
lives in a framework codebase. For now NestJS is the only one; other languages and frameworks are not mentioned to the learner before they exist.

- It is its own repository (`<lab>-nest`) that serves the same HTTP contract and passes the same Jest suite as the Express lab.
- `framework.nestjs.map` pairs each part of the learner file (`file#SYMBOL`) with the Nest file that holds it ("your `STEPS` is here,
  your retry is this provider"); its `production` entry's `files` are those Nest files.
- It is written to the same rules as the lab: [code.md](code.md), and the REF rule (for Saga, no BullMQ or queue: retries run in a
  provider, recovery on bootstrap plus a periodic sweep).
- Comments in it explain why the framework puts each piece where it does.
