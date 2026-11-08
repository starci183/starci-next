import { Test } from "@nestjs/testing"
import { DEMO_SOURCE_KEY, demoModuleStepsOf, demoTopicCatalogOf } from "@tests/fixtures/builders/lesson.builder"
import { DEFAULT_TOPIC_CATALOG } from "./lesson-topic-catalog.policy"
import { joinPaths, resolveTopic, sourceKeyOf } from "./lesson-topic.policy"

const TOPIC_POLICY: unique symbol = Symbol("lesson.topic-policy")
const policies = { resolveTopic, sourceKeyOf, joinPaths }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: TOPIC_POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(TOPIC_POLICY)
}

describe("resolveTopic", () => {
    it("places a lesson under the topic its entry names, with the topic definition", async () => {
        const { resolveTopic: place } = await build()
        const found = place("first", demoTopicCatalogOf())

        expect(found.topic).toBe("demo-topic")
        expect(found.source?.title).toBe("Demo topic")
        expect(found.issue).toBeNull()
    })

    it.each([
        ["stranger", "lesson stranger has no topic entry"],
        ["clash", "topic clash of lesson clash is also a lesson id"],
        ["looped", "topic demo-lesson of lesson looped is also a lesson id"],
        ["lost", "topic lost-topic of lesson lost is not defined"],
    ])("refuses the lesson %s: %s", async (lessonId, issue) => {
        const { resolveTopic: place } = await build()

        expect(place(lessonId, demoTopicCatalogOf())).toEqual({ topic: null, source: null, issue })
    })

    it("holds the teacher's catalog without any topic that is also a lesson id", async () => {
        const { resolveTopic: place } = await build()
        const lessonIds = Object.keys(DEFAULT_TOPIC_CATALOG.byLesson)

        expect(lessonIds.map((id) => place(id, DEFAULT_TOPIC_CATALOG).issue)).toEqual(lessonIds.map(() => null))
    })
})

describe("the teacher's catalog sources", () => {
    it("names one distinct topic path row for every lesson it places", () => {
        const lessonIds = Object.keys(DEFAULT_TOPIC_CATALOG.byLesson)
        const sources = lessonIds.map((id) => DEFAULT_TOPIC_CATALOG.sources[id])

        expect(sources.every((source) => /^courses\/[^/]+\/modules\/[^/]+\/contents\/[^/]+$/u.test(source ?? ""))).toBe(
            true,
        )
        expect(new Set(sources).size).toBe(lessonIds.length)
        expect(Object.keys(DEFAULT_TOPIC_CATALOG.sources).sort()).toEqual([...lessonIds].sort())
    })

    it("puts Health probes on the Kubernetes probes row of DevOps module 18, not on its Fullstack module 16 legacy folder", () => {
        expect(DEFAULT_TOPIC_CATALOG.sources["health-probe-semantics"]).toBe(
            "courses/2-devops-mastery/modules/18-kubernetes-core-and-internals/contents/4-probes-autoscaling-and-rollouts",
        )
    })
})

describe("sourceKeyOf", () => {
    it("reads the content folder from the legacy reference and skips references that name none", async () => {
        const { sourceKeyOf: keyOf } = await build()
        const references = [
            { id: "a", label: "Docs", citation: "official; checked 2026-09-05" },
            { id: "b", label: "Legacy", citation: `legacy; ${DEMO_SOURCE_KEY}/bodies/0-typescript/vi.md; git abc` },
        ]

        expect(keyOf(references)).toBe(DEMO_SOURCE_KEY)
    })

    it("answers null when no reference names a content folder", async () => {
        const { sourceKeyOf: keyOf } = await build()

        expect(keyOf([{ id: "a", label: "Docs", citation: "official" }])).toBeNull()
        expect(keyOf([])).toBeNull()
    })
})

describe("joinPaths", () => {
    it("joins the paths of several modules in order and numbers the rows from 1", async () => {
        const { joinPaths: join } = await build()
        const joined = join([demoModuleStepsOf(0), [], demoModuleStepsOf(1)])

        expect(joined.map((step) => [step.order, step.titles.en])).toEqual([
            [1, "en: Step 0.0"],
            [2, "en: Step 0.1"],
            [3, "en: Step 1.0"],
            [4, "en: Step 1.1"],
        ])
    })
})
