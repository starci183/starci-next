import { builder, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { demoContentOf } from "@tests/fixtures/builders/lesson.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonErrorCode } from "./errors/lesson.error"
import type { LessonWorkspaceVariant } from "./lesson.contracts"
import type { CatalogRow, VersionRow } from "./persistence/lesson.rows"
import {
    SELECT_CATALOG,
    SELECT_PUBLISHED,
    SELECT_RELATED_TOPICS,
    SELECT_TOPIC,
    SELECT_TOPIC_LESSONS,
} from "./persistence/lesson.sql"
import { demoModuleStepsOf } from "@tests/fixtures/builders/lesson.builder"
import type { TopicLessonRow, TopicRow } from "./persistence/lesson.rows"
import { LessonReadService } from "./lesson-read.service"
import type { LessonCatalogFilter } from "./lesson-read.contracts"

const LEARNER = "10000000-0000-4000-8000-000000000051"

const build = async (em: MockEntityManager, isPremium = false) => {
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(isPremium)
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
        ],
    }).compile()
    return { service: moduleRef.get(LessonReadService), entitlement }
}

const filterOf = builder<LessonCatalogFilter>({
    locale: "vi",
    group: null,
    topic: null,
    category: null,
    difficulty: null,
    language: null,
    provider: null,
    q: null,
})

const catalogRowOf = builder<CatalogRow>({
    lesson_id: "demo-lesson",
    version: "v1",
    category: "system-design",
    lesson_group: "distributed",
    topic: "communication-patterns",
    topic_title: "Communication patterns",
    difficulty: "intermediate",
    minutes_read: 95,
    implementation: "typescript",
    title: "A title",
    description: "A description",
})

const versionRowOf = builder<VersionRow>({
    lesson_id: "demo-lesson",
    version: "v1",
    category: "system-design",
    lesson_group: "distributed",
    topic: "communication-patterns",
    topic_title: "Communication patterns",
    difficulty: "intermediate",
    minutes_read: 95,
    implementation: "typescript",
    content: demoContentOf(),
})

describe("LessonReadService catalog", () => {
    it("lists the live lessons as catalog items, passing every filter and the row bound to the statement", async () => {
        const em = mockEntityManager({
            query: [SELECT_CATALOG, [catalogRowOf(), catalogRowOf({ lesson_id: "b", implementation: "agnostic" })]],
        })
        const { service } = await build(em)
        const filter = filterOf({
            locale: "en",
            group: "infra",
            topic: "kubernetes",
            category: "devops",
            difficulty: "foundation",
            language: "go",
            provider: "aws",
            q: "probe",
        })

        const items = await service.catalog(filter)

        expect(items.map((item) => [item.id, item.languages])).toEqual([
            ["demo-lesson", ["typescript"]],
            ["b", []],
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_CATALOG, [
            500,
            "en",
            "devops",
            "foundation",
            "go",
            "aws",
            "probe",
            "infra",
            "kubernetes",
        ])
    })

    it("applies no filter when none is given", async () => {
        const em = mockEntityManager({ query: [SELECT_CATALOG, []] })
        const { service } = await build(em)

        await expect(service.catalog(filterOf())).resolves.toEqual([])
        expect(em.query).toHaveBeenCalledWith(SELECT_CATALOG, [500, "vi", null, null, null, null, null, null, null])
    })
})

describe("LessonReadService find", () => {
    it("projects the live lesson for a learner without Premium after asking the entitlement for that learner", async () => {
        const em = mockEntityManager({ query: [SELECT_PUBLISHED, [versionRowOf()]] })
        const { service, entitlement } = await build(em, false)

        const view = await service.find({ id: "demo-lesson", locale: "vi", learnerId: LEARNER })

        expect(entitlement.isPremium).toHaveBeenCalledWith(LEARNER)
        expect(view.isPremium).toBe(false)
        expect(view.sections.map((section) => section.locked)).toEqual([false, true, true, true, true, true])
        expect(em.query).toHaveBeenCalledWith(SELECT_PUBLISHED, ["demo-lesson"])
    })

    it("opens every phase and the workspace for a learner with Premium", async () => {
        const em = mockEntityManager({ query: [SELECT_PUBLISHED, [versionRowOf()]] })
        const { service } = await build(em, true)

        const view = await service.find({ id: "demo-lesson", locale: "en", learnerId: LEARNER })

        expect(view.sections.every((section) => !section.locked)).toBe(true)
        expect(view.workspace?.files).toHaveLength(2)
    })

    it("refuses a lesson that is not live, without asking the entitlement", async () => {
        const em = mockEntityManager({ query: [SELECT_PUBLISHED, []] })
        const { service, entitlement } = await build(em)

        await expect(service.find({ id: "gone", locale: "vi", learnerId: LEARNER })).rejects.toMatchObject({
            code: LessonErrorCode.NotFound,
        })
        expect(entitlement.isPremium).not.toHaveBeenCalled()
    })
})

describe("LessonReadService topic", () => {
    const topicRow: TopicRow = {
        topic: "demo-topic",
        title: "Demo topic",
        source_note: "Demo course module 0",
        description: null,
        prerequisites: null,
        related: null,
        path: demoModuleStepsOf(0),
    }
    const lessonRow: TopicLessonRow = {
        lesson_id: "demo-lesson",
        lesson_group: "backend",
        source_key: "courses/demo-course/modules/0-demo-module/contents/1-second",
        title: "vi: Demo lesson",
    }

    it("reads the topic with the group of its first published lesson and the path linked to the lessons", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_TOPIC, [topicRow]],
                [SELECT_TOPIC_LESSONS, [lessonRow]],
            ],
        })
        const { service } = await build(em)

        const view = await service.topic({ topic: "demo-topic", locale: "vi" })

        expect(view.group).toBe("backend")
        expect(view.path.map((step) => step.lessonId)).toEqual([null, "demo-lesson"])
        expect(em.query).toHaveBeenCalledWith(SELECT_TOPIC, ["demo-topic"])
        expect(em.query).toHaveBeenCalledWith(SELECT_TOPIC_LESSONS, ["demo-topic", "vi", 500])
    })

    it("reads the title and listed state of the related topics in one query", async () => {
        const related = [{ topic: "plain-topic", title: "Plain topic", listed: true }]
        const em = mockEntityManager({
            query: [
                [SELECT_TOPIC, [{ ...topicRow, related: ["plain-topic", "later-topic"] }]],
                [SELECT_TOPIC_LESSONS, [lessonRow]],
                [SELECT_RELATED_TOPICS, related],
            ],
        })
        const { service } = await build(em)

        const view = await service.topic({ topic: "demo-topic", locale: "vi" })

        expect(view.related).toEqual([
            { id: "plain-topic", title: "Plain topic", listed: true },
            { id: "later-topic", title: "later-topic", listed: false },
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_RELATED_TOPICS, [["plain-topic", "later-topic"], 500])
    })

    it("does not find a topic nobody stored, nor a topic with no published lesson", async () => {
        const unknown = await build(
            mockEntityManager({
                query: [
                    [SELECT_TOPIC, []],
                    [SELECT_TOPIC_LESSONS, []],
                ],
            }),
        )
        const unpublished = await build(
            mockEntityManager({
                query: [
                    [SELECT_TOPIC, [topicRow]],
                    [SELECT_TOPIC_LESSONS, []],
                ],
            }),
        )

        await expect(unknown.service.topic({ topic: "gone", locale: "vi" })).rejects.toMatchObject({
            code: "LESSON_TOPIC_NOT_FOUND",
        })
        await expect(unpublished.service.topic({ topic: "demo-topic", locale: "vi" })).rejects.toMatchObject({
            code: "LESSON_TOPIC_NOT_FOUND",
        })
    })
})

describe("LessonReadService workspaceArchive", () => {
    const variant: LessonWorkspaceVariant = {
        language: "typescript",
        runtime: "node 22",
        files: [{ path: "src/a.ts", role: "source", content: "A" }],
        commands: { unix: "npm test" },
    }
    const rowWith = (workspaces: ReadonlyArray<LessonWorkspaceVariant>): VersionRow =>
        versionRowOf({ content: { ...demoContentOf(), workspaces } })

    it("zips the workspace of the language for a Premium learner", async () => {
        const { service } = await build(mockEntityManager({ query: [SELECT_PUBLISHED, [rowWith([variant])]] }), true)

        const archive = await service.workspaceArchive({
            id: "demo-lesson",
            language: "typescript",
            learnerId: LEARNER,
        })

        expect(archive.fileName).toBe("demo-lesson-typescript.zip")
        expect(archive.content.subarray(0, 4).toString("hex")).toBe("504b0304")
    })

    it("refuses a learner without Premium before building anything", async () => {
        const { service } = await build(mockEntityManager({ query: [SELECT_PUBLISHED, [rowWith([variant])]] }), false)

        await expect(
            service.workspaceArchive({ id: "demo-lesson", language: "typescript", learnerId: LEARNER }),
        ).rejects.toMatchObject({ code: LessonErrorCode.PremiumRequired })
    })

    it("is not found for a language the lesson does not ship and for a lesson that is not live", async () => {
        const { service } = await build(mockEntityManager({ query: [SELECT_PUBLISHED, [rowWith([variant])]] }), true)
        const none = await build(mockEntityManager({ query: [SELECT_PUBLISHED, []] }), true)

        await expect(
            service.workspaceArchive({ id: "demo-lesson", language: "go", learnerId: LEARNER }),
        ).rejects.toMatchObject({ code: LessonErrorCode.NotFound })
        await expect(
            none.service.workspaceArchive({ id: "x", language: "go", learnerId: LEARNER }),
        ).rejects.toMatchObject({ code: LessonErrorCode.NotFound })
    })
})
