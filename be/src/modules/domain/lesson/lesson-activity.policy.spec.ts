import { Test } from "@nestjs/testing"
import { demoRootOf, demoSectionsOf } from "@tests/fixtures/builders/lesson.builder"
import type { LessonLocaleDocument } from "./lesson.contracts"
import { findActivity } from "./lesson-activity.policy"

const ACTIVITY_POLICY: unique symbol = Symbol("lesson.activity-policy")

const build = async (): Promise<typeof findActivity> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ACTIVITY_POLICY, useFactory: () => findActivity }],
    }).compile()
    return moduleRef.get<typeof findActivity>(ACTIVITY_POLICY)
}

const documentOf: LessonLocaleDocument = {
    title: "t",
    description: "d",
    body: "b",
    learningOutcomes: [],
    prerequisites: [],
    references: [],
    retrieval: demoRootOf("vi").activities ?? [],
    sections: demoSectionsOf("vi"),
}

describe("findActivity", () => {
    it("answers an activity of a section whole, with the phase of that section", async () => {
        const find = await build()
        const found = find(documentOf, "demo--predict")

        expect(found?.phase).toBe("predict")
        expect(found?.activity.options?.map((option) => option.isCorrect)).toEqual([true, false, false])
    })

    it("answers the teacher's mark of the section, else of the lesson, and none when the content carries none", async () => {
        const find = await build()
        const marked: LessonLocaleDocument = {
            ...documentOf,
            isPremium: true,
            sections: documentOf.sections.map((section) =>
                section.phase === "apply" ? { ...section, isPremium: false } : section,
            ),
        }

        expect(find(marked, "demo--practice")?.isPremium).toBe(false)
        expect(find(marked, "demo--predict")?.isPremium).toBe(true)
        expect(find(marked, "demo--review")?.isPremium).toBe(true)
        expect(find(documentOf, "demo--predict")?.isPremium).toBeUndefined()
    })

    it("answers a review activity with the retrieval phase", async () => {
        const find = await build()

        expect(find(documentOf, "demo--review")?.phase).toBe("retrieval")
    })

    it("answers null for an id the lesson does not hold", async () => {
        const find = await build()

        expect(find(documentOf, "demo--nothing")).toBeNull()
    })
})
