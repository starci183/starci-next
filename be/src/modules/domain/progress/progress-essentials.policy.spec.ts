import { Test } from "@nestjs/testing"
import { buildEssentials, essentialsPartOf, partsOf, topicsOf } from "./progress-essentials.policy"
import type { EssentialsLessonSource } from "./progress.contracts"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { buildEssentials, essentialsPartOf, partsOf, topicsOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("progress.essentials-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const lessonOf = (
    id: string,
    topicId: string,
    overrides: Partial<EssentialsLessonSource> = {},
): EssentialsLessonSource => ({
    id,
    title: `Lesson ${id}`,
    topicId,
    topicTitle: `Topic ${topicId}`,
    completedAt: null,
    started: false,
    opener: null,
    ...overrides,
})

describe("partsOf", () => {
    it("opens only the parts the setting names, in order", async () => {
        const { partsOf: parts } = await loadSubject()

        expect(parts(["essence"]).map((part) => [part.part, part.access])).toEqual([
            ["essence", "unlocked"],
            ["source", "locked"],
            ["script", "locked"],
            ["apply", "locked"],
        ])
    })

    it("opens every part it is given and numbers them from 1", async () => {
        const { partsOf: parts } = await loadSubject()

        const premium = parts(["essence", "source", "script", "apply"])

        expect(premium.every((part) => part.access === "unlocked")).toBe(true)
        expect(premium.map((part) => part.order)).toEqual([1, 2, 3, 4])
    })
})

describe("topicsOf", () => {
    it("groups the lessons by topic and puts the topics the learner touched first", async () => {
        const { topicsOf: topics } = await loadSubject()

        const result = topics([
            lessonOf("a1", "a"),
            lessonOf("b1", "b", { started: true }),
            lessonOf("a2", "a"),
            lessonOf("b2", "b", { completedAt: "2026-11-10T00:00:00.000Z", started: true }),
        ])

        expect(result.map((topic) => topic.topicId)).toEqual(["b", "a"])
        expect(result[0]).toMatchObject({ lessonsDone: 1, lessonsTotal: 2 })
        expect(result[1]?.lessons.map((lesson) => lesson.lessonId)).toEqual(["a1", "a2"])
    })

    it("reads the opener before and after, and nothing before a question was answered", async () => {
        const { topicsOf: topics } = await loadSubject()

        const [topic] = topics([
            lessonOf("a1", "a", { opener: { answered: 5, firstCorrect: 2, latestCorrect: 5 } }),
            lessonOf("a2", "a", { opener: { answered: 0, firstCorrect: 0, latestCorrect: 0 } }),
        ])

        expect(topic?.lessons[0]).toMatchObject({ before: 2, after: 5, openerAnswered: 5, openerTotal: 5 })
        expect(topic?.lessons[1]).toMatchObject({ before: null, after: null, openerAnswered: 0 })
    })
})

describe("buildEssentials", () => {
    it("counts lessons done and started and sums the opener over every lesson", async () => {
        const { buildEssentials: build } = await loadSubject()

        const view = build(
            [
                lessonOf("a1", "a", { started: true, opener: { answered: 5, firstCorrect: 1, latestCorrect: 4 } }),
                lessonOf("a2", "a", {
                    started: true,
                    completedAt: "2026-11-10T00:00:00.000Z",
                    opener: { answered: 3, firstCorrect: 2, latestCorrect: 3 },
                }),
                lessonOf("a3", "a"),
            ],
            ["essence"],
        )

        expect(view).toMatchObject({
            lessonsDone: 1,
            lessonsStarted: 2,
            lessonsTotal: 3,
            beforeCorrect: 3,
            afterCorrect: 7,
            answered: 8,
        })
        expect(view.parts[1]?.access).toBe("locked")
    })
})

describe("essentialsPartOf", () => {
    it("names the four content parts of the entitlement setting and nothing else", async () => {
        const { essentialsPartOf: partOf } = await loadSubject()

        expect(["1-essential", "2-source", "3-scenarios", "4-apply"].map((part) => partOf(part))).toEqual([
            "essence",
            "source",
            "script",
            "apply",
        ])
        expect(partOf("5-extra")).toBeUndefined()
    })
})
