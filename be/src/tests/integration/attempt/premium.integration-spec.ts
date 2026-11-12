import { WRITTEN_ANSWER, answerOf, submitParamsOf, writtenParamsOf } from "../../fixtures/builders/attempt.builder"
import { SECRET } from "../../fixtures/builders/lesson.builder"
import { attemptModules, storedAttemptsOf, useAttemptWorld } from "../../world/attempt-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * Lesson attempts, the Premium gate (integration): a learner without Premium reaches no phase but the free one, no coach call
 * is made for them outside it, and the free diagnostic is graded per criterion without leaking the rubric.
 */
describe("lesson attempts and the Premium gate (integration)", () => {
    const world = useTestWorld({ modules: attemptModules })
    const w = useAttemptWorld(world)

    it("refuses every phase but the free one and reaches neither the coach nor the store", async () => {
        const learner = w.newLearner()
        const reflect = writtenParamsOf({ learnerId: learner, activityId: "demo--final" })

        await expect(w.attempts().submit(submitParamsOf({ learnerId: learner }))).rejects.toMatchObject({
            code: "LESSON_PREMIUM_REQUIRED",
        })
        await expect(w.attempts().submit(reflect)).rejects.toMatchObject({ code: "LESSON_PREMIUM_REQUIRED" })

        expect(w.coach().requests).toEqual([])
        expect(await storedAttemptsOf(w.db(), learner)).toEqual([])
    })

    it("grades the free diagnostic per criterion and counts it toward nothing", async () => {
        const learner = w.newLearner()
        const quote = WRITTEN_ANSWER.slice(0, 20)

        const view = await w.attempts().submit(writtenParamsOf({ learnerId: learner }))
        const progress = await w.reads().progress({ learnerId: learner, lessonId: "demo-lesson" })

        expect(view).toMatchObject({ kind: "explain", phase: "challenge", status: "graded", isDiagnostic: true })
        expect(view.result?.criteria).toEqual([
            {
                criterionId: "demo--interview--c1",
                criterion: "vi: Mechanism",
                level: 2,
                evidenceQuote: quote,
                maxScore: 2,
                missing: "",
            },
            {
                criterionId: "demo--interview--c2",
                criterion: "vi: Limits",
                level: 2,
                evidenceQuote: quote,
                maxScore: 3,
                missing: "",
            },
        ])
        expect(JSON.stringify(view)).not.toContain(SECRET)
        expect(w.coach().requests[0]?.rubric[0]?.expectedEvidence).toBe(`${SECRET} evidence one`)
        expect(progress.phase).toBe("challenge")
        expect(progress.outcomes).toEqual([
            { id: "demo--o1", understood: 0, proved: 0, state: "not-started" },
            { id: "demo--o2", understood: 0, proved: 0, state: "not-started" },
        ])
    })

    it("sends the coach a request that names no learner and reaches the reflect phase", async () => {
        const learner = await w.premiumLearner()
        const reflect = writtenParamsOf({ learnerId: learner, activityId: "demo--final" })

        const view = await w.attempts().submit({ ...reflect, answer: answerOf({ text: WRITTEN_ANSWER }) })
        const progress = await w.reads().progress({ learnerId: learner, lessonId: "demo-lesson" })

        expect(view.status).toBe("graded")
        expect(JSON.stringify(w.coach().requests)).not.toContain(learner)
        expect(w.coach().requests[0]?.requestId).toBe(view.attemptId)
        expect(progress.phase).toBe("reflect")
    })
})
