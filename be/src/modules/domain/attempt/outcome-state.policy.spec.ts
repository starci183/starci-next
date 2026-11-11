import { Test } from "@nestjs/testing"
import { attemptRowOf, resultOf } from "@tests/fixtures/builders/attempt.builder"
import type { LessonOutline, LessonOutlineActivity } from "@modules/domain/lesson"
import type { AttemptView } from "./attempt.contracts"
import { toAttemptView } from "./attempt.mapper"
import { isMasteryGrade, outcomeStateOf, type LatestByActivity } from "./outcome-state.policy"

const STATE_POLICY: unique symbol = Symbol("attempt.outcome-state-policy")
const policy = { isMasteryGrade, outcomeStateOf }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: STATE_POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get<typeof policy>(STATE_POLICY)
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

const attempt = (activityId: string, score: number, maxScore = 6, status: AttemptView["status"] = "graded") =>
    toAttemptView(
        attemptRowOf({
            activity_id: activityId,
            status,
            result: status === "graded" ? resultOf({ score, maxScore }) : null,
        }),
    )

const latestOf = (...attempts: Array<AttemptView>): LatestByActivity =>
    new Map(attempts.map((entry) => [entry.activityId, entry]))

describe("isMasteryGrade", () => {
    it.each([
        [4, 6, true],
        [6, 6, true],
        [3.5, 6, false],
        [2, 3, true],
        [0, 0, false],
    ])("is %s of %s: %s", async (score, max, expected) => {
        const { isMasteryGrade: isMastery } = await build()

        expect(isMastery(attempt("x", score, max))).toBe(expected)
    })

    it("is false for an attempt not graded and for none", async () => {
        const { isMasteryGrade: isMastery } = await build()

        expect(isMastery(attempt("x", 6, 6, "saved"))).toBe(false)
        expect(isMastery(undefined)).toBe(false)
    })
})

describe("outcomeStateOf", () => {
    it("is not started before an activity that counts was answered, a diagnostic does not count", async () => {
        const { outcomeStateOf: stateOf } = await build()

        expect(stateOf("o1", outline, latestOf(attempt("diag", 6)), false)).toBe("not-started")
    })

    it("is learning once the learner answered, even with a correct prediction alone", async () => {
        const { outcomeStateOf: stateOf } = await build()

        expect(stateOf("o1", outline, latestOf(attempt("predict", 1, 1)), false)).toBe("learning")
    })

    it("is mastered only when apply and reflect are both graded at 4 of 6 or more", async () => {
        const { outcomeStateOf: stateOf } = await build()
        const both = latestOf(attempt("practice", 4), attempt("final", 6))
        const oneLow = latestOf(attempt("practice", 4), attempt("final", 3))
        const oneMissing = latestOf(attempt("practice", 6))

        expect(stateOf("o1", outline, both, false)).toBe("mastered")
        expect(stateOf("o1", outline, oneLow, false)).toBe("learning")
        expect(stateOf("o1", outline, oneMissing, false)).toBe("learning")
    })

    it("needs review when the lesson ended without mastery, and stays mastered when it ended with it", async () => {
        const { outcomeStateOf: stateOf } = await build()

        expect(stateOf("o1", outline, latestOf(attempt("practice", 3), attempt("final", 3)), true)).toBe("needs-review")
        expect(stateOf("o1", outline, latestOf(attempt("practice", 5), attempt("final", 5)), true)).toBe("mastered")
    })

    it("cannot be mastered by an outcome that apply or reflect do not both train", async () => {
        const { outcomeStateOf: stateOf } = await build()
        const loose: LessonOutline = { outcomeIds: ["o1"], activities: [activity("practice", "apply")] }

        expect(stateOf("o1", loose, latestOf(attempt("practice", 6)), false)).toBe("learning")
    })
})
