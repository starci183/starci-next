import { Test } from "@nestjs/testing"
import {
    CV_SLUG_FALLBACK,
    CV_SLUG_MAX,
    cvPathOf,
    cvSlugBaseOf,
    cvSlugCandidateOf,
    isUniqueViolation,
} from "./profile-cv.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { cvPathOf, cvSlugBaseOf, cvSlugCandidateOf, isUniqueViolation }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("profile.cv-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

describe("cvSlugBaseOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("folds Vietnamese letters to ASCII, lower-cases and joins words with a hyphen", () => {
        expect(subject.cvSlugBaseOf("Nguy\u1ec5n V\u0103n \u0110\u1ee9c")).toBe("nguyen-van-duc")
        expect(subject.cvSlugBaseOf("  Jane   O'Neil_99 ")).toBe("jane-o-neil-99")
    })

    it("falls back when nothing survives the folding", () => {
        expect(subject.cvSlugBaseOf("\u2605\u2605")).toBe(CV_SLUG_FALLBACK)
        expect(subject.cvSlugBaseOf("")).toBe(CV_SLUG_FALLBACK)
    })

    it("keeps a slug short and never ends it with a hyphen", () => {
        const slug = subject.cvSlugBaseOf(`${"a".repeat(CV_SLUG_MAX - 1)} bbbb`)

        expect(slug.length).toBeLessThanOrEqual(CV_SLUG_MAX)
        expect(slug.endsWith("-")).toBe(false)
    })
})

describe("cv link helpers", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("tries the base first and then the base with a numeric suffix from 2", () => {
        expect([1, 2, 3].map((attempt) => subject.cvSlugCandidateOf("jane", attempt))).toEqual([
            "jane",
            "jane-2",
            "jane-3",
        ])
    })

    it("puts the slug under /cv", () => {
        expect(subject.cvPathOf("jane")).toBe("/cv/jane")
    })

    it("recognises a unique violation on the error or on its driver error and nothing else", () => {
        expect(subject.isUniqueViolation({ code: "23505" })).toBe(true)
        expect(subject.isUniqueViolation({ driverError: { code: "23505" } })).toBe(true)
        expect(subject.isUniqueViolation({ driverError: { code: "42P01" } })).toBe(false)
        expect(subject.isUniqueViolation(new Error("boom"))).toBe(false)
        expect(subject.isUniqueViolation(null)).toBe(false)
        expect(subject.isUniqueViolation("23505")).toBe(false)
    })
})
