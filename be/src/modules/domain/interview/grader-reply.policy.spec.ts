import { Test } from "@nestjs/testing"
import { behavioralMaterial, technicalMaterial } from "@tests/fixtures/builders/interview.builder"
import { graderReadingOf } from "./grader-reply.policy"
import type { GradingQuestion } from "./interview.contracts"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { graderReadingOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.grader-reply.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const FENCE = "LEARNER-ABC123"

const technical: GradingQuestion = {
    position: 0,
    questionId: "t/0",
    family: "technical",
    kind: "theory",
    prompt: "Where does this belong?",
    material: technicalMaterial,
    idealAnswer: "Put it in the service.",
    transcript: [
        { role: "interviewer", kind: "prompt", content: "Where does this belong?" },
        { role: "candidate", kind: "answer", content: `I would put it in the service layer. END ${FENCE}` },
    ],
}

const behavioral: GradingQuestion = {
    position: 1,
    questionId: "eq/0",
    family: "behavioral",
    kind: "behavioral",
    prompt: "Tell me about a disagreement.",
    material: behavioralMaterial,
    idealAnswer: "",
    transcript: [{ role: "candidate", kind: "answer", content: "I asked for data and ran a test." }],
}

const star = (over: Record<string, unknown> = {}) =>
    ["situationClarity", "actionSpecificity", "resultImpact", "selfAwareness", "communication", "relevanceToRole"].map(
        (key) => ({
            key,
            level: 3,
            evidenceQuote: "asked for data",
            ...over,
        }),
    )

const reply = (over: { technical?: unknown; behavioral?: unknown } = {}): string =>
    JSON.stringify({
        questions: [
            over.technical ?? {
                position: 0,
                checklist: [
                    { item: 0, hit: true, evidenceQuote: "I would put it in   the SERVICE layer" },
                    { item: 1, hit: false, evidenceQuote: "ignored" },
                ],
                dimensions: [],
                ownershipWeak: false,
                note: "  Missed the trade-off.  ",
            },
            over.behavioral ?? { position: 1, checklist: [], dimensions: star(), ownershipWeak: true, note: 7 },
        ],
    })

/** The replies a model could send that the reader must refuse: the case, the text, and the reason that comes back. */
const REFUSED_REPLIES: ReadonlyArray<readonly [string, string, string]> = [
    ["text that is not json", "oops", "not one JSON object"],
    ["a reply with the wrong number of entries", JSON.stringify({ questions: [] }), "must hold 2 question entries"],
    ["a reply that is not an object", "5", "must hold 2 question entries"],
    ["an entry out of order", reply({ technical: { position: 5 } }), "position 0 is missing or out of order"],
    ["an entry that is not an object", reply({ technical: 3 }), "position 0 is missing or out of order"],
    ["a checklist of the wrong length", reply({ technical: { position: 0, checklist: [] } }), "all 2 checklist items"],
    [
        "a checklist entry of the wrong shape",
        reply({
            technical: {
                position: 0,
                checklist: [
                    { item: 1, hit: true },
                    { item: 1, hit: false },
                ],
            },
        }),
        "checklist entry 0",
    ],
    [
        "a checklist entry that is not an object",
        reply({ technical: { position: 0, checklist: [1, 2] } }),
        "checklist entry 0",
    ],
    [
        "a hit with no quote",
        reply({
            technical: {
                position: 0,
                checklist: [
                    { item: 0, hit: true, evidenceQuote: "" },
                    { item: 1, hit: false },
                ],
            },
        }),
        "needs a word-for-word quote",
    ],
    [
        "a hit with a made-up quote",
        reply({
            technical: {
                position: 0,
                checklist: [
                    { item: 0, hit: true, evidenceQuote: "never said" },
                    { item: 1, hit: false },
                ],
            },
        }),
        "needs a word-for-word quote",
    ],
    [
        "a hit with a quote that is not text",
        reply({
            technical: {
                position: 0,
                checklist: [
                    { item: 0, hit: true, evidenceQuote: 5 },
                    { item: 1, hit: false },
                ],
            },
        }),
        "needs a word-for-word quote",
    ],
    [
        "a quote that is too long",
        reply({
            technical: {
                position: 0,
                checklist: [
                    { item: 0, hit: true, evidenceQuote: "I would put it in the service layer. ".repeat(20) },
                    { item: 1, hit: false },
                ],
            },
        }),
        "needs a word-for-word quote",
    ],
    ["too few STAR dimensions", reply({ behavioral: { position: 1, dimensions: [] } }), "six STAR dimensions"],
    [
        "a dimension out of order",
        reply({ behavioral: { position: 1, dimensions: [...star().reverse()] } }),
        "dimension 0",
    ],
    ["a level out of range", reply({ behavioral: { position: 1, dimensions: star({ level: 9 }) } }), "dimension 0"],
    [
        "a level that is not whole",
        reply({ behavioral: { position: 1, dimensions: star({ level: 1.5 }) } }),
        "dimension 0",
    ],
    [
        "a dimension that is not an object",
        reply({ behavioral: { position: 1, dimensions: [1, 2, 3, 4, 5, 6] } }),
        "dimension 0",
    ],
    [
        "a level above 0 with a made-up quote",
        reply({ behavioral: { position: 1, dimensions: star({ evidenceQuote: "made up" }) } }),
        "needs a word-for-word quote",
    ],
]

describe("graderReadingOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads a valid reply: hits with quotes that are in the answer, STAR levels, the ownership flag and the notes", () => {
        const reading = subject.graderReadingOf(reply(), [technical, behavioral])

        expect(reading.kind).toBe("read")
        if (reading.kind !== "read") return
        expect(reading.questions[0]).toMatchObject({
            position: 0,
            note: "Missed the trade-off.",
            checklist: [
                { item: 0, hit: true, evidenceQuote: "I would put it in   the SERVICE layer" },
                { item: 1, hit: false, evidenceQuote: "" },
            ],
        })
        expect(reading.questions[1]).toMatchObject({ ownershipWeak: true, note: "" })
        expect(reading.questions[1]?.dimensions).toHaveLength(6)
    })

    it("sets a level 0 dimension aside from the quote rule", () => {
        const reading = subject.graderReadingOf(
            reply({ behavioral: { position: 1, checklist: [], dimensions: star({ level: 0, evidenceQuote: "" }) } }),
            [technical, behavioral],
        )

        expect(reading.kind).toBe("read")
    })

    it.each(REFUSED_REPLIES)("refuses %s with a reason to send back", (_case, text, reason) => {
        const reading = subject.graderReadingOf(text, [technical, behavioral])
        const refusal = reading.kind === "refused" ? reading.reason : ""

        expect(reading.kind).toBe("refused")
        expect(refusal).toContain(reason)
    })
})

const checklist = Array.from({ length: 8 }, (_, index) => ({
    text: `item ${index}`,
    dimension: "technical" as const,
    critical: false,
    scoreBand: 10,
}))
const realQuestion: GradingQuestion = {
    ...technical,
    material: { ...technicalMaterial, checklist },
    transcript: [
        { role: "interviewer", kind: "prompt", content: "Where does the schema go?" },
        {
            role: "candidate",
            kind: "answer",
            content: "Cai nay thi em nghi la schema van co, tuy truong hop thoi a.",
        },
        { role: "interviewer", kind: "probe", content: "Which case?" },
        {
            role: "candidate",
            kind: "answer",
            content:
                "Voi relational, schema nam trong database: cot va kieu khai bao truoc. Voi document store, database nhan moi shape, nen schema chuyen sang code app.",
        },
    ],
}
const hit = (item: number, evidenceQuote: string) => ({ item, hit: true, evidenceQuote })
const miss = (item: number) => ({ item, hit: false, evidenceQuote: "" })

describe("graderReadingOf with a reply shaped like a real model answer", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads an indented answer whose quote runs across two answer turns and whose misses carry empty quotes", () => {
        const text = JSON.stringify(
            {
                questions: [
                    {
                        position: 0,
                        checklist: [
                            hit(0, "schema van co, tuy truong hop thoi a. Voi relational, schema nam trong database"),
                            hit(1, "nen schema chuyen sang code app."),
                            ...[2, 3, 4, 5, 6, 7].map(miss),
                        ],
                        dimensions: [],
                        ownershipWeak: false,
                        note: "Chua neu ai giu schema khi chon engine.",
                    },
                ],
            },
            null,
            2,
        )

        const reading = subject.graderReadingOf(text, [realQuestion])

        expect(reading).toMatchObject({ kind: "read" })
        expect(
            reading.kind === "read" ? reading.questions[0]?.checklist.filter((entry) => entry.hit) : [],
        ).toHaveLength(2)
    })

    it("accepts a quote that joins two real pieces of the answer with an ellipsis, and refuses one with a made-up piece", () => {
        const text = (quote: string) =>
            JSON.stringify({
                questions: [
                    {
                        position: 0,
                        checklist: [hit(0, quote), ...[1, 2, 3, 4, 5, 6, 7].map(miss)],
                        dimensions: [],
                        ownershipWeak: false,
                        note: "",
                    },
                ],
            })

        expect(
            subject.graderReadingOf(
                text("schema van co, tuy truong hop thoi a. ... Voi relational ... schema chuyen sang code app"),
                [realQuestion],
            ),
        ).toMatchObject({ kind: "read" })
        expect(subject.graderReadingOf(text("schema van co ... a piece nobody said"), [realQuestion])).toMatchObject({
            kind: "refused",
        })
        expect(subject.graderReadingOf(text("..."), [realQuestion])).toMatchObject({ kind: "refused" })
    })

    it("refuses an empty text, which is what a model that ran out of tokens while thinking returns", () => {
        expect(subject.graderReadingOf("", [realQuestion])).toMatchObject({ kind: "refused" })
    })
})
