import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction, MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { CourseError, CourseErrorCode } from "./errors/course.error"
import { CourseCaseService } from "./course-case.service"
import { CourseLabService } from "./course-lab.service"
import type { CaseHintEvent, CaseResetEvent, CaseResultEvent } from "@modules/platform/relay-protocol"
import { labRecordFixture } from "./course-lab.testing"
import { courseLabCheckOf } from "./course-lab-record.policy"
import {
    INSERT_CASE_RUN,
    LOCK_COURSE_LAB,
    MARK_CASE_GREEN,
    MARK_CASE_HINT,
    MARK_CASE_RESET,
    SELECT_CASE_MARKS,
    SELECT_LATEST_CASE_RUNS,
} from "./persistence/course.sql"

const NOW = "2026-11-25T02:00:00.000Z"
const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const LESSON = "saga-compensation"
const EVENT = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"

const checked = courseLabCheckOf(LESSON, labRecordFixture())
if (!checked.ok) throw new Error(checked.refusal)
const LAB = { version: "abc123def456", record: checked.record }

const marks = (...rows: Array<[string, number, boolean]>) =>
    rows.map(([case_id, hints_opened, ever_green]) => ({ case_id, hints_opened, ever_green }))

const greenThroughHappy = marks(["h1", 0, true], ["h2", 0, true])

interface World {
    readonly service: CourseCaseService
    readonly tx: FakeTransaction
    readonly labs: MockOf<CourseLabService>
}

const world = async (
    query: ReadonlyArray<readonly [string, unknown]> = [],
    marksRows: unknown = [],
): Promise<World> => {
    const answers = new Map<string, unknown>([
        [LOCK_COURSE_LAB, [{ locked: "" }]],
        [SELECT_CASE_MARKS, marksRows],
        [SELECT_LATEST_CASE_RUNS, []],
        [INSERT_CASE_RUN, [{ event_id: EVENT }]],
        [MARK_CASE_GREEN, []],
        [MARK_CASE_HINT, []],
        [MARK_CASE_RESET, []],
        ...query,
    ])
    const tx = fakeTransaction(mockEntityManager({ query: [...answers].map(([sql, rows]) => [sql, rows] as const) }))
    const labs = mock<CourseLabService>()
    labs.readable.mockResolvedValue(LAB)
    labs.live.mockResolvedValue(LAB)
    const moduleRef = await Test.createTestingModule({
        providers: [
            CourseCaseService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: CourseLabService, useValue: labs },
        ],
    }).compile()
    return { service: moduleRef.get(CourseCaseService), tx, labs }
}

const writes = (tx: FakeTransaction): Array<unknown> => tx.committedWrites.map((write) => write.args[0])

const resultOf = (over: Partial<CaseResultEvent> = {}): CaseResultEvent => ({
    type: "case.result",
    lessonId: LESSON,
    caseId: "h1",
    kind: "happy",
    status: "green",
    ranAt: NOW,
    durationMs: 800,
    learnerCommit: "c".repeat(40),
    chaos: {},
    upTo: [{ caseId: "h1", status: "green" }],
    ...over,
})

const code = (value: CourseErrorCode) => expect.objectContaining({ code: value })

describe("CourseCaseService cases", () => {
    it("reads the lab as the learner may, then answers the cases with their newest runs", async () => {
        const { service, labs } = await world(
            [
                [
                    SELECT_LATEST_CASE_RUNS,
                    [
                        {
                            case_id: "h1",
                            status: "red",
                            ran_at: new Date(NOW),
                            duration_ms: 700,
                            learner_commit: "d".repeat(40),
                            failed: { invariant: "order-cancelled", message: "still pending", expected: "cancelled" },
                        },
                    ],
                ],
            ],
            marks(["h1", 0, true]),
        )

        const view = await service.cases(LEARNER, LESSON)

        expect(labs.readable).toHaveBeenCalledWith(LEARNER, LESSON)
        expect(view.currentCaseId).toBe("h2")
        expect(view.cases[0]).toMatchObject({
            caseId: "h1",
            status: "red",
            everGreen: true,
            diffAvailable: true,
            lastRun: {
                ranAt: NOW,
                durationMs: 700,
                failed: { invariant: "order-cancelled", message: "still pending", expected: "cancelled", actual: null },
            },
        })
        expect(view.cases[2]).toMatchObject({ caseId: "u1", status: "locked" })
    })

    it("does not answer a lab the learner may not read", async () => {
        const { service, labs } = await world()
        labs.readable.mockRejectedValue(new CourseError({ code: CourseErrorCode.PremiumRequired }))

        await expect(service.cases(LEARNER, LESSON)).rejects.toEqual(code(CourseErrorCode.PremiumRequired))
    })
})

describe("CourseCaseService openHint", () => {
    it("opens level 1 on an open case, stores it, and answers its text in the asked locale", async () => {
        const { service, tx } = await world([], greenThroughHappy)

        await expect(service.openHint(LEARNER, LESSON, "u1", 1, "en")).resolves.toEqual({
            caseId: "u1",
            level: 1,
            text: "hint 1",
        })

        expect(writes(tx)).toEqual([MARK_CASE_HINT])
        expect(tx.committedWrites[0]?.args[1]).toEqual([LEARNER, LESSON, "u1", 1, expect.anything()])
    })

    it("opens level 2 only after level 1 and level 3 only after level 2", async () => {
        const second = await world([], marks(["h1", 0, true], ["h2", 0, true], ["u1", 1, false]))
        await expect(second.service.openHint(LEARNER, LESSON, "u1", 2, "vi")).resolves.toMatchObject({
            level: 2,
            text: "gợi ý 2",
        })

        const skipped = await world([], greenThroughHappy)
        await expect(skipped.service.openHint(LEARNER, LESSON, "u1", 3, "vi")).rejects.toEqual(
            code(CourseErrorCode.HintOutOfOrder),
        )
        expect(writes(skipped.tx)).toEqual([])
    })

    it("answers an open level again without storing anything", async () => {
        const { service, tx } = await world([], marks(["h1", 0, true], ["h2", 0, true], ["u1", 2, false]))

        await expect(service.openHint(LEARNER, LESSON, "u1", 1, "vi")).resolves.toMatchObject({ text: "gợi ý 1" })
        expect(writes(tx)).toEqual([])
    })

    it("refuses a locked case, an unknown case and a level the case does not have", async () => {
        const locked = await world([], marks(["h1", 0, true]))
        await expect(locked.service.openHint(LEARNER, LESSON, "u1", 1, "vi")).rejects.toEqual(
            code(CourseErrorCode.CaseLocked),
        )

        const unknown = await world()
        await expect(unknown.service.openHint(LEARNER, LESSON, "nope", 1, "vi")).rejects.toEqual(
            code(CourseErrorCode.CaseNotFound),
        )

        const open = await world([], marks(["h1", 0, true], ["h2", 0, true], ["u1", 0, true]))
        await expect(open.service.openHint(LEARNER, LESSON, "u2", 2, "vi")).rejects.toEqual(
            code(CourseErrorCode.HintNotFound),
        )
        await expect(open.service.openHint(LEARNER, LESSON, "h1", 1, "vi")).rejects.toEqual(
            code(CourseErrorCode.HintNotFound),
        )
        expect(writes(locked.tx)).toEqual([])
    })
})

describe("CourseCaseService recordCaseResult", () => {
    it("stores a green run and marks an open case ever green", async () => {
        const { service, tx } = await world()

        await expect(service.recordCaseResult(LEARNER, EVENT, resultOf())).resolves.toEqual({ recorded: true })

        expect(writes(tx)).toEqual([INSERT_CASE_RUN, MARK_CASE_GREEN])
        expect(tx.committedWrites[0]?.args[1]).toEqual([
            LEARNER,
            LESSON,
            "h1",
            "happy",
            "green",
            NOW,
            800,
            "c".repeat(40),
            "{}",
            JSON.stringify([{ caseId: "h1", status: "green" }]),
            null,
            EVENT,
            expect.anything(),
        ])
    })

    it("stores a red run with its failure and marks nothing", async () => {
        const { service, tx } = await world()
        const failed = { invariant: "order-cancelled", message: "still pending", expected: "cancelled", actual: "pending" }

        await service.recordCaseResult(LEARNER, EVENT, resultOf({ status: "red", failed }))

        expect(writes(tx)).toEqual([INSERT_CASE_RUN])
        expect(tx.committedWrites[0]?.args[1]).toContain(JSON.stringify(failed))
    })

    it("changes nothing when the same client event comes again", async () => {
        const { service, tx } = await world([[INSERT_CASE_RUN, []]])

        await expect(service.recordCaseResult(LEARNER, EVENT, resultOf())).resolves.toEqual({ recorded: false })

        expect(writes(tx)).toEqual([INSERT_CASE_RUN])
    })

    it("keeps a green run of a locked case but never lets it open the next one", async () => {
        const { service, tx } = await world()

        await expect(
            service.recordCaseResult(LEARNER, EVENT, resultOf({ caseId: "u2", kind: "unhappy" })),
        ).resolves.toEqual({ recorded: true })

        expect(writes(tx)).toEqual([INSERT_CASE_RUN])
    })

    it("refuses a case the lab does not have, the wrong kind and a lesson without a lab", async () => {
        const { service, labs, tx } = await world()

        await expect(service.recordCaseResult(LEARNER, EVENT, resultOf({ caseId: "nope" }))).rejects.toEqual(
            code(CourseErrorCode.PayloadInvalid),
        )
        await expect(service.recordCaseResult(LEARNER, EVENT, resultOf({ kind: "unhappy" }))).rejects.toEqual(
            code(CourseErrorCode.PayloadInvalid),
        )
        await expect(service.recordCaseResult(LEARNER, EVENT, resultOf({ caseId: "u9" }))).rejects.toEqual(
            code(CourseErrorCode.PayloadInvalid),
        )
        labs.live.mockResolvedValue(null)
        await expect(service.recordCaseResult(LEARNER, EVENT, resultOf())).rejects.toEqual(
            code(CourseErrorCode.LessonNotFound),
        )
        expect(writes(tx)).toEqual([])
    })
})

describe("CourseCaseService recordHint", () => {
    const hint = (level: 1 | 2 | 3): CaseHintEvent => ({ type: "case.hint", lessonId: LESSON, caseId: "u1", level, at: NOW })

    it("records the next level and reports it new", async () => {
        const { service, tx } = await world([], greenThroughHappy)

        await expect(service.recordHint(LEARNER, hint(1))).resolves.toEqual({ recorded: true })

        expect(writes(tx)).toEqual([MARK_CASE_HINT])
    })

    it("does nothing for a level already open and refuses a level out of order, a locked case and a missing level", async () => {
        const open = await world([], marks(["h1", 0, true], ["h2", 0, true], ["u1", 1, false]))
        await expect(open.service.recordHint(LEARNER, hint(1))).resolves.toEqual({ recorded: false })
        expect(writes(open.tx)).toEqual([])
        await expect(open.service.recordHint(LEARNER, hint(3))).rejects.toEqual(code(CourseErrorCode.HintOutOfOrder))

        const locked = await world()
        await expect(locked.service.recordHint(LEARNER, hint(1))).rejects.toEqual(code(CourseErrorCode.CaseLocked))

        const missing = await world([], greenThroughHappy)
        await expect(
            missing.service.recordHint(LEARNER, { ...hint(1), caseId: "u3" }),
        ).rejects.toEqual(code(CourseErrorCode.CaseLocked))
        const none = await world([], marks(["h1", 0, true], ["h2", 0, true], ["u1", 0, true]))
        await expect(none.service.recordHint(LEARNER, { ...hint(2), caseId: "u2" })).rejects.toEqual(
            code(CourseErrorCode.PayloadInvalid),
        )
    })
})

describe("CourseCaseService recordReset", () => {
    const reset = (caseId: string): CaseResetEvent => ({
        type: "case.reset",
        lessonId: LESSON,
        caseId,
        stashedBranch: `cua-toi-luu-${caseId}`,
        at: NOW,
    })

    it("records the branch the learner's work was stashed under for an unhappy case with a reference", async () => {
        const { service, tx } = await world()

        await expect(service.recordReset(LEARNER, reset("u1"))).resolves.toEqual({ recorded: true })

        expect(writes(tx)).toEqual([MARK_CASE_RESET])
        expect(tx.committedWrites[0]?.args[1]).toEqual([LEARNER, LESSON, "u1", "cua-toi-luu-u1", NOW, expect.anything()])
    })

    it("refuses a reset of a happy case, of an unhappy case without a reference, or of an unknown case", async () => {
        const { service, tx } = await world()

        await expect(service.recordReset(LEARNER, reset("h1"))).rejects.toEqual(code(CourseErrorCode.PayloadInvalid))
        await expect(service.recordReset(LEARNER, reset("u3"))).rejects.toEqual(code(CourseErrorCode.PayloadInvalid))
        await expect(service.recordReset(LEARNER, reset("nope"))).rejects.toEqual(code(CourseErrorCode.CaseNotFound))
        expect(writes(tx)).toEqual([])
    })
})
