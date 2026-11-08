import { WRITTEN_ANSWER, writtenParamsOf } from "../../fixtures/builders/attempt.builder"
import { attemptModules, storedAttemptsOf, useAttemptWorld } from "../../world/attempt-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** Lesson attempts, the coach (integration): the answer is kept when the coach fails, and a grade the rubric refuses is never stored. */
describe("lesson attempts and the coach (integration)", () => {
    const world = useTestWorld({ modules: attemptModules })
    const w = useAttemptWorld(world)

    it("keeps the answer when the coach fails, then grades it on a resend once the coach is back", async () => {
        const learner = await w.premiumLearner()
        const submit = () => w.attempts().submit(writtenParamsOf({ learnerId: learner }))
        w.coach().breakDown()

        const failed = await submit()
        const afterFailure = await storedAttemptsOf(w.db(), learner)
        w.coach().reset()
        const graded = await submit()

        expect(failed).toMatchObject({ status: "failed", failureCode: "ATTEMPT_COACH_UNAVAILABLE", result: null })
        expect(afterFailure.map((row) => [row.status, row.failure_code, row.answer.text])).toEqual([
            ["failed", "ATTEMPT_COACH_UNAVAILABLE", WRITTEN_ANSWER],
        ])
        expect(graded).toMatchObject({ attemptId: failed.attemptId, status: "graded", failureCode: null })
        expect((await storedAttemptsOf(w.db(), learner)).map((row) => row.status)).toEqual(["graded"])
    })

    it("stores no grade the rubric refuses and fails the attempt as invalid", async () => {
        const learner = await w.premiumLearner()
        w.coach().answerWith((request) =>
            Promise.resolve({
                criteria: request.rubric.map((criterion) => ({
                    criterionId: criterion.id,
                    level: 2,
                    evidenceQuote: "words the learner never wrote",
                })),
            }),
        )

        const view = await w.attempts().submit(writtenParamsOf({ learnerId: learner }))

        expect(view).toMatchObject({ status: "failed", failureCode: "ATTEMPT_COACH_INVALID", result: null })
    })
})
