import { learnersOf } from "../../fixtures/builders/identity.builder"
import { SECRET } from "../../fixtures/builders/lesson.builder"
import {
    ATTEMPT,
    PROGRESS,
    SUBMIT,
    attemptDoors,
    choiceInput,
    type AttemptReadBody,
    type ProgressBody,
    type SubmitBody,
} from "../../world/attempt-doors.client"
import { storedAttemptsOf } from "../../world/attempt-world.options"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** Every outcome of the demo lesson before the learner answered anything: zero levels, not started. */
const UNTOUCHED = [
    { id: "demo--o1", understood: 0, proved: 0, state: "not-started" },
    { id: "demo--o2", understood: 0, proved: 0, state: "not-started" },
]

/**
 * Attempt doors, access and release (integration): `submitLessonAttempt`, `lessonAttempt` and `lessonProgress` of the real core
 * app behind the real session guard. It proves the session and Premium gates, that nothing of a choice is released before a
 * submit, and that an attempt is shown to its learner only.
 */
describe("lesson attempt doors, access and release (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = attemptDoors(world)
    const nextLearner = learnersOf("c1")

    beforeEach(async () => {
        await doors.reset()
    })

    it.each([
        [SUBMIT, { input: choiceInput("demo--predict--1") }],
        [ATTEMPT, { input: { attemptId: "20000000-0000-4000-8000-0000000000a1" } }],
        [PROGRESS, { input: { lessonId: "demo-lesson" } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await doors.ask(query, variables)

        expect(answer.data ?? null).toBeNull()
        expect(answer.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("answers LESSON_PREMIUM_REQUIRED to a learner without Premium and leaks no answer, option or explanation", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask<SubmitBody>(SUBMIT, { input: choiceInput("demo--predict--1") }, cookie)

        expect(answer.errors?.[0]?.extensions).toMatchObject({ code: "LESSON_PREMIUM_REQUIRED", kind: "forbidden" })
        expect(JSON.stringify(answer)).not.toContain(SECRET)
        expect(JSON.stringify(answer)).not.toMatch(/isCorrect|explanation/u)
        expect(await storedAttemptsOf(doors.db(), subject)).toEqual([])
    })

    it("releases the correctness and every explanation only after the submit, and shows the same on a later read", async () => {
        const { cookie } = await doors.signIn(nextLearner(), true)
        const before = await doors.ask<ProgressBody>(PROGRESS, { input: { lessonId: "demo-lesson" } }, cookie)

        const submitted = await doors.ask<SubmitBody>(SUBMIT, { input: choiceInput("demo--predict--2") }, cookie)
        const attempt = submitted.data?.submitLessonAttempt
        const read = await doors.ask<AttemptReadBody>(ATTEMPT, { input: { attemptId: attempt?.attemptId } }, cookie)

        expect(JSON.stringify(before)).not.toContain(SECRET)
        expect(before.data?.lessonProgress).toMatchObject({ version: null, phase: "challenge", outcomes: UNTOUCHED })
        expect(attempt).toMatchObject({ kind: "choice", phase: "predict", status: "graded", failureCode: null })
        expect(attempt?.result?.correct).toBe(false)
        expect(
            attempt?.result?.options.map((option) => [option.isCorrect, option.selected, option.explanation]),
        ).toEqual([
            [true, false, `${SECRET} right`],
            [false, true, `${SECRET} wrong`],
            [false, false, `${SECRET} also wrong`],
        ])
        expect(read.data?.lessonAttempt).toEqual(attempt)
    })

    it("does not show the attempt of one learner to another", async () => {
        const owner = await doors.signIn(nextLearner(), true)
        const stranger = await doors.signIn(nextLearner(), true)
        const submitted = await doors.ask<SubmitBody>(SUBMIT, { input: choiceInput("demo--predict--1") }, owner.cookie)
        const attemptId = submitted.data?.submitLessonAttempt.attemptId

        const read = await doors.ask<AttemptReadBody>(ATTEMPT, { input: { attemptId } }, stranger.cookie)

        expect(read.errors?.[0]?.extensions).toMatchObject({ code: "ATTEMPT_NOT_FOUND", kind: "not-found" })
    })

    it("answers LESSON_NOT_FOUND over the progress door for an unknown lesson", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask(PROGRESS, { input: { lessonId: "no-such-lesson" } }, cookie)

        expect(answer.errors?.[0]?.extensions).toMatchObject({ code: "LESSON_NOT_FOUND", kind: "not-found" })
    })
})
