import { Test } from "@nestjs/testing"
import { FakeClock, mock } from "@starci/jest-preset"
import { CAREER_LEARNER, CAREER_NOW } from "@tests/fixtures/builders/career.builder"
import { CLOCK } from "@modules/platform/clock"
import type { ExperienceItemView, PracticePatternEvidence } from "./career.contracts"
import { CareerErrorCode } from "./errors/career.error"
import { EXPERIENCE_PRACTICE, type ExperiencePracticeSource } from "./experience-practice.port"
import { EXPERIENCE_PRODUCER, type ExperienceProducer } from "./experience-producer.port"
import { PracticeExperienceService } from "./practice-experience.service"

const evidenceOf = (overrides: Partial<PracticePatternEvidence> = {}): PracticePatternEvidence => ({
    patternId: "arrays",
    title: "Arrays",
    problemCount: 3,
    acceptedCount: 3,
    viewedCount: 0,
    language: "Python",
    ...overrides,
})

const build = async (evidence: PracticePatternEvidence) => {
    const producer = mock<ExperienceProducer>()
    producer.produce.mockResolvedValue(mock<ExperienceItemView>())
    const practice = mock<ExperiencePracticeSource>()
    practice.completion.mockImplementation((lookup) =>
        Promise.resolve({ ...evidence, title: lookup.locale === "vi" ? "Mang" : "Arrays" }),
    )
    const moduleRef = await Test.createTestingModule({
        providers: [
            PracticeExperienceService,
            { provide: CLOCK, useValue: new FakeClock(CAREER_NOW) },
            { provide: EXPERIENCE_PRODUCER, useValue: producer },
            { provide: EXPERIENCE_PRACTICE, useValue: practice },
        ],
    }).compile()
    return { service: moduleRef.get(PracticeExperienceService), producer, practice }
}

const claim = { learnerId: CAREER_LEARNER, patternId: "arrays" }

describe("PracticeExperienceService claim", () => {
    it("reads the pattern in both locales and hands the producer the item of a pattern solved in full", async () => {
        const { service, producer, practice } = await build(evidenceOf())

        await service.claim(claim)

        expect(practice.completion).toHaveBeenCalledWith({ ...claim, locale: "vi" })
        expect(practice.completion).toHaveBeenCalledWith({ ...claim, locale: "en" })
        expect(producer.produce).toHaveBeenCalledTimes(1)
        expect(producer.produce.mock.calls[0]?.[0]).toMatchObject({
            itemType: "practice.pattern-solved",
            subject: "arrays",
            slotValues: { vi: { pattern: "Mang" }, en: { pattern: "Arrays" } },
        })
    })

    it("refuses CAREER_PRACTICE_INCOMPLETE while a problem of the pattern is not accepted and produces nothing", async () => {
        const { service, producer } = await build(evidenceOf({ acceptedCount: 2 }))

        await expect(service.claim(claim)).rejects.toMatchObject({ code: CareerErrorCode.PracticeIncomplete })

        expect(producer.produce).not.toHaveBeenCalled()
    })

    it("refuses CAREER_PRACTICE_SOLUTION_VIEWED when a solution was revealed before its Accepted", async () => {
        const { service, producer } = await build(evidenceOf({ viewedCount: 1 }))

        await expect(service.claim(claim)).rejects.toMatchObject({ code: CareerErrorCode.PracticeSolutionViewed })

        expect(producer.produce).not.toHaveBeenCalled()
    })
})
