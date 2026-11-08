import { Test } from "@nestjs/testing"
import { publicRowOf, questionDraftOf, sessionQuestionOf } from "@tests/fixtures/builders/interview.builder"
import { firstLanguageOf, idealOf, materialOf, promptAtOf, promptOf } from "./question-lookup.policy"
import { LAYER_IDEAL_VI } from "@tests/fixtures/i18n/interview-spec.messages"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { firstLanguageOf, idealOf, materialOf, promptAtOf, promptOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.question-lookup.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const draft = questionDraftOf()

describe("question lookup policy", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("finds the prompt of a body and falls back to an empty one when the body is missing", () => {
        expect(subject.promptOf(draft.bodies, "agnostic", "en").prompt).toBe("Where does this logic belong?")
        expect(subject.promptOf(draft.bodies, "go", "en")).toEqual({ prompt: "", givenCode: null, diagram: null })
    })

    it("names the first body language, or agnostic when there is none", () => {
        const prompt = { prompt: "p", givenCode: null, diagram: null }
        expect(subject.firstLanguageOf({ java: { vi: prompt, en: prompt } })).toBe("java")
        expect(subject.firstLanguageOf({})).toBe("agnostic")
    })

    it("finds the ideal answer of a language and locale, or nothing", () => {
        expect(subject.idealOf(draft.grading, "agnostic", "vi")).toBe(LAYER_IDEAL_VI)
        expect(subject.idealOf(draft.grading, "go", "vi")).toBe("")
    })

    it("joins the code and the diagram the learner reads", () => {
        expect(subject.materialOf({ prompt: "p", givenCode: "code", diagram: "graph" })).toBe("code\n\ngraph")
        expect(subject.materialOf({ prompt: "p", givenCode: null, diagram: "graph" })).toBe("graph")
        expect(subject.materialOf({ prompt: "p", givenCode: null, diagram: null })).toBe("")
    })
})

describe("promptAtOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    const drawn = [sessionQuestionOf()]

    it("finds the prompt of the question at a position in the locale", () => {
        expect(subject.promptAtOf(drawn, [publicRowOf()], 0, "en")).toBe("Where does this logic belong?")
    })

    it("is empty when the position or the row is missing", () => {
        expect(subject.promptAtOf(drawn, [publicRowOf()], 3, "en")).toBe("")
        expect(subject.promptAtOf(drawn, [], 0, "en")).toBe("")
    })
})
