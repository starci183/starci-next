# practice

Luyện code: the teacher's coding problems (patterns × languages) solved in the browser and judged on a self-hosted Judge0 behind a
queue. It is free for every signed-in learner. Its CV line is one per pattern, never one per problem.

## Terms
- **Problem**: one of the teacher's `coding-problems` (per pattern, `vi` and `en`), imported as an immutable version.
- **Verdict**: Accepted, Wrong Answer, Time Limit Exceeded, Compilation Error, runtime error, internal error.
- **Hint ladder**: the teacher's own three steps per problem (analysis, approach, related problems).
- **Solution reveal**: the learner opens a problem's reference solution once; the first instant is stored.
- **History**: the signed-in learner's own graded submits of one pattern, newest first, read page by page by an opaque keyset cursor
  (`practiceSubmissions`).
- **Pattern line**: the CV item `practice.pattern-solved`, claimed per pattern ([verified-experience](verified-experience.md)).

## Rules
1. Hidden tests never reach the client; the per-test summary never shows a hidden test's content. A reference solution reaches the
   client only after its learner reveals it, once per problem.
2. The AI never writes code and hints are never generated; a hint is the next authored step.
3. Every signed-in learner opens every problem of every pattern; there is no free count, no lock and no Premium gate.
4. The judge is shared, so submissions are queued (`PRACTICE_JUDGE_CONCURRENCY`, default 4), rate limited per learner (default 10 a
   minute, one in flight), and bounded in source size; an unset judge ends runs as an internal error, never a fake verdict.
5. A judged submission records one graded-attempt streak action; Accepted counts per pattern feed hiring readiness.
6. A pattern whose problems are all Accepted, with no solution revealed before that problem's first Accepted, may be claimed as the
   `practice.pattern-solved` CV line (`claimPracticeExperience`); the first problem left unsolved refuses with
   `CAREER_PRACTICE_INCOMPLETE`, a solution seen first with `CAREER_PRACTICE_SOLUTION_VIEWED`.
7. The history lists only the caller's own graded submits (kind submit, not a run, not one still judging) of one pattern, newest first
   on (submitted instant, id), at most 50 a page (`PRACTICE_SUBMISSIONS_PAGE`, default 20); a cursor that no page handed out is
   `PRACTICE_CURSOR_INVALID`.

## Example
A learner opens the first two-pointer problem, submits in Go, gets Wrong Answer with "3/5 tests" and no hidden input shown, and
opens hint step 1; every other problem of the pattern is open too. After all its problems are Accepted with no solution opened first,
the learner claims the pattern's CV line.

## Don't / Instead
- Don't ask the AI for a fix; show the next authored hint.
- Don't run code in the API process; send it through the judge queue.

## Where
`be/src/modules/domain/practice/`, `be/src/modules/integrations/judge0/`, `be/src/features/api/practice/`,
`fe/apps/app/src/app/[locale]/(app)/practice/`

Related: [verified-experience](verified-experience.md), [streak](streak.md), [content](content.md)
