import { Test } from "@nestjs/testing"
import { bodyLanguageOf, drawQuestions, type DrawCandidate, type DrawParams } from "./draw.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { bodyLanguageOf, drawQuestions }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.draw.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const candidate = (id: string, over: Partial<DrawCandidate> = {}): DrawCandidate => ({
    questionId: id,
    bankId: id.split("/").slice(0, -1).join("/"),
    bankVersion: "v1",
    family: "technical",
    tier: "junior",
    isPremium: false,
    bodyLanguages: ["agnostic"],
    ...over,
})

const technical = ["a/b1/0", "a/b1/1", "a/b2/0", "a/b2/1", "a/b2/2"].map((id) => candidate(id))
const behavioral = ["eq/b/0", "eq/b/1"].map((id) => candidate(id, { family: "behavioral" }))

const paramsOf = (over: Partial<DrawParams> = {}): DrawParams => ({
    candidates: [...technical, ...behavioral],
    tier: "junior",
    free: false,
    language: null,
    length: 3,
    avoid: new Set(),
    seed: "seed-1",
    ...over,
})

describe("bodyLanguageOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("takes the language asked, else the agnostic body, else the first body when none was asked, else nothing", () => {
        expect(subject.bodyLanguageOf(["typescript", "go"], "go")).toBe("go")
        expect(subject.bodyLanguageOf(["agnostic", "go"], "java")).toBe("agnostic")
        expect(subject.bodyLanguageOf(["bash", "yaml"], null)).toBe("bash")
        expect(subject.bodyLanguageOf(["bash"], "go")).toBeNull()
        expect(subject.bodyLanguageOf([], null)).toBeNull()
    })
})

describe("drawQuestions", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("draws technical questions first and one behavioural question last, the same way for the same seed", () => {
        const drawn = subject.drawQuestions(paramsOf())

        expect(drawn?.map((question) => question.family)).toEqual(["technical", "technical", "behavioral"])
        expect(drawn?.map((question) => question.position)).toEqual([0, 1, 2])
        expect(subject.drawQuestions(paramsOf())).toEqual(drawn)
        expect(subject.drawQuestions(paramsOf({ seed: "seed-2" }))).not.toEqual(undefined)
    })

    it("spreads the technical questions over the banks", () => {
        const drawn = subject.drawQuestions(paramsOf({ length: 3 })) ?? []

        expect(new Set(drawn.filter((q) => q.family === "technical").map((q) => q.bankId)).size).toBe(2)
    })

    it("prefers questions the learner did not see lately but repeats them when the pool is short", () => {
        const avoid = new Set(["a/b1/0", "a/b1/1", "a/b2/0"])
        const fresh = subject.drawQuestions(paramsOf({ avoid })) ?? []
        const repeat =
            subject.drawQuestions(paramsOf({ avoid: new Set(technical.map((entry) => entry.questionId)) })) ?? []

        expect(
            fresh
                .filter((q) => q.family === "technical")
                .map((q) => q.questionId)
                .sort(),
        ).toEqual(["a/b2/1", "a/b2/2"])
        expect(repeat).toHaveLength(3)
    })

    it("takes only free questions for a free session and refuses when too few are left", () => {
        const premium = technical.map((entry) => candidate(entry.questionId, { isPremium: true }))
        const mixed = [candidate("a/b1/0"), ...premium.slice(1), ...behavioral]

        expect(subject.drawQuestions(paramsOf({ candidates: mixed, free: true }))).toBeNull()
        expect(subject.drawQuestions(paramsOf({ candidates: mixed, free: false }))).toHaveLength(3)
    })

    it("refuses when a family or the tier has no question, and when the language has no body", () => {
        expect(subject.drawQuestions(paramsOf({ candidates: technical }))).toBeNull()
        expect(subject.drawQuestions(paramsOf({ tier: "senior" }))).toBeNull()
        const typed = [
            ...technical.map((entry) => candidate(entry.questionId, { bodyLanguages: ["go"] })),
            ...behavioral,
        ]
        expect(subject.drawQuestions(paramsOf({ candidates: typed, language: "java" }))).toBeNull()
        expect(subject.drawQuestions(paramsOf({ candidates: typed, language: "go" }))?.[0]?.bodyLanguage).toBe("go")
    })

    it("draws at least one technical question even for a session of length 1", () => {
        expect(subject.drawQuestions(paramsOf({ length: 1 }))).toHaveLength(2)
    })
})
