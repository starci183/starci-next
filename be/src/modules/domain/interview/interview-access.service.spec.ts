import { DEFAULT_INTERVIEW_SETTINGS } from "./interview.config"
import type { InterviewSettings } from "./interview.options"
import { FakeClock, mock, mockEntityManager, builder } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER } from "@tests/fixtures/builders/interview.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { InterviewAccessService } from "./interview-access.service"
import { INTERVIEW_RESOLVED_OPTIONS } from "./interview.decorators"
import { COUNT_AI_CALLS, COUNT_FREE_SESSIONS } from "./persistence/interview.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")

const build = async (stubs: ReadonlyArray<readonly [string, unknown]>, isPremium: boolean, dailyAiLimit = 150) => {
    const em = mockEntityManager({ query: stubs })
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(isPremium)
    const moduleRef = await Test.createTestingModule({
        providers: [
            InterviewAccessService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            {
                provide: INTERVIEW_RESOLVED_OPTIONS,
                useValue: builder<InterviewSettings>(DEFAULT_INTERVIEW_SETTINGS)({ dailyAiLimit }),
            },
        ],
    }).compile()
    return { service: moduleRef.get(InterviewAccessService), em }
}

describe("InterviewAccessService accessOf", () => {
    it("gives a free learner the sessions left this month, the reset date and the short length", async () => {
        const { service, em } = await build([[COUNT_FREE_SESSIONS, [{ count: 0 }]]], false)

        await expect(service.accessOf(LEARNER)).resolves.toEqual({
            isPremium: false,
            freeSessionsLeftThisMonth: 1,
            resetsAt: "2026-11-30T17:00:00.000Z",
            length: 3,
            freeMonth: "2026-11",
        })
        expect(em.query).toHaveBeenCalledWith(COUNT_FREE_SESSIONS, [LEARNER, "2026-11"])
    })

    it("has no free session left once the month's was used, and gives Premium the long length", async () => {
        const used = await build([[COUNT_FREE_SESSIONS, [{ count: 1 }]]], false)
        const premium = await build([[COUNT_FREE_SESSIONS, []]], true)

        await expect(used.service.accessOf(LEARNER)).resolves.toMatchObject({ freeSessionsLeftThisMonth: 0 })
        await expect(premium.service.accessOf(LEARNER)).resolves.toMatchObject({
            isPremium: true,
            length: 5,
            freeSessionsLeftThisMonth: 1,
        })
    })

    it("counts inside the manager of the caller's transaction when given one", async () => {
        const { service, em } = await build([], false)
        const other = mockEntityManager({ query: [[COUNT_FREE_SESSIONS, [{ count: 0 }]]] })

        await service.accessOf(LEARNER, other)

        expect(other.query).toHaveBeenCalledTimes(1)
        expect(em.query).not.toHaveBeenCalled()
    })
})

describe("InterviewAccessService requireAiBudget", () => {
    it("lets a learner under the daily cap through and counts from the start of the UTC day", async () => {
        const { service, em } = await build([[COUNT_AI_CALLS, [{ count: 149 }]]], false)

        await expect(service.requireAiBudget(LEARNER)).resolves.toBeUndefined()
        expect(em.query).toHaveBeenCalledWith(COUNT_AI_CALLS, [LEARNER, new Date("2026-11-08T00:00:00.000Z")])
    })

    it("refuses at the cap with INTERVIEW_AI_LIMIT_REACHED, and treats no row as none", async () => {
        const atCap = await build([[COUNT_AI_CALLS, [{ count: 150 }]]], true)
        const off = await build([[COUNT_AI_CALLS, []]], true, 0)

        await expect(atCap.service.requireAiBudget(LEARNER)).rejects.toMatchObject({
            code: "INTERVIEW_AI_LIMIT_REACHED",
        })
        await expect(off.service.requireAiBudget(LEARNER)).rejects.toMatchObject({ code: "INTERVIEW_AI_LIMIT_REACHED" })
    })
})
