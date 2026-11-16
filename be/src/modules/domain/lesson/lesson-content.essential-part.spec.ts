import { mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonErrorCode } from "./errors/lesson.error"
import { LessonContentService } from "./lesson-content.service"

const LEARNER = "10000000-0000-4000-8000-000000000052"

/** The entitlement answers by part the way the default setting does: Bản chất for everyone, the other parts with Premium. */
const build = async (isPremium: boolean) => {
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(isPremium)
    entitlement.mayReadEssentialPart.mockImplementation((_learner, part) =>
        Promise.resolve(part === "1-essential" || isPremium),
    )
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonContentService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: mockEntityManager() },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
        ],
    }).compile()
    return { service: moduleRef.get(LessonContentService), entitlement }
}

describe("LessonContentService requireAccess by Essentials part", () => {
    it("lets a free learner into Bản chất, whatever the mark or the phase says", async () => {
        const { service } = await build(false)

        await expect(
            service.requireAccess({ learnerId: LEARNER, phase: "explain", isPremium: true, part: "1-essential" }),
        ).resolves.toBeUndefined()
    })

    it.each(["2-source", "3-scenarios", "4-apply"] as const)(
        "refuses %s for a free learner, even with a free mark",
        async (part) => {
            const { service } = await build(false)

            await expect(
                service.requireAccess({ learnerId: LEARNER, phase: "challenge", isPremium: false, part }),
            ).rejects.toMatchObject({ code: LessonErrorCode.PremiumRequired })
        },
    )

    it("lets a Premium learner into every part", async () => {
        const { service } = await build(true)

        for (const part of ["1-essential", "2-source", "3-scenarios", "4-apply"] as const)
            await expect(service.requireAccess({ learnerId: LEARNER, phase: "apply", part })).resolves.toBeUndefined()
    })

    it("answers the same question as a flag", async () => {
        const { service } = await build(false)

        await expect(service.mayReadPart(LEARNER, "1-essential")).resolves.toBe(true)
        await expect(service.mayReadPart(LEARNER, "4-apply")).resolves.toBe(false)
    })
})
