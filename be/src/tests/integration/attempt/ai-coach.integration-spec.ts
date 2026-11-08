import { WRITTEN_ANSWER, writtenParamsOf } from "../../fixtures/builders/attempt.builder"
import { aiCoachModules, useAiCoachWorld } from "../../world/ai-coach-world.options"
import { storedAttemptsOf } from "../../world/attempt-world.options"
import { useTestWorld } from "../../world/use-test-world"

const GRADE = JSON.stringify({
    criteria: [
        { criterionId: "demo--interview--c1", level: 2, evidenceQuote: "the read model lags" },
        { criterionId: "demo--interview--c2", level: 1, evidenceQuote: "eventual consistency" },
    ],
})

/** The text of one message role in the request body the fake recorded; empty when the body does not say. */
const textOf = (body: string, role: string): string => {
    try {
        const parsed: unknown = JSON.parse(body)
        const messages: unknown =
            typeof parsed === "object" && parsed !== null && "messages" in parsed ? parsed.messages : []
        const list: ReadonlyArray<unknown> = Array.isArray(messages) ? messages : []
        const found = list.find(
            (message) => typeof message === "object" && message !== null && "role" in message && message.role === role,
        )
        return typeof found === "object" && found !== null && "content" in found ? String(found.content) : ""
    } catch (cause) {
        return String(cause)
    }
}

/**
 * The AI coach (integration): the attempt capability grades a written answer through the real gateway and `@starci/ai-router`
 * pool, with OpenRouter as the only double (the world's openrouter fake). Covers the grade and what the model is and is not told,
 * an answer that is not a grade, the fair-use limit of the day, a provider outage and a refused key.
 */
describe("the AI coach (integration)", () => {
    const world = useTestWorld({ modules: aiCoachModules })
    const w = useAiCoachWorld(world)

    it("grades per criterion, tells the model the rubric and fences the learner text, and returns no expected evidence", async () => {
        const learner = w.newLearner()
        await w.openrouter()?.reply(GRADE)

        const view = await w.attempts().submit(writtenParamsOf({ learnerId: learner }))

        expect(view).toMatchObject({ status: "graded", failureCode: null })
        expect(view.result?.criteria.map((entry) => [entry.criterionId, entry.level, entry.evidenceQuote])).toEqual([
            ["demo--interview--c1", 2, "the read model lags"],
            ["demo--interview--c2", 1, "eventual consistency"],
        ])
        expect(JSON.stringify(view)).not.toContain("expectedEvidence")
        const recorded = (await w.openrouter()?.requests()) ?? []
        const body = recorded[0]?.body ?? "{}"
        expect(recorded).toHaveLength(1)
        expect(textOf(body, "system")).toContain("expected evidence:")
        expect(textOf(body, "system")).toContain("untrusted data")
        expect(textOf(body, "user")).toContain(WRITTEN_ANSWER)
        expect(textOf(body, "user")).not.toContain("expected evidence")
        expect(recorded[0]?.body).not.toContain(learner)
        expect(JSON.stringify(recorded[0]?.headers)).not.toContain(learner)
    })

    it("fails the attempt as invalid and stores no grade when the model wrote something that is not a grade", async () => {
        await w.openrouter()?.reply("Sure! I would say 2 out of 2.")

        const view = await w.attempts().submit(writtenParamsOf({ learnerId: w.newLearner() }))

        expect(view).toMatchObject({ status: "failed", failureCode: "ATTEMPT_COACH_INVALID", result: null })
    })

    it("holds the fair-use limit of the day, keeps the answer saved and asks the model for nothing past it", async () => {
        const learner = w.newLearner()
        await w.openrouter()?.reply(GRADE)
        const first = await w.attempts().submit(writtenParamsOf({ learnerId: learner, revision: 1 }))
        const second = await w.attempts().submit(writtenParamsOf({ learnerId: learner, revision: 2 }))
        const callsAtLimit = (await w.openrouter()?.requests())?.length

        const limited = await w.attempts().submit(writtenParamsOf({ learnerId: learner, revision: 3 }))

        expect([first.status, second.status]).toEqual(["graded", "graded"])
        expect(limited).toMatchObject({ status: "failed", failureCode: "ATTEMPT_COACH_LIMIT_REACHED", result: null })
        expect((await w.openrouter()?.requests())?.length).toBe(callsAtLimit)
        const stored = await storedAttemptsOf(w.db(), learner)
        expect(stored.map((row) => [row.revision, row.status, row.answer.text])).toEqual([
            [1, "graded", WRITTEN_ANSWER],
            [2, "graded", WRITTEN_ANSWER],
            [3, "failed", WRITTEN_ANSWER],
        ])
        await expect(w.attempts().submit(writtenParamsOf({ learnerId: w.newLearner() }))).resolves.toMatchObject({
            status: "graded",
        })
    })

    it("keeps the answer and fails as unavailable while the provider is down, then grades it on a resend once it is back", async () => {
        const learner = w.newLearner()
        await w.openrouter()?.failNext({ status: 503, times: 10 })

        const failed = await w.attempts().submit(writtenParamsOf({ learnerId: learner }))
        await w.openrouter()?.reset()
        await w.openrouter()?.reply(GRADE)
        const graded = await w.attempts().submit(writtenParamsOf({ learnerId: learner }))

        expect(failed).toMatchObject({ status: "failed", failureCode: "ATTEMPT_COACH_UNAVAILABLE", result: null })
        expect(graded).toMatchObject({ attemptId: failed.attemptId, status: "graded" })
    })

    it("fails as unavailable, not as a crash, when the provider refuses the key", async () => {
        await w.openrouter()?.failNext({ status: 401, times: 10 })

        const view = await w.attempts().submit(writtenParamsOf({ learnerId: w.newLearner() }))

        expect(view).toMatchObject({ status: "failed", failureCode: "ATTEMPT_COACH_UNAVAILABLE", result: null })
    })
})
