import { answerOf, submitParamsOf } from "../../fixtures/builders/attempt.builder"
import { SECRET } from "../../fixtures/builders/lesson.builder"
import { attemptModules, storedAttemptsOf, useAttemptWorld } from "../../world/attempt-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** The outcomes after the right choice: the first is being learned, the second is not started. */
const AFTER_RIGHT_CHOICE = [
    { id: "demo--o1", understood: 2, proved: 0, state: "learning" },
    { id: "demo--o2", understood: 0, proved: 0, state: "not-started" },
]

/**
 * Lesson attempts, choices and simulations (integration): the real attempt capability over the real primary database and the
 * real lesson content. It proves deterministic grading, the outcome levels, the validation of a simulation path and that an
 * attempt belongs to its learner.
 */
describe("lesson attempts of a choice and a simulation (integration)", () => {
    const world = useTestWorld({ modules: attemptModules })
    const w = useAttemptWorld(world)

    it("grades a choice at once, releases every explanation and raises the outcome of the learner", async () => {
        const learner = await w.premiumLearner()

        const view = await w.attempts().submit(submitParamsOf({ learnerId: learner }))
        const progress = await w.reads().progress({ learnerId: learner, lessonId: "demo-lesson" })

        expect(view).toMatchObject({ kind: "choice", phase: "predict", status: "graded" })
        expect(view.result?.correct).toBe(true)
        expect(view.result?.options.map((option) => option.explanation)).toEqual([
            `${SECRET} right`,
            `${SECRET} wrong`,
            `${SECRET} also wrong`,
        ])
        expect(progress).toMatchObject({
            version: "v1",
            phase: "predict",
            outcomes: AFTER_RIGHT_CHOICE,
            attempts: { total: 1, activities: 1, graded: 1, failed: 0, pending: 0 },
        })
        expect(w.coach().requests).toEqual([])
    })

    it("refuses an option the activity does not list and stores nothing", async () => {
        const learner = await w.premiumLearner()

        await expect(
            w
                .attempts()
                .submit(submitParamsOf({ learnerId: learner, answer: answerOf({ optionId: "demo--predict--9" }) })),
        ).rejects.toMatchObject({ code: "ATTEMPT_ANSWER_INVALID" })

        expect(await storedAttemptsOf(w.db(), learner)).toEqual([])
    })

    it("validates a simulation path against the stored state machine and records the success", async () => {
        const learner = await w.premiumLearner()
        const path = (actionIds: Array<string>, reachedStateId: string) =>
            submitParamsOf({
                learnerId: learner,
                activityId: "demo--explore",
                answer: answerOf({ actionIds, reachedStateId, debrief: "Because the projection ran." }),
            })

        await expect(w.attempts().submit(path(["demo--explore--a2"], "demo--explore--s2"))).rejects.toMatchObject({
            code: "ATTEMPT_ANSWER_INVALID",
        })
        const view = await w.attempts().submit(path(["demo--explore--a1", "demo--explore--a2"], "demo--explore--s2"))

        expect(view).toMatchObject({ kind: "simulation", phase: "explore", status: "graded" })
        expect(view.result).toMatchObject({ success: true, reachedStateId: "demo--explore--s2" })
        const stored = await storedAttemptsOf(w.db(), learner)
        expect(stored.map((row) => row.answer.debrief)).toEqual(["Because the projection ran."])
    })

    it("answers LESSON_NOT_FOUND for the progress in a lesson that is not live", async () => {
        const learner = await w.premiumLearner()

        await expect(w.reads().progress({ learnerId: learner, lessonId: "no-such-lesson" })).rejects.toMatchObject({
            code: "LESSON_NOT_FOUND",
        })
    })

    it("does not find the attempt of another learner", async () => {
        const owner = await w.premiumLearner()
        const stranger = await w.premiumLearner()
        const view = await w.attempts().submit(submitParamsOf({ learnerId: owner }))

        await expect(w.reads().find({ learnerId: stranger, attemptId: view.attemptId })).rejects.toMatchObject({
            code: "ATTEMPT_NOT_FOUND",
        })
        await expect(w.reads().find({ learnerId: owner, attemptId: view.attemptId })).resolves.toMatchObject({
            attemptId: view.attemptId,
        })
    })
})
