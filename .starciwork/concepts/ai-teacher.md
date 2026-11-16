# ai-teacher

The StarCi AI teacher grades, coaches and interviews over the teacher's own material. It is one model, it judges only against the
lesson's rubric, it is included with Premium under a hidden fair-use cap, and it never sees who the learner is.

## Terms
- **Coach**: the grader of written answers and explanations (lessons, retrieval, incidents, project concepts).
- **Interviewer / grader**: the interview profile of the same pool ([mock-interview](mock-interview.md)).
- **Fair-use cap**: a server-side limit of AI gradings per learner per UTC day. *Not to confuse with* credits, which do not exist.

## Rules
1. Every AI call uses `deepseek/deepseek-v4.1-flash` through OpenRouter; there is no `deepseek-v4-pro` and no other fallback model
   (the fallback equals the model). A door may have its own deadline and token budget, never its own model (owner).
2. A judgement is grounded in the lesson: each rubric criterion gets a level and a quoted span of the learner's own text (or diff and
   logs) as evidence. Length earns nothing, and a free-form model opinion is never a grade.
3. The AI never paraphrases a rubric into another standard, never fills a missing piece of content, and never writes the learner's
   code ([practice](practice.md)).
4. Premium includes the AI under the fair-use cap (`ATTEMPT_COACH_DAILY_LIMIT`, default 100 a UTC day). The learner sees no balance,
   only the stable refusal `ATTEMPT_COACH_LIMIT_REACHED` once the cap is reached.
5. A learner without Premium, or past the cap, causes no provider call.
6. No learner email, id or token is sent to a provider; a request carries an opaque request id.
7. A failed grading is an attempt with status failed and a failure code (`ATTEMPT_COACH_UNCONFIGURED`, `_UNAVAILABLE`, `_INVALID`),
   never a lost answer: the answer was stored first.
8. Tests and walks use the deterministic fake provider; a live call needs the owner's funded key, held sealed as `OPENROUTER_API_KEY`.

## Example
A Premium learner submits a written answer; the coach returns criterion "thứ tự trả về" at level 2 quoting "after của outer chạy sau
cùng". The 101st grading that UTC day is refused `ATTEMPT_COACH_LIMIT_REACHED` and no model is called.

## Don't / Instead
- Don't pick a stronger model for one door; give that door a longer deadline.
- Don't show remaining AI uses; refuse with the stable code when the cap is reached.
- Don't retrieve lesson text into an interview grade; grade against the authored answer.

## Where
`be/src/modules/integrations/ai-gateway/`, `be/src/modules/domain/attempt/`

Related: [premium](premium.md), [essentials](essentials.md), [mock-interview](mock-interview.md), [conventions](conventions.md)
