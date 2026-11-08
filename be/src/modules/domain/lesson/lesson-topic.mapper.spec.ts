import { Test } from "@nestjs/testing"
import { builder } from "@starci/jest-preset"
import { DEMO_SOURCE_KEY, demoModuleStepsOf } from "@tests/fixtures/builders/lesson.builder"
import type { RelatedTopicRow, TopicLessonRow, TopicRow } from "./persistence/lesson.rows"
import { toTopicView } from "./lesson-topic.mapper"

const MAPPER: unique symbol = Symbol("lesson.topic-mapper")

const build = async (): Promise<typeof toTopicView> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: MAPPER, useFactory: () => toTopicView }],
    }).compile()
    return moduleRef.get<typeof toTopicView>(MAPPER)
}

const topicRowOf = builder<TopicRow>({
    topic: "demo-topic",
    title: "Demo topic",
    source_note: "Demo course module 0",
    description: "About the demo topic.",
    prerequisites: ["Know the demo."],
    related: ["plain-topic"],
    path: demoModuleStepsOf(0),
})

const lessonRowOf = builder<TopicLessonRow>({
    lesson_id: "demo-lesson",
    lesson_group: "backend",
    source_key: DEMO_SOURCE_KEY,
    title: "vi: Demo lesson",
})

describe("toTopicView", () => {
    it("links the published lesson to the path row of its content folder and leaves the other rows still to come", async () => {
        const toView = await build()
        const view = toView(topicRowOf(), [lessonRowOf()], "backend", "vi")

        expect(view).toEqual({
            id: "demo-topic",
            title: "Demo topic",
            group: "backend",
            from: "Demo course module 0",
            description: "About the demo topic.",
            prerequisites: ["Know the demo."],
            related: [{ id: "plain-topic", title: "plain-topic", listed: false }],
            path: [
                { order: 1, title: "vi: Step 0.0", lessonId: null },
                { order: 2, title: "vi: Step 0.1", lessonId: "demo-lesson" },
            ],
        })
    })

    it("answers each related topic with its title and whether it has a published lesson", async () => {
        const toView = await build()
        const related = [
            builder<RelatedTopicRow>({ topic: "plain-topic", title: "Plain topic", listed: true })(),
            builder<RelatedTopicRow>({ topic: "empty-topic", title: "Empty topic", listed: false })(),
        ]
        const view = toView(
            topicRowOf({ related: ["empty-topic", "plain-topic", "unknown"] }),
            [],
            "backend",
            "vi",
            related,
        )

        expect(view.related).toEqual([
            { id: "empty-topic", title: "Empty topic", listed: false },
            { id: "plain-topic", title: "Plain topic", listed: true },
            { id: "unknown", title: "unknown", listed: false },
        ])
    })

    it("titles the rows in the asked locale", async () => {
        const toView = await build()

        expect(toView(topicRowOf(), [lessonRowOf()], "backend", "en").path.map((step) => step.title)).toEqual([
            "en: Step 0.0",
            "en: Step 0.1",
        ])
    })
})

describe("toTopicView path rows", () => {
    it("shows a lesson on the path row of its source instead of appending a row", async () => {
        const toView = await build()
        const probes = lessonRowOf({ lesson_id: "probes", source_key: "demo-course/other", title: "vi: Probes" })
        const view = toView(
            topicRowOf({ path: demoModuleStepsOf(0) }),
            [lessonRowOf({ source_key: DEMO_SOURCE_KEY }), probes],
            "backend",
            "vi",
        )

        expect(view.path.map((step) => step.lessonId)).toEqual([null, "demo-lesson", "probes"])
    })

    it("adds a row for a published lesson that no path row names, after the path", async () => {
        const toView = await build()
        const lonely = lessonRowOf({ lesson_id: "lonely", source_key: null, title: "vi: Lonely" })
        const view = toView(topicRowOf(), [lonely], "backend", "vi")

        expect(view.path.map((step) => [step.order, step.title, step.lessonId])).toEqual([
            [1, "vi: Step 0.0", null],
            [2, "vi: Step 0.1", null],
            [3, "vi: Lonely", "lonely"],
        ])
    })

    it("keeps the page copy absent for a topic without any", async () => {
        const toView = await build()
        const bare = topicRowOf({ description: null, prerequisites: null, related: null, path: [] })

        expect(toView(bare, [lessonRowOf({ source_key: null })], "backend", "vi")).toMatchObject({
            description: null,
            prerequisites: null,
            related: null,
            path: [{ order: 1, title: "vi: Demo lesson", lessonId: "demo-lesson" }],
        })
    })
})
