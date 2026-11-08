import { Test } from "@nestjs/testing"
import { FakeClock, builder, mockEntityManager } from "@starci/jest-preset"
import { LEARNER } from "@tests/fixtures/builders/attempt.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { AttemptFairUseService } from "./attempt-fair-use.service"
import { ATTEMPT_OPTIONS } from "./attempt.decorators"
import type { AttemptOptions } from "./attempt.options"
import { COUNT_COACH_GRADINGS } from "./persistence/attempt.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const DAY_START = new Date("2026-11-08T00:00:00.000Z")

const build = async (counted: ReadonlyArray<{ gradings: number }>, overrides: Partial<AttemptOptions> = {}) => {
    const em = mockEntityManager({ query: [[COUNT_COACH_GRADINGS, counted]] })
    const moduleRef = await Test.createTestingModule({
        providers: [
            AttemptFairUseService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ATTEMPT_OPTIONS, useValue: builder<AttemptOptions>({})(overrides) },
        ],
    }).compile()
    return { fairUse: moduleRef.get(AttemptFairUseService), em }
}

describe("AttemptFairUseService isWithinDailyLimit", () => {
    it("counts the graded written answers since the start of the UTC day", async () => {
        const { fairUse, em } = await build([{ gradings: 0 }])

        await expect(fairUse.isWithinDailyLimit(LEARNER)).resolves.toBe(true)

        expect(em.query).toHaveBeenCalledWith(COUNT_COACH_GRADINGS, [LEARNER, DAY_START])
    })

    it("is out of turns at the default limit of 100", async () => {
        const { fairUse } = await build([{ gradings: 100 }])

        await expect(fairUse.isWithinDailyLimit(LEARNER)).resolves.toBe(false)
    })

    it("has a turn left at 99 of the default 100", async () => {
        const { fairUse } = await build([{ gradings: 99 }])

        await expect(fairUse.isWithinDailyLimit(LEARNER)).resolves.toBe(true)
    })

    it("holds the limit the app names", async () => {
        const { fairUse } = await build([{ gradings: 3 }], { dailyGradingLimit: 3 })

        await expect(fairUse.isWithinDailyLimit(LEARNER)).resolves.toBe(false)
    })

    it("turns the coach off for everyone when the app names a limit of 0", async () => {
        const { fairUse } = await build([{ gradings: 0 }], { dailyGradingLimit: 0 })

        await expect(fairUse.isWithinDailyLimit(LEARNER)).resolves.toBe(false)
    })

    it("counts no grading when the count comes back empty", async () => {
        const { fairUse } = await build([])

        await expect(fairUse.isWithinDailyLimit(LEARNER)).resolves.toBe(true)
    })
})
