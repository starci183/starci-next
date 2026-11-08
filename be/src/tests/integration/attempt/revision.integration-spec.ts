import { answerOf, submitParamsOf, writtenParamsOf } from "../../fixtures/builders/attempt.builder"
import { attemptModules, storedAttemptsOf, useAttemptWorld } from "../../world/attempt-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * Lesson attempts, revisions (integration): idempotency per learner, activity and revision on the real store, including two
 * sends at the same time.
 */
describe("lesson attempt revisions (integration)", () => {
    const world = useTestWorld({ modules: attemptModules })
    const w = useAttemptWorld(world)

    it("never makes a second attempt for a resend of the same revision and answer, even at the same time", async () => {
        const learner = await w.premiumLearner()

        const first = await w.attempts().submit(submitParamsOf({ learnerId: learner }))
        const resends = await Promise.all([
            w.attempts().submit(submitParamsOf({ learnerId: learner })),
            w.attempts().submit(submitParamsOf({ learnerId: learner })),
        ])

        expect(resends.map((view) => view.attemptId)).toEqual([first.attemptId, first.attemptId])
        expect((await storedAttemptsOf(w.db(), learner)).map((row) => row.revision)).toEqual([1])
    })

    it("refuses the same revision with another answer and keeps the stored one, then takes a new revision", async () => {
        const learner = await w.premiumLearner()
        const other = answerOf({ optionId: "demo--predict--2" })
        await w.attempts().submit(submitParamsOf({ learnerId: learner }))

        await expect(w.attempts().submit(submitParamsOf({ learnerId: learner, answer: other }))).rejects.toMatchObject({
            code: "ATTEMPT_REVISION_CONFLICT",
        })
        const second = await w.attempts().submit(submitParamsOf({ learnerId: learner, revision: 2, answer: other }))

        expect(second.result?.correct).toBe(false)
        const stored = await storedAttemptsOf(w.db(), learner)
        expect(stored.map((row) => [row.revision, row.answer.optionId])).toEqual([
            [1, "demo--predict--1"],
            [2, "demo--predict--2"],
        ])
    })

    it("calls the coach once for two simultaneous sends of the same written answer", async () => {
        const learner = await w.premiumLearner()
        const submit = () => w.attempts().submit(writtenParamsOf({ learnerId: learner }))

        const [first, second] = await Promise.all([submit(), submit()])

        expect(first.attemptId).toBe(second.attemptId)
        expect(w.coach().requests).toHaveLength(1)
        expect(await storedAttemptsOf(w.db(), learner)).toHaveLength(1)
    })
})
