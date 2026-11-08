import { Test } from "@nestjs/testing"
import type { ReviewCloze } from "./review.contracts"
import { clozeChoices, clozeProblems, parseClozes, revealAnswer } from "./cloze.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { clozeChoices, clozeProblems, parseClozes, revealAnswer }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("review.cloze-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const FIRST: ReviewCloze = { n: 1, term: "container", distractors: ["factory function", "service locator"] }

const ANSWER = "Handing it to a {{c1::container::factory function,service locator}} and a {{c2:: scope ::singleton}}."

describe("parseClozes", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads each term with its distractors in order", () => {
        expect(subject.parseClozes(ANSWER)).toEqual([
            { n: 1, term: "container", distractors: ["factory function", "service locator"] },
            { n: 2, term: "scope", distractors: ["singleton"] },
        ])
    })

    it("reads a term without distractors as one with none", () => {
        expect(subject.parseClozes("a {{c3::term}}")).toEqual([{ n: 3, term: "term", distractors: [] }])
    })
})

describe("clozeProblems", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("accepts a term with a different distractor", () => {
        expect(subject.clozeProblems(subject.parseClozes(ANSWER))).toEqual([])
    })

    it("names an empty term, a missing distractor and a distractor equal to the term", () => {
        expect(subject.clozeProblems([{ n: 1, term: "", distractors: [] }])).toEqual([
            "cloze c1 has an empty term",
            "cloze c1 has no distractor",
        ])
        expect(subject.clozeProblems([{ n: 2, term: "Cache", distractors: ["cache"] }])).toEqual([
            "cloze c2 has a distractor equal to its term",
        ])
    })
})

describe("revealAnswer", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("shows each term in bold and drops the distractors", () => {
        expect(subject.revealAnswer(ANSWER)).toBe("Handing it to a **container** and a **scope**.")
    })
})

describe("clozeChoices", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("offers the term and its distractors in an order that is the same on every call", () => {
        const once = subject.clozeChoices(FIRST, "learner:item:1")
        const again = subject.clozeChoices(FIRST, "learner:item:1")

        expect([...once].sort()).toEqual(["container", "factory function", "service locator"])
        expect(again).toEqual(once)
    })

    it("does not always put the term in the same place", () => {
        const positions = new Set(
            Array.from({ length: 12 }, (_, index) => subject.clozeChoices(FIRST, `seed-${index}`).indexOf("container")),
        )

        expect(positions.size).toBeGreaterThan(1)
    })
})
