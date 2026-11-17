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
    solutionRevealed: false,
    solutionViewedBeforeAccepted: false,
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
    starterCodes: [{ language: "javascript", content: "code" }],
    examples: [],
    hintsTotal: 3,
    hintsRevealed: [],
    status: "attempted",
    solutionRevealed: false,
    solutionViewedBeforeAccepted: false,
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
    let toNextWire: typeof subject.toNextWire
    let toSubmissionsPageWire: typeof subject.toSubmissionsPageWire
    let toSolutionWire: typeof subject.toSolutionWire

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ toProblemItemWires, toProblemWire, toSubmissionWire, toNextWire, toSolutionWire, toSubmissionsPageWire } =
            moduleRef.get<typeof subject>(SUBJECT))
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

    it("names the language and verdict of a history item, gives its instant as ISO text and carries the next cursor", () => {
        const item = {
            id: "s1",
            slug: "two-sum",
            problemTitle: "Two Sum",
            language: "cpp" as const,
            verdict: "time-limit-exceeded" as const,
            passedCount: 1,
            totalCount: 2,
            timeMs: 5,
            memoryKb: null,
            submittedAt: new Date("2026-11-08T10:00:00.000Z"),
        }

        expect(toSubmissionsPageWire({ items: [item], next: "c" })).toEqual({
            items: [
                { ...item, language: "CPP", verdict: "TIME_LIMIT_EXCEEDED", submittedAt: "2026-11-08T10:00:00.000Z" },
            ],
            nextCursor: "c",
        })
    })

    it("names the verdict of the problem to resume and keeps the next problem and a missing one as they are", () => {
        const next = {
            slug: "a",
            title: "A",
            patternId: "arrays",
            patternTitle: "Arrays",
            position: 1,
            patternProblemCount: 4,
        }
        const resume = {
            slug: "b",
            title: "B",
            patternId: "arrays",
            patternTitle: "Arrays",
            attempts: 2,
            lastVerdict: "time-limit-exceeded" as const,
            failedTestIndex: 3,
        }

        expect(toNextWire({ next, resume })).toEqual({
            next,
            resume: { ...resume, lastVerdict: "TIME_LIMIT_EXCEEDED" },
        })
        expect(toNextWire({ next: null, resume: null })).toEqual({ next: null, resume: null })
    })

    it("gives the instant a revealed solution was first seen as ISO text", () => {
        expect(
            toSolutionWire({
                slug: "a",
                solution: "text",
                revealedAt: new Date("2026-11-08T10:00:00.000Z"),
                countedForExperience: false,
            }),
        ).toEqual({ slug: "a", solution: "text", revealedAt: "2026-11-08T10:00:00.000Z", countedForExperience: false })
    })
})
