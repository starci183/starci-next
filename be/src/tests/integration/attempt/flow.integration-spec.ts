import { WRITTEN_ANSWER } from "../../fixtures/builders/attempt.builder"
import { learnersOf } from "../../fixtures/builders/identity.builder"
import {
    PROGRESS,
    SUBMIT,
    attemptDoors,
    choiceInput,
    writtenInput,
    type ProgressBody,
    type SubmitBody,
} from "../../world/attempt-doors.client"
import { storedAttemptsOf } from "../../world/attempt-world.options"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** The outcomes after one correct answer to the choice: the first is being learned, the second is not started. */
const AFTER_PREDICT = [
    { id: "demo--o1", understood: 2, proved: 0, state: "learning" },
    { id: "demo--o2", understood: 0, proved: 0, state: "not-started" },
]

/**
 * Attempt doors, the flow of a learner (integration): the real core app, whose AI gateway reaches the world's OpenRouter fake
 * that answers a grade holding no criteria until a spec scripts it, so a written answer is saved and fails with a stable code
 * instead of being graded. It proves idempotency over the door, the progress read and the
 * refusals of input and of a locked phase.
 */
describe("lesson attempt doors, the flow of a learner (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = attemptDoors(world)
    const nextLearner = learnersOf("c2")

    beforeEach(async () => {
        await doors.reset()
    })

    it("is idempotent per revision over the door and refuses another answer under the same revision", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), true)

        const first = await doors.ask<SubmitBody>(SUBMIT, { input: choiceInput("demo--predict--1") }, cookie)
        const again = await doors.ask<SubmitBody>(SUBMIT, { input: choiceInput("demo--predict--1") }, cookie)
        const conflict = await doors.ask<SubmitBody>(SUBMIT, { input: choiceInput("demo--predict--2") }, cookie)

        expect(again.data?.submitLessonAttempt.attemptId).toBe(first.data?.submitLessonAttempt.attemptId)
        expect(conflict.errors?.[0]?.extensions).toMatchObject({ code: "ATTEMPT_REVISION_CONFLICT", kind: "conflict" })
        expect(await storedAttemptsOf(doors.db(), subject)).toHaveLength(1)
    })

    it("reports the phase reached, the outcome levels and the attempts of the learner", async () => {
        const { cookie } = await doors.signIn(nextLearner(), true)
        await doors.ask(SUBMIT, { input: choiceInput("demo--predict--1") }, cookie)

        const progress = await doors.ask<ProgressBody>(PROGRESS, { input: { lessonId: "demo-lesson" } }, cookie)

        expect(progress.data?.lessonProgress).toEqual({
            version: "v1",
            phase: "predict",
            outcomes: AFTER_PREDICT,
            attempts: { total: 1, graded: 1, failed: 0 },
            activities: [{ activityId: "demo--predict", latestStatus: "graded" }],
        })
    })

    it("saves the free diagnostic of a learner without Premium and fails it with the invalid coach code when the model answers no grade", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask<SubmitBody>(SUBMIT, { input: writtenInput("demo--interview") }, cookie)
        const stored = await storedAttemptsOf(doors.db(), subject)

        expect(answer.errors).toBeUndefined()
        expect(answer.data?.submitLessonAttempt).toMatchObject({
            kind: "explain",
            phase: "challenge",
            status: "failed",
            failureCode: "ATTEMPT_COACH_INVALID",
            result: null,
        })
        expect(stored.map((row) => [row.status, row.failure_code, row.answer.text])).toEqual([
            ["failed", "ATTEMPT_COACH_INVALID", WRITTEN_ANSWER],
        ])
    })

    it("answers a locked written phase to a learner without Premium with the Premium code and stores nothing", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask<SubmitBody>(SUBMIT, { input: writtenInput("demo--final") }, cookie)

        expect(answer.errors?.[0]?.extensions.code).toBe("LESSON_PREMIUM_REQUIRED")
        expect(await storedAttemptsOf(doors.db(), subject)).toEqual([])
    })

    it.each([
        ["a revision below 1", { ...choiceInput("demo--predict--1", 0) }],
        ["an unsupported locale", { ...choiceInput("demo--predict--1"), locale: "fr" }],
        ["a path of more than 200 actions", { ...choiceInput("x"), answer: { actionIds: Array(201).fill("a") } }],
    ])("refuses %s as invalid input", async (_name, input) => {
        const { cookie } = await doors.signIn(nextLearner(), true)

        const answer = await doors.ask(SUBMIT, { input }, cookie)

        expect(answer.data ?? null).toBeNull()
        expect(answer.errors?.[0]?.extensions.kind).toBe("invalid")
    })
})
