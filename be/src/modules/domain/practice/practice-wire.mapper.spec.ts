import { Test } from "@nestjs/testing"
import * as subject from "./practice-wire.mapper"
import type { PracticeProblemItemView, PracticeProblemView, PracticeSubmissionView } from "./practice.contracts"

const SUBJECT: unique symbol = Symbol("practice.practice-wire.mapper")

const item: PracticeProblemItemView = {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "medium",
    tags: ["arrays"],
    status: "unsolved",
    locked: false,
    orderIndex: 0,
}

const problem: PracticeProblemView = {
    slug: "two-sum",
    title: "Two Sum",
    patternId: "arrays",
    patternTitle: "Arrays",
    difficulty: "hard",
    tags: [],
    statementMarkdown: "x",
    timeLimitMs: 1000,
    memoryLimitKb: 1000,
    locked: false,
    starterCodes: [{ language: "javascript", content: "code" }],
    examples: [],
    hintsTotal: 3,
    hintsRevealed: [],
    status: "attempted",
    nextSlug: null,
}

const submission: PracticeSubmissionView = {
    id: "s1",
    slug: "two-sum",
    language: "typescript",
    kind: "submit",
    verdict: "wrong-answer",
    compileOutput: null,
    failureCode: null,
    tests: [],
    passedCount: 0,
    totalCount: 1,
    timeMs: null,
    memoryKb: null,
    createdAt: new Date("2026-11-08T10:00:00.000Z"),
}

describe("practice wire mapper", () => {
    let toProblemItemWires: typeof subject.toProblemItemWires
    let toProblemWire: typeof subject.toProblemWire
    let toSubmissionWire: typeof subject.toSubmissionWire

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ toProblemItemWires, toProblemWire, toSubmissionWire } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("names the difficulty and the standing of a listed problem in upper case", () => {
        expect(toProblemItemWires([item])).toEqual([{ ...item, difficulty: "MEDIUM", status: "UNSOLVED" }])
    })

    it("names the difficulty, the standing and the starter languages of a problem in upper case", () => {
        expect(toProblemWire(problem)).toMatchObject({
            difficulty: "HARD",
            status: "ATTEMPTED",
            starterCodes: [{ language: "JAVASCRIPT", content: "code" }],
        })
    })

    it("names the language, kind and verdict of a submission with underscores and gives the instant as ISO text", () => {
        expect(toSubmissionWire(submission)).toMatchObject({
            language: "TYPESCRIPT",
            kind: "SUBMIT",
            verdict: "WRONG_ANSWER",
            createdAt: "2026-11-08T10:00:00.000Z",
        })
    })
})
