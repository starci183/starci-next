# mock-interview

Phỏng vấn thử is a text interview with the StarCi AI interviewer over the teacher's question banks: no feedback between questions,
then the whole session graded once against the teacher's authored answers, with each gap pointing back to a Bản chất lesson.

## Terms
- **Bank**: the teacher's technical banks per course module and the shared behavioural bank (`mock-interview-eq`).
- **Session**: free 3 questions (2 technical, 1 behavioural); Premium 5 (4 and 1). Technical questions come from the track's banks,
  plus one behavioural question at the same tier, "trộn như loop phỏng vấn thật".
- **Pillar**: technical or behavioural, scored apart.
- **Scorecard**: overall 0..100, verdict pass / borderline / fail, the two pillar scores, per-question score, missed critical items,
  rubric hits with quotes, hints used, strengths, gaps with the lesson to study, better-answer notes.

## Rules
1. Nothing used for grading (ideal answer, rubric, checklist, keywords, ownership signal, unasked hints, example results) reaches the
   browser or the interviewer before the session is graded.
2. Every answer is stored before the interviewer replies or the grader runs; a provider failure never loses an answer.
3. The session is graded once, after the last answer, from the full transcript, against each question's rubric, checklist and ideal
   answer; there is no retrieval over lesson content (the teacher's rule). Pillars are never averaged into one technical number.
4. Each awarded rubric point quotes the learner's words; length earns nothing.
5. The interviewer may rephrase, ask the authored follow-ups, or probe a vague answer, at most two follow-ups a question. It never
   teaches, corrects or hints unless asked; a hint used is recorded and lowers that question's score slightly.
6. Verdict: pass at 70 or more with no critical item missed; borderline at 50..69, or 70+ with one critical item missed; fail otherwise.
7. Free: one session per `Asia/Ho_Chi_Minh` calendar month from `isPremium: false` questions; Premium: unlimited under the fair-use
   cap. A refused learner gets `INTERVIEW_PREMIUM_REQUIRED` and causes no AI call.
8. A bank is published only after the grader scores its five authored example answers in level order and within 15 points of their
   scores. The teacher grades a sample of 30 answers to measure agreement (target 80 percent) before the banks are widened.
9. An interview result is evidence and hiring readiness (a pass on both pillars at a tier), never a CV line by itself.
10. Text first; voice, a code editor and the system-design canvas are later. Design and coding questions wait for a text version.

## Example
A free learner answers 3 questions with no feedback; the report shows 72, borderline (one critical item missed), and links the gap
"idempotency key" to its Bản chất lesson.

## Don't / Instead
- Don't give per-answer feedback; grade the whole session at the end.
- Don't rewrite a stem that gives the answer away; leave it out until the teacher writes one ([content](content.md)).

## Where
`be/src/modules/domain/interview/`, `be/src/features/api/interview/`, `fe/apps/app/src/app/[locale]/(app)/interview/`

Related: [ai-teacher](ai-teacher.md), [premium](premium.md), [essentials](essentials.md), [streak](streak.md)
