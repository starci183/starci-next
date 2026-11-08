import { Test } from "@nestjs/testing"
import {
    AUTHORED_CHECKLIST_VI,
    AUTHORED_IDEAL_VI,
    AUTHORED_KEPT_CLAUSES_VI,
    AUTHORED_PROMPT_VI,
    DASH_QUESTION_VI,
    DASH_TAIL_VI,
    DI_GRADED_VI,
    DI_PROMPT_VI,
    DI_REMOVED_WORDS_VI,
    DI_STEM_VI,
    LEAK_PREFIX_VI,
    PARENTHESIS_PROMPT_VI,
    PARENTHESIS_STEM_VI,
    SHARED_PHRASE_VI,
    SHORT_PARENTHESIS_VI,
    SHORT_PROMPT_VI,
    UNRELATED_PROMPT_VI,
} from "@tests/fixtures/i18n/interview-spec.messages"
import { GIVEAWAY_RUN, givesAwayAnswer, groundOf, stemOf } from "./stem.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { givesAwayAnswer, groundOf, stemOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.stem.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const GROUND = groundOf([AUTHORED_IDEAL_VI, ...AUTHORED_CHECKLIST_VI])

describe("stemOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("keeps the question and drops the parenthetical hints and the dash tail that already say what a strong answer says", () => {
        const stem = subject.stemOf(AUTHORED_PROMPT_VI, GROUND)

        AUTHORED_KEPT_CLAUSES_VI.forEach((clause) => expect(stem).toContain(clause))
        expect(stem).not.toMatch(/MISS|HIT|round-trip|stale|evict|TTL/u)
        expect(stem).not.toContain("(")
        expect(stem.endsWith(".")).toBe(true)
    })

    it("leaves a parenthesis that is context rather than the answer, and a dash clause that is a real part of the question", () => {
        const context =
            "(Illustrated with TypeScript and NestJS, the concept applies to any stack.) Why does a guard run before a pipe — and what changes for a request that was never authenticated?"

        expect(subject.stemOf(context, GROUND)).toBe(context)
    })

    it("tidies the spaces and commas a removal leaves behind, and keeps a question mark", () => {
        expect(subject.stemOf(PARENTHESIS_PROMPT_VI, GROUND)).toBe(PARENTHESIS_STEM_VI)
        expect(subject.stemOf(`${DASH_QUESTION_VI} — ${DASH_TAIL_VI}?`, GROUND)).toBe(`${DASH_QUESTION_VI}?`)
    })

    it("drops a dash tail of a sentence that has no closing mark", () => {
        expect(subject.stemOf(`${DASH_QUESTION_VI} — ${DASH_TAIL_VI}`, GROUND)).toBe(DASH_QUESTION_VI)
    })

    it("does not take a short parenthesis or a short tail for an answer", () => {
        expect(subject.stemOf(SHORT_PARENTHESIS_VI, GROUND)).toBe(SHORT_PARENTHESIS_VI)
    })
})

describe("stemOf a short list of the problems", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("leaves the question without the list of problems a strong answer names", () => {
        const stem = subject.stemOf(DI_PROMPT_VI, subject.groundOf(DI_GRADED_VI))

        expect(stem).toBe(DI_STEM_VI)
        expect(stem).not.toMatch(DI_REMOVED_WORDS_VI)
    })
})

describe("givesAwayAnswer", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("is true when the prompt repeats a long run of words of the ideal answer or the checklist", () => {
        const leaky = `${LEAK_PREFIX_VI}${AUTHORED_CHECKLIST_VI[0]}`

        expect(subject.givesAwayAnswer(leaky, [AUTHORED_IDEAL_VI, ...AUTHORED_CHECKLIST_VI])).toBe(true)
    })

    it("is false for the stem, whose phrases are the topic and not the answer, and for a short shared phrase", () => {
        const stem = subject.stemOf(AUTHORED_PROMPT_VI, GROUND)

        expect(subject.givesAwayAnswer(stem, [AUTHORED_IDEAL_VI, ...AUTHORED_CHECKLIST_VI])).toBe(false)
        expect(subject.givesAwayAnswer(SHARED_PHRASE_VI, [AUTHORED_IDEAL_VI])).toBe(false)
        expect(GIVEAWAY_RUN).toBeGreaterThan(8)
    })

    it("is false when nothing is shared, and for a prompt shorter than the run", () => {
        expect(subject.givesAwayAnswer(UNRELATED_PROMPT_VI, [AUTHORED_IDEAL_VI])).toBe(false)
        expect(subject.givesAwayAnswer(SHORT_PROMPT_VI, [AUTHORED_IDEAL_VI])).toBe(false)
    })
})
