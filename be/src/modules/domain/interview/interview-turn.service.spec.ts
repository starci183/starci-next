import { FakeClock, fakeTransaction, mock, mockEntityManager, type FakeTransaction } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER, SESSION, publicRowOf, sessionRowOf, turnRowOf } from "@tests/fixtures/builders/interview.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { InterviewAccessService } from "./interview-access.service"
import { INTERVIEW_COACH, type InterviewCoach } from "./interview-coach.port"
import { InterviewQuestionService } from "./interview-question.service"
import { InterviewTurnService } from "./interview-turn.service"
import { InterviewLogEvent } from "./interview.log-events"
import type { QuestionPublicRow, SessionRow, TurnRow } from "./persistence/interview.rows"
import type { TurnKind } from "./interview.contracts"
import {
    INSERT_TURN,
    SELECT_SESSION,
    SELECT_SESSION_FOR_UPDATE,
    SELECT_TURNS,
    TOUCH_SESSION,
    UPDATE_POSITION,
} from "./persistence/interview.sql"
import {
    LAST_QUESTION_WORDS_VI,
    LAYER_FOLLOW_UP_VI,
    LAYER_HINT_ONE_VI,
    LAYER_HINT_TWO_VI,
    LAYER_QUESTION_VI,
    SKIPPED_LINE_VI,
    THANKS_VI,
} from "@tests/fixtures/i18n/interview-spec.messages"

const NOW = new Date("2026-11-08T10:00:00.000Z")

const interviewer = (seq: number, kind: TurnKind, position = 0, content = "q"): TurnRow =>
    turnRowOf({ seq, kind, position, content })
const candidate = (
    seq: number,
    revision: number,
    content = "my answer",
    position = 0,
    kind: TurnKind = "answer",
): TurnRow => turnRowOf({ seq, role: "candidate", kind, position, content, revision })

interface Setup {
    readonly session?: SessionRow
    readonly turns?: ReadonlyArray<ReadonlyArray<TurnRow>>
    readonly inserts?: ReadonlyArray<TurnRow>
    readonly rows?: ReadonlyArray<QuestionPublicRow>
}

const build = async (setup: Setup = {}) => {
    const session = setup.session ?? sessionRowOf()
    const turnLists = (setup.turns ?? [[interviewer(0, "prompt")]]).map((list) => [SELECT_TURNS, list] as const)
    const inserts = (setup.inserts ?? [candidate(1, 0)]).map((row) => [INSERT_TURN, [row]] as const)
    const tx = fakeTransaction(
        mockEntityManager({
            query: [
                [SELECT_SESSION_FOR_UPDATE, [session]],
                [SELECT_SESSION, [session]],
                ...turnLists,
                ...inserts,
                [TOUCH_SESSION, []],
                [UPDATE_POSITION, []],
            ],
        }),
    )
    const access = mock<InterviewAccessService>()
    access.requireAiBudget.mockResolvedValue(undefined)
    const questions = mock<InterviewQuestionService>()
    questions.publicOf.mockResolvedValue([...(setup.rows ?? [publicRowOf()])])
    const coach = mock<InterviewCoach>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            InterviewTurnService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: INTERVIEW_COACH, useValue: coach },
            { provide: InterviewAccessService, useValue: access },
            { provide: InterviewQuestionService, useValue: questions },
        ],
    }).compile()
    return { service: moduleRef.get(InterviewTurnService), tx, access, questions, coach, logger }
}

const answer = {
    learnerId: LEARNER,
    sessionId: SESSION,
    position: 0,
    revision: 0,
    text: "  my answer  ",
    isSkipped: false,
}

const insertedKinds = (tx: FakeTransaction): ReadonlyArray<unknown> =>
    tx.em.query.mock.calls
        .filter((call) => call[0] === INSERT_TURN)
        .map((call): ReadonlyArray<unknown> => {
            const params: unknown = call[1]
            return Array.isArray(params) ? params.slice(2, 5) : []
        })

const TURNS_AFTER_ANSWER = [[interviewer(0, "prompt")], [interviewer(0, "prompt"), candidate(1, 0)]]
const WITH_NEXT = [
    publicRowOf(),
    publicRowOf({ question_id: "eq/1-behavioral/0", bank_id: "eq/1-behavioral", family: "behavioral" }),
]

describe("InterviewTurnService answer", () => {
    it("stores the answer first, asks the interviewer, and stores the follow-up it chose", async () => {
        const reply = interviewer(2, "followUp", 0, "Why that layer?")
        const { service, tx, coach, access } = await build({
            turns: [
                [interviewer(0, "prompt")],
                [interviewer(0, "prompt"), candidate(1, 0)],
                [interviewer(0, "prompt"), candidate(1, 0)],
            ],
            inserts: [candidate(1, 0), reply],
        })
        coach.decide.mockResolvedValue({ action: "followUp", text: "Why that layer?" })

        const view = await service.answer(answer)

        expect(view).toMatchObject({
            saved: { kind: "answer", content: "my answer" },
            next: { kind: "followUp", content: "Why that layer?" },
            status: "active",
            failureCode: null,
        })
        expect(insertedKinds(tx)).toEqual([
            ["candidate", "answer", "my answer"],
            ["interviewer", "followUp", "Why that layer?"],
        ])
        expect(access.requireAiBudget).toHaveBeenCalledWith(LEARNER)
        const asked = coach.decide.mock.calls[0]?.[0]
        expect(asked).toMatchObject({
            requestId: `${SESSION}:1`,
            locale: "vi",
            family: "technical",
            asked: 0,
            followUps: [LAYER_FOLLOW_UP_VI],
        })
        expect(asked?.transcript.map((turn) => turn.kind)).toEqual(["prompt", "answer"])
        expect(tx.commits).toBeGreaterThan(0)
    })

    it("moves to the next question when the interviewer says so and opens it with its authored prompt", async () => {
        const prompt = interviewer(2, "prompt", 1, "Next")
        const { service, tx, coach } = await build({
            turns: [
                [interviewer(0, "prompt")],
                [interviewer(0, "prompt"), candidate(1, 0)],
                [interviewer(0, "prompt"), candidate(1, 0)],
            ],
            inserts: [candidate(1, 0), prompt],
            rows: [
                publicRowOf(),
                publicRowOf({ question_id: "eq/1-behavioral/0", bank_id: "eq/1-behavioral", family: "behavioral" }),
            ],
        })
        coach.decide.mockResolvedValue({ action: "next", text: "" })

        const view = await service.answer(answer)

        expect(view.next).toMatchObject({ kind: "prompt", position: 1 })
        expect(tx.em.query).toHaveBeenCalledWith(UPDATE_POSITION, [SESSION, 1, NOW])
        expect(insertedKinds(tx)[1]).toEqual(["interviewer", "prompt", LAYER_QUESTION_VI])
    })
})

describe("InterviewTurnService answer (continued)", () => {
    it("closes the interview with the closing line after the last question, without any feedback", async () => {
        const last = sessionRowOf({ current_position: 1 })
        const done = interviewer(3, "done", 1, THANKS_VI)
        const { service, tx, coach } = await build({
            session: last,
            turns: [
                [interviewer(2, "prompt", 1)],
                [interviewer(2, "prompt", 1), candidate(3, 0, "x", 1)],
                [interviewer(2, "prompt", 1), candidate(3, 0, "x", 1)],
            ],
            inserts: [candidate(3, 0, "x", 1), done],
        })
        coach.decide.mockResolvedValue({ action: "next", text: "" })

        const view = await service.answer({ ...answer, position: 1, text: "x" })

        expect(view.next).toMatchObject({ kind: "done" })
        expect(insertedKinds(tx)[1]).toEqual(["interviewer", "done", expect.stringContaining(LAST_QUESTION_WORDS_VI)])
    })

    it("does not ask the model after two follow-ups; it moves on by itself", async () => {
        const turns = [
            interviewer(0, "prompt"),
            candidate(1, 0),
            interviewer(2, "followUp"),
            candidate(3, 1),
            interviewer(4, "probe"),
            candidate(5, 2),
        ]
        const { service, coach, access } = await build({
            turns: [turns.slice(0, 5), turns, turns],
            inserts: [candidate(5, 2), interviewer(6, "prompt", 1)],
        })

        const view = await service.answer({ ...answer, revision: 2 })

        expect(coach.decide).not.toHaveBeenCalled()
        expect(access.requireAiBudget).not.toHaveBeenCalled()
        expect(view.next).toMatchObject({ kind: "prompt", position: 1 })
    })

    it("stores a skip as a skip turn and moves on without asking the model", async () => {
        const { service, coach, tx } = await build({
            turns: [
                [interviewer(0, "prompt")],
                [interviewer(0, "prompt"), candidate(1, 0, SKIPPED_LINE_VI, 0, "skip")],
                [interviewer(0, "prompt"), candidate(1, 0, SKIPPED_LINE_VI, 0, "skip")],
            ],
            inserts: [candidate(1, 0, SKIPPED_LINE_VI, 0, "skip"), interviewer(2, "prompt", 1)],
        })

        const view = await service.answer({ ...answer, text: "", isSkipped: true })

        expect(coach.decide).not.toHaveBeenCalled()
        expect(insertedKinds(tx)[0]).toEqual(["candidate", "skip", SKIPPED_LINE_VI])
        expect(view.saved.kind).toBe("skip")
    })
})

describe("InterviewTurnService answer (continued) (continued)", () => {
    it("keeps the answer and moves on to the next authored question when the interviewer fails, whatever the failure", async () => {
        const known = await build({
            turns: [...TURNS_AFTER_ANSWER, TURNS_AFTER_ANSWER[1] ?? []],
            inserts: [candidate(1, 0), interviewer(2, "prompt", 1)],
            rows: WITH_NEXT,
        })
        known.coach.decide.mockRejectedValue(new InterviewError({ code: InterviewErrorCode.CoachUnconfigured }))
        const unknown = await build({
            turns: [...TURNS_AFTER_ANSWER, TURNS_AFTER_ANSWER[1] ?? []],
            inserts: [candidate(1, 0), interviewer(2, "prompt", 1)],
            rows: WITH_NEXT,
        })
        unknown.coach.decide.mockRejectedValue(new Error("boom"))

        await expect(known.service.answer(answer)).resolves.toMatchObject({
            saved: { content: "my answer" },
            next: { kind: "prompt", position: 1 },
            failureCode: null,
        })
        await expect(unknown.service.answer(answer)).resolves.toMatchObject({ next: { kind: "prompt", position: 1 } })
        expect(insertedKinds(known.tx)[1]).toEqual(["interviewer", "prompt", LAYER_QUESTION_VI])
        expect(known.logger.error).toHaveBeenCalledWith(InterviewLogEvent.ReplyFailed, expect.anything(), {
            sessionId: SESSION,
            code: "INTERVIEW_COACH_UNCONFIGURED",
        })
    })

    it("keeps the answer and moves on without asking the model at the daily cap", async () => {
        const { service, access, coach, tx } = await build({
            turns: [...TURNS_AFTER_ANSWER, TURNS_AFTER_ANSWER[1] ?? []],
            inserts: [candidate(1, 0), interviewer(2, "prompt", 1)],
            rows: WITH_NEXT,
        })
        access.requireAiBudget.mockRejectedValue(new InterviewError({ code: InterviewErrorCode.AiLimitReached }))

        await expect(service.answer(answer)).resolves.toMatchObject({ next: { kind: "prompt", position: 1 } })

        expect(coach.decide).not.toHaveBeenCalled()
        expect(insertedKinds(tx)[0]).toEqual(["candidate", "answer", "my answer"])
    })
})

describe("InterviewTurnService answer (continued) (continued) (continued)", () => {
    it("moves on when the question rows cannot be found or the session holds no such question", async () => {
        const gone = await build({
            turns: [...TURNS_AFTER_ANSWER, TURNS_AFTER_ANSWER[1] ?? []],
            inserts: [candidate(1, 0), interviewer(2, "done", 0)],
            rows: [],
        })
        const outside = await build({
            session: sessionRowOf({ questions: [] }),
            turns: [...TURNS_AFTER_ANSWER, TURNS_AFTER_ANSWER[1] ?? []],
            inserts: [candidate(1, 0), interviewer(2, "done", 0)],
        })

        await expect(gone.service.answer(answer)).resolves.toMatchObject({ next: { kind: "done" } })
        await expect(outside.service.answer(answer)).resolves.toMatchObject({ next: { kind: "done" } })
        expect(gone.coach.decide).not.toHaveBeenCalled()
    })

    it("answers the reply another call already stored instead of asking twice", async () => {
        const existing = interviewer(2, "followUp", 0, "already")
        const { service, coach, tx } = await build({
            turns: [
                [interviewer(0, "prompt")],
                [interviewer(0, "prompt"), candidate(1, 0)],
                [interviewer(0, "prompt"), candidate(1, 0), existing],
            ],
        })
        coach.decide.mockResolvedValue({ action: "probe", text: "again" })

        const view = await service.answer(answer)

        expect(view.next).toMatchObject({ content: "already" })
        expect(insertedKinds(tx)).toEqual([["candidate", "answer", "my answer"]])
    })

    it("answers the stored turn and its reply when the same revision is sent again with the same text", async () => {
        const turns = [interviewer(0, "prompt"), candidate(1, 0), interviewer(2, "followUp", 0, "Why?")]
        const { service, coach } = await build({ turns: [turns, turns] })

        const view = await service.answer(answer)

        expect(view).toMatchObject({ saved: { content: "my answer" }, next: { content: "Why?" } })
        expect(coach.decide).not.toHaveBeenCalled()
    })
})

describe("InterviewTurnService answer (continued) (continued) (continued) (continued)", () => {
    it("answers a resend with no reply yet as saved with nothing after it, and a reply that is not the interviewer's as nothing", async () => {
        const waiting = [interviewer(0, "prompt"), candidate(1, 0)]
        const twice = [interviewer(0, "prompt"), candidate(1, 0), candidate(2, 1, "again")]
        const a = await build({ turns: [waiting, waiting] })
        const b = await build({ turns: [twice, twice] })

        await expect(a.service.answer(answer)).resolves.toMatchObject({ next: null })
        await expect(b.service.answer(answer)).resolves.toMatchObject({ next: null })
    })

    it("refuses another answer under a stored revision with INTERVIEW_REVISION_CONFLICT", async () => {
        const { service } = await build({ turns: [[interviewer(0, "prompt"), candidate(1, 0, "different")]] })

        await expect(service.answer(answer)).rejects.toMatchObject({ code: "INTERVIEW_REVISION_CONFLICT" })
    })

    it.each([
        ["an empty answer", { text: "   " }, undefined],
        ["another question than the open one", { position: 1 }, undefined],
        ["a revision that skips one", { revision: 1 }, undefined],
        [
            "an answer while the interviewer's reply is pending",
            {},
            [[interviewer(0, "prompt"), candidate(1, 0, "x", 0)]],
        ],
    ])("refuses %s with INTERVIEW_ANSWER_INVALID and stores nothing", async (_case, over, turns) => {
        const { service, tx } = await build({ turns: turns ?? [[interviewer(0, "prompt")]] })

        const request = turns === undefined ? { ...answer, ...over } : { ...answer, revision: 1, ...over }
        await expect(service.answer(request)).rejects.toMatchObject({ code: "INTERVIEW_ANSWER_INVALID" })
        expect(insertedKinds(tx)).toEqual([])
    })

    it("does not find a session that is not there and refuses a session that is closed", async () => {
        const closed = await build({ session: sessionRowOf({ status: "submitted" }) })
        const gone = await build()
        gone.tx.em.query.mockImplementationOnce(() => Promise.resolve([]))

        await expect(closed.service.answer(answer)).rejects.toMatchObject({ code: "INTERVIEW_SESSION_CLOSED" })
        await expect(gone.service.answer(answer)).rejects.toMatchObject({ code: "INTERVIEW_SESSION_NOT_FOUND" })
    })

    it("fails with INTERVIEW_REVISION_CONFLICT when the database refuses the candidate turn as a duplicate", async () => {
        const { service, tx } = await build({ inserts: [] })
        tx.em.query.mockImplementation((statement: string) =>
            Promise.resolve(
                statement === SELECT_SESSION_FOR_UPDATE
                    ? [sessionRowOf()]
                    : statement === SELECT_TURNS
                      ? [interviewer(0, "prompt")]
                      : [],
            ),
        )

        await expect(service.answer(answer)).rejects.toMatchObject({ code: "INTERVIEW_REVISION_CONFLICT" })
    })
})

describe("InterviewTurnService hint", () => {
    it("gives the next authored hint, records it and says how many are left", async () => {
        const { service, tx } = await build({
            turns: [[interviewer(0, "prompt")]],
            inserts: [turnRowOf({ seq: 1, kind: "hint", content: LAYER_HINT_ONE_VI, turn_id: "hint-1" })],
        })

        await expect(service.hint(LEARNER, SESSION, 0)).resolves.toEqual({
            turnId: "hint-1",
            text: LAYER_HINT_ONE_VI,
            hintsUsed: 1,
            hintsLeft: 1,
        })
        expect(insertedKinds(tx)).toEqual([["interviewer", "hint", LAYER_HINT_ONE_VI]])
        expect(tx.em.query).toHaveBeenCalledWith(TOUCH_SESSION, [SESSION, NOW])
    })

    it("gives the second hint after the first and refuses when none is left", async () => {
        const used = [interviewer(0, "prompt"), interviewer(1, "hint")]
        const second = await build({
            turns: [used],
            inserts: [turnRowOf({ seq: 2, kind: "hint", content: LAYER_HINT_TWO_VI, turn_id: "hint-2" })],
        })
        const none = await build({ turns: [[...used, interviewer(2, "hint")]] })
        const empty = await build({ turns: [[interviewer(0, "prompt")]], rows: [] })

        await expect(second.service.hint(LEARNER, SESSION, 0)).resolves.toMatchObject({
            text: LAYER_HINT_TWO_VI,
            hintsLeft: 0,
        })
        await expect(none.service.hint(LEARNER, SESSION, 0)).rejects.toMatchObject({ code: "INTERVIEW_HINT_NONE_LEFT" })
        await expect(empty.service.hint(LEARNER, SESSION, 0)).rejects.toMatchObject({
            code: "INTERVIEW_HINT_NONE_LEFT",
        })
    })

    it("refuses a hint for a question that is not the open one", async () => {
        const { service } = await build()

        await expect(service.hint(LEARNER, SESSION, 1)).rejects.toMatchObject({ code: "INTERVIEW_ANSWER_INVALID" })
    })
})

describe("InterviewTurnService retry", () => {
    it("asks the interviewer again for the turn a failure skipped, without a second answer", async () => {
        const waiting = [interviewer(0, "prompt"), candidate(1, 0)]
        const { service, coach, tx } = await build({
            turns: [waiting, waiting, waiting],
            inserts: [interviewer(2, "probe", 0, "Be specific.")],
        })
        coach.decide.mockResolvedValue({ action: "probe", text: "Be specific." })

        await expect(service.retry(LEARNER, SESSION)).resolves.toMatchObject({
            saved: { content: "my answer" },
            next: { kind: "probe" },
            failureCode: null,
        })
        expect(insertedKinds(tx)).toEqual([["interviewer", "probe", "Be specific."]])
    })

    it("has nothing to retry when the last turn is the interviewer's or the session is empty", async () => {
        const settled = await build({ turns: [[interviewer(0, "prompt")]] })
        const empty = await build({ turns: [[]] })

        await expect(settled.service.retry(LEARNER, SESSION)).rejects.toMatchObject({
            code: "INTERVIEW_NOTHING_TO_RETRY",
        })
        await expect(empty.service.retry(LEARNER, SESSION)).rejects.toMatchObject({
            code: "INTERVIEW_NOTHING_TO_RETRY",
        })
    })

    it("does not find another learner's session and refuses a closed one", async () => {
        const closed = await build({ session: sessionRowOf({ status: "graded" }) })
        const gone = await build()
        gone.tx.em.query.mockImplementationOnce(() => Promise.resolve([]))

        await expect(closed.service.retry(LEARNER, SESSION)).rejects.toMatchObject({ code: "INTERVIEW_SESSION_CLOSED" })
        await expect(gone.service.retry(LEARNER, SESSION)).rejects.toMatchObject({
            code: "INTERVIEW_SESSION_NOT_FOUND",
        })
    })
})
