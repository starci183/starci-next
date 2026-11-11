import { Test } from "@nestjs/testing"
import {
    ATTEMPT_ID,
    activityProgressRowOf,
    answerOf,
    attemptRowOf,
    resultOf,
} from "@tests/fixtures/builders/attempt.builder"
import { toAttemptView, toProgressView } from "./attempt.mapper"

const ATTEMPT_MAPPER: unique symbol = Symbol("attempt.mapper")
const mappers = { toAttemptView, toProgressView }

const build = async (): Promise<typeof mappers> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ATTEMPT_MAPPER, useFactory: () => mappers }],
    }).compile()
    return moduleRef.get<typeof mappers>(ATTEMPT_MAPPER)
}

describe("toAttemptView", () => {
    it("maps a graded attempt with its instants as text", async () => {
        const { toAttemptView: toView } = await build()

        expect(toView(attemptRowOf())).toEqual({
            attemptId: ATTEMPT_ID,
            lessonId: "demo-lesson",
            lessonVersion: "v1",
            activityId: "demo--predict",
            revision: 1,
            kind: "choice",
            phase: "predict",
            status: "graded",
            isDiagnostic: false,
            answer: answerOf({ optionId: "demo--predict--1" }),
            result: resultOf({ correct: true, score: 1, maxScore: 1 }),
            failureCode: null,
            submittedAt: "2026-11-08T10:00:00.000Z",
            gradedAt: "2026-11-08T10:00:00.000Z",
        })
    })

    it("maps a failed attempt with its code and no grade time", async () => {
        const { toAttemptView: toView } = await build()

        const view = toView(
            attemptRowOf({
                status: "failed",
                result: null,
                failure_code: "ATTEMPT_COACH_UNAVAILABLE",
                graded_at: null,
            }),
        )

        expect(view).toMatchObject({
            status: "failed",
            result: null,
            failureCode: "ATTEMPT_COACH_UNAVAILABLE",
            gradedAt: null,
        })
    })
})

const parts = (
    overrides: Partial<Parameters<typeof toProgressView>[0]> = {},
): Parameters<typeof toProgressView>[0] => ({
    lessonId: "demo-lesson",
    outcomes: [],
    phases: [],
    activities: [],
    completedAt: null,
    simulations: [],
    reviews: [],
    ...overrides,
})

describe("toAttemptView notes", () => {
    it("reads an empty note for a criterion graded before graders wrote notes", async () => {
        const { toAttemptView: toView } = await build()
        const legacy = {
            ...resultOf(),
            criteria: [{ criterionId: "c1", criterion: "C", level: 1, evidenceQuote: "q", maxScore: 2 }],
        }

        const view = toView(attemptRowOf({ result: legacy }))

        expect(view.result?.criteria[0]?.missing).toBe("")
    })
})

describe("toProgressView", () => {
    it("is at the first phase with nothing counted before any attempt", async () => {
        const { toProgressView: toProgress } = await build()

        expect(toProgress(parts())).toEqual({
            lessonId: "demo-lesson",
            version: null,
            phase: "challenge",
            outcomes: [],
            phases: [],
            completedAt: null,
            simulations: [],
            reviews: [],
            attempts: { total: 0, activities: 0, graded: 0, failed: 0, pending: 0 },
            activities: [],
        })
    })

    it("reports the furthest phase, the newest version, the counts and the whole newest attempt", async () => {
        const { toProgressView: toProgress } = await build()

        const view = toProgress(
            parts({
                outcomes: [{ id: "demo--o1", understood: 2, proved: 1, state: "learning" }],
                completedAt: new Date("2026-11-11T08:00:00.000Z"),
                activities: [
                    activityProgressRowOf({ activity_id: "a", phase: "explore", attempts: 2, status: "failed" }),
                    activityProgressRowOf({
                        activity_id: "b",
                        phase: "apply",
                        kind: "exercise",
                        attempts: 1,
                        status: "grading",
                        lesson_version: "v2",
                        submitted_at: new Date("2026-11-09T10:00:00.000Z"),
                    }),
                    activityProgressRowOf({ activity_id: "c", phase: "challenge", attempts: 3, status: "saved" }),
                    activityProgressRowOf({ activity_id: "d", phase: "predict", attempts: 1, status: "graded" }),
                ],
            }),
        )

        expect(view.phase).toBe("apply")
        expect(view.version).toBe("v2")
        expect(view.completedAt).toBe("2026-11-11T08:00:00.000Z")
        expect(view.attempts).toEqual({ total: 7, activities: 4, graded: 1, failed: 1, pending: 2 })
        expect(view.outcomes).toEqual([{ id: "demo--o1", understood: 2, proved: 1, state: "learning" }])
        expect(view.activities[1]).toMatchObject({
            activityId: "b",
            phase: "apply",
            kind: "exercise",
            attempts: 1,
            latestAttemptId: ATTEMPT_ID,
            latestRevision: 1,
            latestStatus: "grading",
            latest: { activityId: "b", status: "grading", lessonVersion: "v2" },
        })
    })
})

describe("toProgressView phases and simulations", () => {
    it("keeps the earlier phase when a later row is at an earlier phase", async () => {
        const { toProgressView: toProgress } = await build()

        const view = toProgress(
            parts({
                activities: [
                    activityProgressRowOf({ activity_id: "a", phase: "reflect" }),
                    activityProgressRowOf({ activity_id: "b", phase: "predict" }),
                ],
            }),
        )

        expect(view.phase).toBe("reflect")
    })

    it("maps a saved simulation position", async () => {
        const { toProgressView: toProgress } = await build()

        const view = toProgress(
            parts({
                simulations: [
                    {
                        activity_id: "sim",
                        current_state_id: "s2",
                        action_ids: ["a1"],
                        tried_transition_ids: ["t1", "t2"],
                        updated_at: new Date("2026-11-11T09:00:00.000Z"),
                    },
                ],
            }),
        )

        expect(view.simulations).toEqual([
            {
                activityId: "sim",
                currentStateId: "s2",
                actionIds: ["a1"],
                triedTransitionIds: ["t1", "t2"],
                updatedAt: "2026-11-11T09:00:00.000Z",
            },
        ])
    })
})
