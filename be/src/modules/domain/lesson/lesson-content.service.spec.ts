import { builder, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { SECRET, activityParamsOf, demoContentOf } from "@tests/fixtures/builders/lesson.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonErrorCode } from "./errors/lesson.error"
import type { VersionRow } from "./persistence/lesson.rows"
import { SELECT_VERSION } from "./persistence/lesson.sql"
import { LessonContentService } from "./lesson-content.service"

const LEARNER = "10000000-0000-4000-8000-000000000052"

const build = async (em: MockEntityManager, isPremium = false) => {
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(isPremium)
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonContentService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
        ],
    }).compile()
    return { service: moduleRef.get(LessonContentService), entitlement }
}

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

describe("LessonContentService activity", () => {
    it("answers the whole stored activity with its answers, options correctness and phase", async () => {
        const em = mockEntityManager({ query: [SELECT_VERSION, [versionRowOf()]] })
        const { service } = await build(em)

        const found = await service.activity(activityParamsOf())

        expect(found.phase).toBe("predict")
        expect(found.activity.options?.map((option) => option.isCorrect)).toEqual([true, false, false])
        expect(found.activity.answer?.explanation).toBe(`${SECRET} choice answer`)
        expect(em.query).toHaveBeenCalledWith(SELECT_VERSION, ["demo-lesson", "v1"])
    })

    it("answers the rubric of a graded activity in the locale asked", async () => {
        const em = mockEntityManager({ query: [SELECT_VERSION, [versionRowOf()]] })
        const { service } = await build(em)

        const found = await service.activity(activityParamsOf({ activityId: "demo--interview", locale: "en" }))

        expect(found.phase).toBe("challenge")
        expect(found.activity.rubric?.[0]?.criterion).toBe("en: Mechanism")
        expect(found.activity.rubric?.[0]?.expectedEvidence).toBe(`${SECRET} evidence one`)
    })

    it("answers a review activity with the retrieval phase", async () => {
        const em = mockEntityManager({ query: [SELECT_VERSION, [versionRowOf()]] })
        const { service } = await build(em)

        await expect(service.activity(activityParamsOf({ activityId: "demo--review" }))).resolves.toMatchObject({
            phase: "retrieval",
        })
    })

    it("refuses an activity the version does not hold and a version that is not stored", async () => {
        const stored = await build(mockEntityManager({ query: [SELECT_VERSION, [versionRowOf()]] }))
        const missing = await build(mockEntityManager({ query: [SELECT_VERSION, []] }))

        await expect(stored.service.activity(activityParamsOf({ activityId: "demo--nothing" }))).rejects.toMatchObject({
            code: LessonErrorCode.NotFound,
        })
        await expect(missing.service.activity(activityParamsOf({ version: "v9" }))).rejects.toMatchObject({
            code: LessonErrorCode.NotFound,
        })
    })
})

describe("LessonContentService plan", () => {
    it("lists the graded activities a completion takes and the retrieval days the lesson authored", async () => {
        const em = mockEntityManager({ query: [SELECT_VERSION, [versionRowOf()]] })
        const { service } = await build(em)

        const plan = await service.plan("demo-lesson", "v1")

        expect(plan.required).not.toContain("demo--review")
        expect(plan.required).toContain("demo--predict")
        expect(plan.retrieval).toEqual([{ activityId: "demo--review", afterDays: 1 }])
    })

    it("skips a retrieval activity without authored days and refuses a version that is not stored", async () => {
        const content = demoContentOf()
        const bare = {
            ...content,
            locales: {
                ...content.locales,
                vi: {
                    ...content.locales.vi,
                    retrieval: content.locales.vi.retrieval.map((activity) => ({
                        id: activity.id,
                        kind: activity.kind,
                        prompt: activity.prompt,
                        outcomeIds: activity.outcomeIds,
                    })),
                },
            },
        }
        const ok = await build(mockEntityManager({ query: [SELECT_VERSION, [versionRowOf({ content: bare })]] }))
        const missing = await build(mockEntityManager({ query: [SELECT_VERSION, []] }))

        await expect(ok.service.plan("demo-lesson", "v1")).resolves.toMatchObject({ retrieval: [] })
        await expect(missing.service.plan("demo-lesson", "v9")).rejects.toMatchObject({
            code: LessonErrorCode.NotFound,
        })
    })
})

describe("LessonContentService requireAccess", () => {
    it("lets the free phase through for a learner without Premium, without asking the entitlement", async () => {
        const { service, entitlement } = await build(mockEntityManager())

        await expect(service.requireAccess({ learnerId: LEARNER, phase: "challenge" })).resolves.toBeUndefined()
        expect(entitlement.isPremium).not.toHaveBeenCalled()
    })

    it.each(["predict", "explore", "explain", "apply", "reflect", "retrieval"] as const)(
        "refuses the %s phase for a learner without Premium",
        async (phase) => {
            const { service, entitlement } = await build(mockEntityManager(), false)

            await expect(service.requireAccess({ learnerId: LEARNER, phase })).rejects.toMatchObject({
                code: LessonErrorCode.PremiumRequired,
            })
            expect(entitlement.isPremium).toHaveBeenCalledWith(LEARNER)
        },
    )

    it("lets every phase through for a learner with Premium", async () => {
        const { service } = await build(mockEntityManager(), true)

        await expect(service.requireAccess({ learnerId: LEARNER, phase: "apply" })).resolves.toBeUndefined()
    })
})
