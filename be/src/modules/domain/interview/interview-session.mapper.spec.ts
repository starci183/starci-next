import { Test } from "@nestjs/testing"
import { publicRowOf, sessionRowOf, turnRowOf } from "@tests/fixtures/builders/interview.builder"
import {
    toEvidenceItem,
    toHistoryItem,
    toQuestionView,
    toSessionView,
    toSetup,
    toTranscript,
    toModuleLessons,
    toTrends,
    toTurnView,
} from "./interview-session.mapper"
import type { HistoryRow } from "./persistence/interview.rows"
import { LAYER_QUESTION_VI } from "@tests/fixtures/i18n/interview-spec.messages"
import { scorecardOf } from "@tests/fixtures/builders/interview-stub.builder"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = {
    toEvidenceItem,
    toModuleLessons,
    toHistoryItem,
    toQuestionView,
    toSessionView,
    toSetup,
    toTranscript,
    toTrends,
    toTurnView,
}

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.interview-session.mapper")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const card = scorecardOf(80)

const history = (over: Partial<HistoryRow>): HistoryRow => ({
    session_id: "s",
    track: "backend-fullstack",
    tier: "junior",
    started_at: new Date("2026-11-08T10:00:00.000Z"),
    status: "graded",
    overall_score: 70,
    verdict: "pass",
    ...over,
})

describe("interview session mapper", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads the setup, a turn and a question without anything used for grading", () => {
        expect(subject.toSetup(sessionRowOf())).toEqual({
            track: "backend-fullstack",
            tier: "junior",
            locale: "vi",
            language: null,
            length: 2,
            access: "premium",
        })
        const turn = turnRowOf()
        expect(subject.toTurnView(turn)).toMatchObject({
            turnId: turn.turn_id,
            role: "interviewer",
            kind: "prompt",
            revision: null,
            createdAt: "2026-11-08T10:00:01.000Z",
        })
        const view = subject.toQuestionView(publicRowOf(), 0, "agnostic", "en")
        expect(view).toMatchObject({
            bankTitle: "Bank",
            prompt: "Where does this logic belong?",
            givenCode: "const a = 1",
            hintCount: 2,
            bodyLanguage: "agnostic",
        })
        expect(JSON.stringify(view)).not.toMatch(/ideal|checklist|rubric|keywords|ownership/iu)
    })

    it("shows no scorecard, lessons or grading model before the session is graded, whatever the row holds", () => {
        const row = sessionRowOf({
            status: "submitted",
            scorecard: card,
            graded_by: { profile: "interview", model: "m", usedFallback: false },
            failure_code: "X",
        })

        const view = subject.toSessionView(
            row,
            [turnRowOf()],
            [publicRowOf()],
            { "0-core": [{ lessonId: "l", topic: "t", title: "L" }] },
            61,
        )

        expect(view).toMatchObject({
            scorecard: null,
            lessons: {},
            gradedBy: null,
            previousScore: null,
            failureCode: "X",
            gradedAt: null,
            status: "submitted",
        })
        expect(view.questions).toHaveLength(1)
        expect(view.turns).toHaveLength(1)
    })
})

describe("interview session mapper (continued)", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("shows the scorecard, the lessons and the grading model once graded", () => {
        const gradedBy = { profile: "interview", model: "m", usedFallback: true }
        const row = sessionRowOf({
            status: "graded",
            scorecard: card,
            graded_by: gradedBy,
            graded_at: new Date("2026-11-08T11:00:00.000Z"),
        })

        const view = subject.toSessionView(
            row,
            [],
            [publicRowOf()],
            { "0-core": [{ lessonId: "l", topic: "t", title: "L" }] },
            61,
        )

        expect(view).toMatchObject({
            scorecard: card,
            gradedBy,
            gradedAt: "2026-11-08T11:00:00.000Z",
            lessons: { "0-core": [{ lessonId: "l", topic: "t", title: "L" }] },
            previousScore: 61,
        })
    })
})

describe("interview session mapper (continued) (continued)", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("maps history rows, the trend of graded scores oldest first, and the evidence", () => {
        const abandoned = history({ session_id: "b", status: "abandoned", overall_score: null, verdict: null })
        const rows = [
            history({ session_id: "c", overall_score: 90 }),
            abandoned,
            history({ session_id: "a", overall_score: 60, tier: "middle" }),
            history({ session_id: "z", overall_score: 40 }),
        ]

        expect(subject.toHistoryItem(abandoned)).toMatchObject({
            status: "abandoned",
            overallScore: null,
            verdict: null,
        })
        const session = sessionRowOf()
        expect(subject.toHistoryItem(session)).toMatchObject({
            sessionId: session.session_id,
            track: "backend-fullstack",
        })
        expect(subject.toTrends(rows)).toEqual([
            { track: "backend-fullstack", tier: "junior", scores: [40, 90] },
            { track: "backend-fullstack", tier: "middle", scores: [60] },
        ])
        expect(
            subject.toEvidenceItem({
                track: "t",
                family: "technical",
                tier: "junior",
                score: 80,
                verdict: "pass",
                session_id: "s",
                graded_at: new Date("2026-11-08T11:00:00.000Z"),
            }),
        ).toEqual({
            track: "t",
            family: "technical",
            tier: "junior",
            bestScore: 80,
            verdict: "pass",
            sessionId: "s",
            gradedAt: "2026-11-08T11:00:00.000Z",
        })
    })

    it("gives the model the prompt, the follow-ups and the candidate's words but not hints or the closing line", () => {
        const turns = [
            turnRowOf(),
            turnRowOf({ kind: "hint", content: "hint" }),
            turnRowOf({ role: "candidate", kind: "answer", content: "mine", revision: 0 }),
            turnRowOf({ kind: "done", content: "bye" }),
        ]

        expect(subject.toTranscript(turns)).toEqual([
            { role: "interviewer", kind: "prompt", content: LAYER_QUESTION_VI },
            { role: "candidate", kind: "answer", content: "mine" },
        ])
    })
})

describe("toModuleLessons", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("lists the lessons of each module slug in the order the report holds them", () => {
        const view = subject.toSessionView(
            sessionRowOf({ status: "graded", scorecard: scorecardOf(80) }),
            [],
            [],
            {
                "0-core": [{ lessonId: "l1", topic: "t", title: "One" }],
                "1-data": [{ lessonId: "l2", topic: "t", title: "Two" }],
            },
            null,
        )

        expect(subject.toModuleLessons(view)).toEqual([
            { moduleRef: "0-core", lessons: [{ lessonId: "l1", topic: "t", title: "One" }] },
            { moduleRef: "1-data", lessons: [{ lessonId: "l2", topic: "t", title: "Two" }] },
        ])
    })

    it("lists nothing for a session that links no lesson", () => {
        expect(subject.toModuleLessons(subject.toSessionView(sessionRowOf(), [], [], {}, null))).toEqual([])
    })
})
