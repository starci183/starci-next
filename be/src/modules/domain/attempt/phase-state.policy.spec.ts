import { Test } from "@nestjs/testing"
import { attemptRowOf, resultOf } from "@tests/fixtures/builders/attempt.builder"
import type { LessonOutline, LessonOutlineActivity } from "@modules/domain/lesson"
import type { AttemptView } from "./attempt.contracts"
import { toAttemptView } from "./attempt.mapper"
import type { LatestByActivity } from "./outcome-state.policy"
import { phasesOf } from "./phase-state.policy"

const PHASE_POLICY: unique symbol = Symbol("attempt.phase-state-policy")

const build = async (): Promise<typeof phasesOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: PHASE_POLICY, useFactory: () => phasesOf }],
    }).compile()
    return moduleRef.get<typeof phasesOf>(PHASE_POLICY)
}

const activity = (
    id: string,
    phase: LessonOutlineActivity["phase"],
    overrides: Partial<LessonOutlineActivity> = {},
): LessonOutlineActivity => ({
    id,
    kind: "explain",
    phase,
    isDiagnostic: false,
    outcomeIds: ["o1"],
    expectedEvidence: {},
    ...overrides,
})

const outline: LessonOutline = {
    outcomeIds: ["o1"],
    activities: [
        activity("diag", "challenge", { isDiagnostic: true }),
        activity("predict", "predict", { kind: "choice" }),
        activity("practice", "apply"),
        activity("final", "reflect"),
    ],
}

const attempt = (activityId: string, status: AttemptView["status"] = "graded") =>
    toAttemptView(
        attemptRowOf({
            activity_id: activityId,
            status,
            result: status === "graded" ? resultOf({ score: 1, maxScore: 1 }) : null,
        }),
    )

const latestOf = (...attempts: Array<AttemptView>): LatestByActivity =>
    new Map(attempts.map((entry) => [entry.activityId, entry]))

describe("phasesOf", () => {
    it("lists the six phases in order, a diagnostic done by any stored answer and a choice by a grade", async () => {
        const phasesOfLesson = await build()

        const phases = phasesOfLesson(outline, latestOf(attempt("diag", "failed"), attempt("predict")), false)

        expect(phases.map((phase) => `${phase.phase}:${phase.state}:${phase.done}/${phase.total}`)).toEqual([
            "challenge:done:1/1",
            "predict:done:1/1",
            "explore:open:0/0",
            "explain:open:0/0",
            "apply:open:0/1",
            "reflect:open:0/1",
        ])
    })

    it("does not finish a non-diagnostic activity that is only saved", async () => {
        const phasesOfLesson = await build()

        expect(phasesOfLesson(outline, latestOf(attempt("predict", "saved")), false)[1]?.state).toBe("open")
    })

    it("closes a phase without activities once the learner moved on", async () => {
        const phasesOfLesson = await build()

        const moved = phasesOfLesson(outline, latestOf(attempt("practice")), false)

        expect(moved.map((phase) => phase.state)).toEqual(["open", "open", "done", "done", "done", "open"])
    })

    it("closes every phase without activities when the lesson is complete", async () => {
        const phasesOfLesson = await build()

        const complete = phasesOfLesson(outline, latestOf(), true)

        expect(complete.filter((phase) => phase.total === 0).every((phase) => phase.state === "done")).toBe(true)
    })
})
