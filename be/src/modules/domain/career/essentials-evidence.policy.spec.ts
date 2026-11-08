import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import type { LessonProgressView } from "@modules/domain/attempt"
import type { LessonView } from "@modules/domain/lesson"
import { CAREER_LEARNER, CAREER_NOW } from "@tests/fixtures/builders/career.builder"
import { ESSENTIALS_ITEM_TYPE, essentialsExperienceOf, essentialsGradeOf } from "./essentials-evidence.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { essentialsExperienceOf, essentialsGradeOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("career.essentials-evidence")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const lessonOf = (title: string, implementation: string): LessonView => {
    const lesson = mock<LessonView>()
    Object.assign(lesson, {
        id: "request-lifecycle",
        title,
        implementation,
        learningOutcomes: [
            { id: "o1", text: "Guards run before pipes" },
            { id: "o2", text: "Interceptors wrap the response" },
        ],
    })
    return lesson
}

const progressOf = (levels: ReadonlyArray<readonly [string, number]>): LessonProgressView => {
    const progress = mock<LessonProgressView>()
    Object.assign(progress, { outcomes: levels.map(([id, proved]) => ({ id, understood: proved, proved })) })
    return progress
}

const PROJECT = { projectId: "p-1", title: "Shop", language: "go" }

describe("essentialsGradeOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("passes when every learning outcome is proved at level 2", () => {
        const grade = subject.essentialsGradeOf(
            lessonOf("Lifecycle VI", "typescript"),
            progressOf([
                ["o1", 2],
                ["o2", 2],
            ]),
        )

        expect(grade).toEqual({
            result: "pass",
            criteria: [
                { criterion: "Guards run before pipes", level: 2, evidenceQuote: "proved level 2/2" },
                { criterion: "Interceptors wrap the response", level: 2, evidenceQuote: "proved level 2/2" },
            ],
        })
    })

    it("fails while one outcome is unproved or missing", () => {
        const lesson = lessonOf("Lifecycle VI", "typescript")

        expect(
            subject.essentialsGradeOf(
                lesson,
                progressOf([
                    ["o1", 2],
                    ["o2", 1],
                ]),
            ).result,
        ).toBe("fail")
        expect(subject.essentialsGradeOf(lesson, progressOf([["o1", 2]])).criteria[1]?.level).toBe(0)
    })

    it("fails a lesson with no outcome", () => {
        const lesson = lessonOf("Lifecycle VI", "typescript")
        Object.assign(lesson, { learningOutcomes: [] })

        expect(subject.essentialsGradeOf(lesson, progressOf([])).result).toBe("fail")
    })
})

describe("essentialsExperienceOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("names the lesson in its project and fills the slots from the lesson and the project", () => {
        const params = subject.essentialsExperienceOf({
            learnerId: CAREER_LEARNER,
            lessonVi: lessonOf("Request lifecycle VI", "typescript"),
            lessonEn: lessonOf("Request lifecycle", "typescript"),
            progress: progressOf([
                ["o1", 2],
                ["o2", 2],
            ]),
            project: PROJECT,
            at: CAREER_NOW,
        })

        expect(params).toMatchObject({
            learnerId: CAREER_LEARNER,
            itemType: ESSENTIALS_ITEM_TYPE,
            subject: "request-lifecycle@p-1",
            projectId: "p-1",
            evidence: [{ kind: "lesson-proved", ref: "request-lifecycle", proofForm: "proved-lesson", at: CAREER_NOW }],
            slotValues: {
                vi: {
                    concept: "Request lifecycle VI",
                    project: "Shop",
                    language: "typescript",
                    lesson: "request-lifecycle",
                },
                en: {
                    concept: "Request lifecycle",
                    project: "Shop",
                    language: "typescript",
                    lesson: "request-lifecycle",
                },
            },
        })
        expect(params.grade.result).toBe("pass")
    })

    it("takes the project's language for a language-agnostic lesson", () => {
        const params = subject.essentialsExperienceOf({
            learnerId: CAREER_LEARNER,
            lessonVi: lessonOf("Lifecycle VI", "agnostic"),
            lessonEn: lessonOf("Lifecycle", "agnostic"),
            progress: progressOf([]),
            project: PROJECT,
            at: CAREER_NOW,
        })

        expect(params.slotValues.en["language"]).toBe("go")
        expect(params.grade.result).toBe("fail")
    })
})
