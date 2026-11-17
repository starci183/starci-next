import { Test } from "@nestjs/testing"
import { CAREER_LEARNER, CAREER_NOW } from "@tests/fixtures/builders/career.builder"
import type { PracticePatternEvidence } from "./career.contracts"
import { CareerErrorCode } from "./errors/career.error"
import * as subject from "./practice-evidence.policy"

const SUBJECT: unique symbol = Symbol("career.practice-evidence.policy")

const evidenceOf = (overrides: Partial<PracticePatternEvidence> = {}): PracticePatternEvidence => ({
    patternId: "arrays",
    title: "Arrays",
    problemCount: 3,
    acceptedCount: 3,
    viewedCount: 0,
    language: "TypeScript",
    ...overrides,
})

describe("practice evidence policy", () => {
    let practiceRefusalOf: typeof subject.practiceRefusalOf
    let practiceExperienceOf: typeof subject.practiceExperienceOf
    let practiceGradeOf: typeof subject.practiceGradeOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ practiceRefusalOf, practiceExperienceOf, practiceGradeOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("allows a pattern whose every problem is accepted and none had its solution revealed first", () => {
        expect(practiceRefusalOf(evidenceOf())).toBeNull()
    })

    it("refuses a pattern with a problem not accepted, or with no problem, as incomplete", () => {
        expect(practiceRefusalOf(evidenceOf({ acceptedCount: 2 }))).toBe(CareerErrorCode.PracticeIncomplete)
        expect(practiceRefusalOf(evidenceOf({ problemCount: 0, acceptedCount: 0 }))).toBe(
            CareerErrorCode.PracticeIncomplete,
        )
    })

    it("refuses a complete pattern as solution viewed when a solution was revealed before its Accepted", () => {
        expect(practiceRefusalOf(evidenceOf({ viewedCount: 1 }))).toBe(CareerErrorCode.PracticeSolutionViewed)
    })

    it("names incomplete before solution viewed", () => {
        expect(practiceRefusalOf(evidenceOf({ acceptedCount: 1, viewedCount: 2 }))).toBe(
            CareerErrorCode.PracticeIncomplete,
        )
    })

    it("grades both criteria as met, quoting the counts", () => {
        const grade = practiceGradeOf(evidenceOf())

        expect(grade.result).toBe("pass")
        expect(grade.criteria.map((criterion) => criterion.level)).toEqual([2, 2])
        expect(grade.criteria[0]?.evidenceQuote).toBe("accepted 3/3")
    })

    it("makes the item of the pattern: its id as the subject, one judge entry and the slots of each locale", () => {
        const params = practiceExperienceOf(CAREER_LEARNER, evidenceOf({ title: "Mang" }), evidenceOf(), CAREER_NOW)

        expect(params).toMatchObject({
            learnerId: CAREER_LEARNER,
            itemType: "practice.pattern-solved",
            subject: "arrays",
            projectId: null,
            evidence: [{ kind: "practice-pattern", ref: "arrays", proofForm: "judge", at: CAREER_NOW }],
            slotValues: {
                vi: { count: "3", pattern: "Mang", language: "TypeScript" },
                en: { count: "3", pattern: "Arrays", language: "TypeScript" },
            },
        })
    })

    it("fills the language slot with an empty text when none was named", () => {
        const params = practiceExperienceOf(CAREER_LEARNER, evidenceOf({ language: null }), evidenceOf(), CAREER_NOW)

        expect(params.slotValues.vi["language"]).toBe("")
    })
})
