import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import {
    LessonContentService,
    LessonReadService,
    type LessonActivity,
    type LessonCatalogItemView,
} from "@modules/domain/lesson"
import { LessonCatalogClient } from "./lesson-catalog.client"

const LESSON = { id: "idempotency", version: "v1", title: "Idempotency", topicId: "reliability" }

type ServerActivity = Awaited<ReturnType<LessonContentService["activity"]>>

const activity = (id: string, patch: Partial<LessonActivity>): ServerActivity => ({
    activity: { id, kind: "explain", prompt: "p", outcomeIds: [], ...patch },
    phase: "challenge",
})

const build = async () => {
    const catalog = mock<LessonReadService>()
    const content = mock<LessonContentService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonCatalogClient,
            { provide: LessonReadService, useValue: catalog },
            { provide: LessonContentService, useValue: content },
        ],
    }).compile()
    return { client: moduleRef.get(LessonCatalogClient), catalog, content }
}

describe("LessonCatalogClient lessons", () => {
    it("lists the live lessons by id with their topic and title in the locale", async () => {
        const { client, catalog } = await build()
        const item: LessonCatalogItemView = {
            id: "idempotency",
            version: "v1",
            title: "Idempotency",
            description: "d",
            category: "backend",
            group: "g",
            topic: { id: "reliability", title: "Reliability" },
            difficulty: "intermediate",
            minutes: 10,
            languages: [],
            providers: [],
        }
        catalog.catalog.mockResolvedValue([item])

        const lessons = await client.lessons({ locale: "en" })

        expect(lessons.get("idempotency")).toEqual(LESSON)
        expect(catalog.catalog).toHaveBeenCalledWith(expect.objectContaining({ locale: "en", group: null, q: null }))
    })
})

describe("LessonCatalogClient rubricOf", () => {
    const criterion = {
        id: "c1",
        criterion: "Names the key",
        expectedEvidence: "a key",
        misconception: "none",
        maxScore: 2,
    }

    it("answers the rubric of the first AI-graded activity the lesson requires", async () => {
        const { client, content } = await build()
        content.plan.mockResolvedValue({ required: ["a", "b"], retrieval: [] })
        content.activity.mockImplementation((params) =>
            Promise.resolve(
                params.activityId === "a"
                    ? activity("a", { evaluationMethod: "deterministic" })
                    : activity("b", { evaluationMethod: "ai-rubric", rubric: [criterion] }),
            ),
        )

        await expect(client.rubricOf({ lesson: LESSON, locale: "en" })).resolves.toEqual({
            criteria: [{ id: "c1", criterion: "Names the key", expectedEvidence: "a key", misconception: "none" }],
        })
        expect(content.activity).toHaveBeenCalledWith({
            lessonId: "idempotency",
            version: "v1",
            activityId: "b",
            locale: "en",
        })
    })

    it("answers no criteria when no activity is AI-graded or its rubric is empty", async () => {
        const { client, content } = await build()
        content.plan.mockResolvedValue({ required: ["a", "b"], retrieval: [] })
        content.activity.mockImplementation((params) =>
            Promise.resolve(
                params.activityId === "a"
                    ? activity("a", { evaluationMethod: "ai-rubric" })
                    : activity("b", { evaluationMethod: "ai-rubric", rubric: [] }),
            ),
        )

        await expect(client.rubricOf({ lesson: LESSON, locale: "vi" })).resolves.toEqual({ criteria: [] })
    })
})
