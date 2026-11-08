import { Test } from "@nestjs/testing"
import { FakeClock, mock } from "@starci/jest-preset"
import { AttemptReadService, type LessonProgressView } from "@modules/domain/attempt"
import { LessonReadService, type LessonView } from "@modules/domain/lesson"
import { CLOCK } from "@modules/platform/clock"
import { CAREER_LEARNER, CAREER_NOW } from "@tests/fixtures/builders/career.builder"
import type { ExperienceItemView } from "./career.contracts"
import { EssentialsExperienceService } from "./essentials-experience.service"
import { EXPERIENCE_PRODUCER, type ExperienceProducer } from "./experience-producer.port"

const lessonOf = (title: string): LessonView => {
    const lesson = mock<LessonView>()
    Object.assign(lesson, {
        id: "request-lifecycle",
        title,
        implementation: "typescript",
        learningOutcomes: [{ id: "o1", text: "Guards" }],
    })
    return lesson
}

const build = async () => {
    const producer = mock<ExperienceProducer>()
    producer.produce.mockResolvedValue(mock<ExperienceItemView>())
    const attempts = mock<AttemptReadService>()
    const progress = mock<LessonProgressView>()
    Object.assign(progress, { outcomes: [{ id: "o1", understood: 2, proved: 2 }] })
    attempts.progress.mockResolvedValue(progress)
    const lessons = mock<LessonReadService>()
    lessons.find.mockImplementation((params) =>
        Promise.resolve(lessonOf(params.locale === "vi" ? "Lifecycle VI" : "Lifecycle")),
    )
    const moduleRef = await Test.createTestingModule({
        providers: [
            EssentialsExperienceService,
            { provide: CLOCK, useValue: new FakeClock(CAREER_NOW) },
            { provide: EXPERIENCE_PRODUCER, useValue: producer },
            { provide: AttemptReadService, useValue: attempts },
            { provide: LessonReadService, useValue: lessons },
        ],
    }).compile()
    return { service: moduleRef.get(EssentialsExperienceService), producer, lessons }
}

describe("EssentialsExperienceService record", () => {
    it("creates nothing for a lesson attached to no project", async () => {
        const { service, producer, lessons } = await build()

        await expect(
            service.record({ learnerId: CAREER_LEARNER, lessonId: "request-lifecycle", project: null }),
        ).resolves.toBeNull()
        expect(producer.produce).not.toHaveBeenCalled()
        expect(lessons.find).not.toHaveBeenCalled()
    })

    it("hands the producer the proved lesson of a project, read from the attempt and lesson capabilities", async () => {
        const { service, producer } = await build()
        const project = { projectId: "p-1", title: "Shop", language: "go" }

        await service.record({ learnerId: CAREER_LEARNER, lessonId: "request-lifecycle", project })
        const params = producer.produce.mock.calls[0]?.[0]

        expect(params).toMatchObject({ learnerId: CAREER_LEARNER, subject: "request-lifecycle@p-1", projectId: "p-1" })
        expect(params?.grade.result).toBe("pass")
        expect(params?.evidence[0]?.at).toBe(CAREER_NOW)
        expect(params?.slotValues.en["concept"]).toBe("Lifecycle")
    })
})
