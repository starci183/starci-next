import { DEFAULT_INTERVIEW_SETTINGS } from "./interview.config"
import type { InterviewSettings } from "./interview.options"
import { FakeClock, fakeTransaction, mock, mockEntityManager, builder } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER, SESSION, publicRowOf, sessionRowOf, turnRowOf } from "@tests/fixtures/builders/interview.builder"
import { LessonLinkService } from "@modules/domain/lesson"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { InterviewAccessService, type InterviewAccess } from "./interview-access.service"
import { InterviewQuestionService } from "./interview-question.service"
import { InterviewSessionService, type StartParams } from "./interview-session.service"
import { INTERVIEW_RESOLVED_OPTIONS } from "./interview.decorators"
import {
    ABANDON_IDLE,
    ABANDON_SESSION,
    INSERT_SESSION,
    INSERT_TURN,
    LOCK_LEARNER,
    SELECT_ACTIVE_SESSION,
    SELECT_POOL,
    SELECT_PREVIOUS_SCORE,
    SELECT_RECENT_QUESTIONS,
    SELECT_SESSION,
    SELECT_SESSION_BY_REQUEST,
    SELECT_TURNS,
} from "./persistence/interview.sql"
import { LAYER_QUESTION_VI } from "@tests/fixtures/i18n/interview-spec.messages"
import { firstParamsOf, scorecardOf, storedJsonOf } from "@tests/fixtures/builders/interview-stub.builder"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const FRAMEWORK = "0-fullstack-mastery/0-framework-foundation"

const poolRow = (id: string, family: "technical" | "behavioral", bank = FRAMEWORK, over: object = {}) => ({
    question_id: id,
    bank_id: bank,
    bank_version: "v1",
    family,
    tier: "junior",
    is_premium: false,
    body_languages: ["agnostic"],
    ...over,
})

const POOL = [
    poolRow(`${FRAMEWORK}/0`, "technical"),
    poolRow(`${FRAMEWORK}/1`, "technical"),
    poolRow("eq/1-behavioral/0", "behavioral", "eq/1-behavioral"),
]

const accessOf = (over: Partial<InterviewAccess> = {}): InterviewAccess => ({
    isPremium: false,
    freeSessionsLeftThisMonth: 1,
    resetsAt: "2026-11-30T17:00:00.000Z",
    length: 3,
    freeMonth: "2026-11",
    ...over,
})

const startOf = (over: Partial<StartParams> = {}): StartParams => ({
    learnerId: LEARNER,
    track: "backend-fullstack",
    bankIds: null,
    tier: "junior",
    locale: "vi",
    language: null,
    clientRequestId: "request-0001",
    ...over,
})

type Stub = readonly [string, unknown]

const build = async (stubs: ReadonlyArray<Stub>, access = accessOf()) => {
    const tx = fakeTransaction(mockEntityManager({ query: [[ABANDON_IDLE, []], ...stubs] }))
    const accessService = mock<InterviewAccessService>()
    accessService.accessOf.mockResolvedValue(access)
    const questions = mock<InterviewQuestionService>()
    questions.publicOf.mockResolvedValue([
        publicRowOf(),
        publicRowOf({ question_id: "eq/1-behavioral/0", bank_id: "eq/1-behavioral", family: "behavioral" }),
    ])
    const lessons = mock<LessonLinkService>()
    lessons.ofModules.mockResolvedValue({ "0-core": [{ lessonId: "l", topic: "t", title: "L" }] })
    const moduleRef = await Test.createTestingModule({
        providers: [
            InterviewSessionService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: INTERVIEW_RESOLVED_OPTIONS, useValue: builder<InterviewSettings>(DEFAULT_INTERVIEW_SETTINGS)() },
            { provide: InterviewAccessService, useValue: accessService },
            { provide: InterviewQuestionService, useValue: questions },
            { provide: LessonLinkService, useValue: lessons },
        ],
    }).compile()
    return { service: moduleRef.get(InterviewSessionService), tx, accessService, questions, lessons }
}

const startStubs = (over: Readonly<Record<string, unknown>> = {}): ReadonlyArray<Stub> =>
    Object.entries({
        [LOCK_LEARNER]: [],
        [SELECT_SESSION_BY_REQUEST]: [],
        [SELECT_ACTIVE_SESSION]: [],
        [SELECT_POOL]: POOL,
        [SELECT_RECENT_QUESTIONS]: [{ question_id: `${FRAMEWORK}/9` }],
        [INSERT_SESSION]: [sessionRowOf()],
        [INSERT_TURN]: [turnRowOf()],
        [SELECT_SESSION]: [sessionRowOf()],
        [SELECT_TURNS]: [turnRowOf()],
        ...over,
    })

describe("InterviewSessionService start", () => {
    it("draws the questions once, stores the session and the first prompt, and answers the session without any AI call", async () => {
        const { service, tx, questions } = await build(startStubs(), accessOf({ isPremium: true, length: 3 }))

        const view = await service.start(startOf())

        expect(view.sessionId).toBe(SESSION)
        const inserted = firstParamsOf(tx.em, INSERT_SESSION)
        expect(inserted.slice(0, 9)).toEqual([
            LEARNER,
            "request-0001",
            "backend-fullstack",
            "junior",
            "vi",
            null,
            3,
            "premium",
            null,
        ])
        expect(storedJsonOf(inserted, 9)).toMatchObject([
            { family: "technical" },
            { family: "technical" },
            { family: "behavioral" },
        ])
        expect(firstParamsOf(tx.em, INSERT_TURN)).toEqual([
            SESSION,
            0,
            "interviewer",
            "prompt",
            LAYER_QUESTION_VI,
            null,
            false,
            NOW,
        ])
        expect(firstParamsOf(tx.em, SELECT_POOL)).toEqual([
            "junior",
            false,
            expect.arrayContaining([FRAMEWORK, "eq/%"]),
            1000,
        ])
        expect(questions.publicOf).toHaveBeenCalledTimes(2)
        expect(tx.commits).toBe(1)
    })

    it("draws a free session from the free questions only and counts it in the month", async () => {
        const { service, tx } = await build(startStubs())

        await service.start(startOf({ bankIds: [FRAMEWORK, "eq/1-behavioral"] }))

        const inserted = firstParamsOf(tx.em, INSERT_SESSION)
        expect(inserted.slice(7, 9)).toEqual(["free", "2026-11"])
        expect(firstParamsOf(tx.em, SELECT_POOL)[1]).toBe(true)
    })
})

describe("InterviewSessionService start (continued)", () => {
    it("leaves out banks the learner did not pick and banks outside the track's pool for the tier", async () => {
        const outside = poolRow(
            "0-fullstack-mastery/9-background-jobs-and-workers/0",
            "technical",
            "0-fullstack-mastery/9-background-jobs-and-workers",
        )
        const { service } = await build(startStubs({ [SELECT_POOL]: [...POOL, outside] }))

        await expect(service.start(startOf({ bankIds: ["eq/1-behavioral"] }))).rejects.toMatchObject({
            code: "INTERVIEW_POOL_EMPTY",
        })
        await expect(service.start(startOf())).resolves.toBeDefined()
    })

    it("answers the session a resend of the same request id already started, drawing and storing nothing", async () => {
        const { service, tx } = await build([
            [LOCK_LEARNER, []],
            [SELECT_SESSION_BY_REQUEST, [sessionRowOf()]],
            [SELECT_SESSION, [sessionRowOf()]],
            [SELECT_TURNS, []],
        ])

        await expect(service.start(startOf())).resolves.toMatchObject({ sessionId: SESSION })
        expect(tx.em.query.mock.calls.some((call) => call[0] === INSERT_SESSION)).toBe(false)
    })

    it.each([
        ["an unknown track", () => startOf({ track: "nope" })],
        ["a tier the track does not offer", () => startOf({ track: "system-design-senior", tier: "junior" })],
        ["a tier that does not exist", () => Object.assign(startOf(), { tier: "expert" })],
    ])("refuses %s as INTERVIEW_SETUP_INVALID before touching the database", async (_case, paramsOf) => {
        const { service, tx } = await build([])

        await expect(service.start(paramsOf())).rejects.toMatchObject({ code: "INTERVIEW_SETUP_INVALID" })
        expect(tx.em.query).not.toHaveBeenCalled()
    })
})

describe("InterviewSessionService start (continued) (continued)", () => {
    it("refuses while a session is in progress, and for a free learner who used the month's session", async () => {
        const active = await build(startStubs({ [SELECT_ACTIVE_SESSION]: [sessionRowOf()] }))
        const spent = await build(startStubs(), accessOf({ freeSessionsLeftThisMonth: 0 }))

        await expect(active.service.start(startOf())).rejects.toMatchObject({ code: "INTERVIEW_SESSION_ACTIVE" })
        await expect(spent.service.start(startOf())).rejects.toMatchObject({ code: "INTERVIEW_PREMIUM_REQUIRED" })
        expect(spent.tx.em.query.mock.calls.some((call) => call[0] === SELECT_POOL)).toBe(false)
        expect(spent.tx.rollbacks).toBe(1)
    })

    it("refuses with INTERVIEW_POOL_EMPTY when the banks hold too few questions, and when a concurrent start took the slot", async () => {
        const empty = await build(startStubs({ [SELECT_POOL]: [] }))
        const raced = await build(startStubs({ [INSERT_SESSION]: [] }))

        await expect(empty.service.start(startOf())).rejects.toMatchObject({ code: "INTERVIEW_POOL_EMPTY" })
        await expect(raced.service.start(startOf())).rejects.toMatchObject({ code: "INTERVIEW_SESSION_ACTIVE" })
    })
})

describe("InterviewSessionService read", () => {
    it("reads the session with its turns and questions; a session that is not graded links no lesson", async () => {
        const { service, lessons } = await build([
            [SELECT_SESSION, [sessionRowOf()]],
            [SELECT_TURNS, [turnRowOf()]],
        ])

        const view = await service.read(LEARNER, SESSION)

        expect(view).toMatchObject({ sessionId: SESSION, status: "active", scorecard: null })
        expect(lessons.ofModules).toHaveBeenCalledWith([], "vi")
    })

    it("links the lessons of the banks' modules once graded, in the locale of the session", async () => {
        const { service, lessons } = await build([
            [
                SELECT_SESSION,
                [
                    sessionRowOf({
                        status: "graded",
                        locale: "en",
                        scorecard: scorecardOf(70),
                        graded_at: new Date("2026-11-08T11:00:00.000Z"),
                    }),
                ],
            ],
            [SELECT_TURNS, []],
            [SELECT_PREVIOUS_SCORE, [{ overall_score: 61 }]],
        ])

        const view = await service.read(LEARNER, SESSION)

        expect(view.previousScore).toBe(61)
        expect(lessons.ofModules).toHaveBeenCalledWith(["0-core"], "en")
        expect(view.lessons).toEqual({ "0-core": [{ lessonId: "l", topic: "t", title: "L" }] })
    })

    it("has no previous score when the learner graded no earlier session on the track and tier", async () => {
        const { service } = await build([
            [
                SELECT_SESSION,
                [
                    sessionRowOf({
                        status: "graded",
                        scorecard: scorecardOf(70),
                        graded_at: new Date("2026-11-08T11:00:00.000Z"),
                    }),
                ],
            ],
            [SELECT_TURNS, []],
            [SELECT_PREVIOUS_SCORE, []],
        ])

        await expect(service.read(LEARNER, SESSION)).resolves.toMatchObject({ previousScore: null })
    })

    it("does not find a session of another learner", async () => {
        const { service } = await build([[SELECT_SESSION, []]])

        await expect(service.read(LEARNER, SESSION)).rejects.toMatchObject({ code: "INTERVIEW_SESSION_NOT_FOUND" })
    })
})

describe("InterviewSessionService abandon", () => {
    it("abandons the active session of the learner", async () => {
        const { service, tx } = await build([[ABANDON_SESSION, [sessionRowOf({ status: "abandoned" })]]])

        await expect(service.abandon(LEARNER, SESSION)).resolves.toEqual({ sessionId: SESSION, status: "abandoned" })
        expect(tx.em.query).toHaveBeenCalledWith(ABANDON_SESSION, [LEARNER, SESSION, NOW])
    })

    it("does not find a session that is not active or not theirs", async () => {
        const { service } = await build([[ABANDON_SESSION, []]])

        await expect(service.abandon(LEARNER, SESSION)).rejects.toMatchObject({ code: "INTERVIEW_SESSION_NOT_FOUND" })
    })
})
