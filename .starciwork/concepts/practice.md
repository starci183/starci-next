# practice

Luyện code: the teacher's coding problems (patterns × languages) solved in the browser and judged on a self-hosted Judge0 behind a
queue. It trains problem solving; it adds no CV line.

## Terms
- **Problem**: one of the teacher's `coding-problems` (per pattern, `vi` and `en`), imported as an immutable version.
- **Verdict**: Accepted, Wrong Answer, Time Limit Exceeded, Compilation Error, runtime error, internal error.
- **Hint ladder**: the teacher's own three steps per problem (analysis, approach, related problems).

## Rules
1. Hidden tests and solutions never reach the client; the per-test summary never shows a hidden test's content. Solutions are not
   viewable.
2. The AI never writes code and hints are never generated; a hint is the next authored step.
3. A free learner opens the first problem of each pattern (`PRACTICE_FREE_PER_PATTERN`, default 1); Premium opens all.
4. The judge is shared, so submissions are queued (`PRACTICE_JUDGE_CONCURRENCY`, default 4), rate limited per learner (default 10 a
   minute, one in flight), and bounded in source size; an unset judge ends runs as an internal error, never a fake verdict.
5. A judged submission records one graded-attempt streak action; Accepted counts per pattern feed hiring readiness.

## Example
A free learner opens the first two-pointer problem, submits in Go, gets Wrong Answer with "3/5 tests" and no hidden input shown, and
opens hint step 1; the second problem of the pattern shows a lock.

## Don't / Instead
- Don't ask the AI for a fix; show the next authored hint.
- Don't run code in the API process; send it through the judge queue.

## Where
`be/src/modules/domain/practice/`, `be/src/modules/integrations/judge0/`, `be/src/features/api/practice/`,
`fe/apps/app/src/app/[locale]/(app)/practice/`

Related: [premium](premium.md), [streak](streak.md), [content](content.md)
