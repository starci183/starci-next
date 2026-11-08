import { Test } from "@nestjs/testing"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { NotificationError, NotificationErrorCode } from "./errors/notification.error"
import { NotificationLogEvent } from "./notification.log-events"
import { NotificationService } from "./notification.service"
import { INSERT_NOTIFICATION } from "./persistence/notification.sql"

const LEARNER = "20000000-0000-4000-8000-000000000001"
const NOW = new Date("2026-11-11T03:00:00.000Z")

const build = async () => {
    const em = mockEntityManager({ query: [[INSERT_NOTIFICATION, []]] })
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            NotificationService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(NotificationService), em, logger }
}

describe("NotificationService", () => {
    describe("notify", () => {
        it("stores the kind, the params as text, the link and the clock instant for the learner", async () => {
            const { service, em, logger } = await build()

            await service.notify(LEARNER, "premium.activated", { plan: "monthly", days: 30 }, "/premium")

            expect(em.query).toHaveBeenCalledWith(INSERT_NOTIFICATION, [
                LEARNER,
                "premium.activated",
                '{"plan":"monthly","days":"30"}',
                "/premium",
                NOW,
            ])
            expect(logger.error).not.toHaveBeenCalled()
        })

        it("stores a null link when none is given", async () => {
            const { service, em } = await build()

            await service.notify(LEARNER, "review.due", { count: 3 })

            expect(em.query).toHaveBeenCalledWith(INSERT_NOTIFICATION, [
                LEARNER,
                "review.due",
                '{"count":"3"}',
                null,
                NOW,
            ])
        })

        it("stores nothing and logs the refusal when the link is not an in-app path, without rejecting", async () => {
            const { service, em, logger } = await build()

            await expect(service.notify(LEARNER, "review.due", {}, "//evil.test")).resolves.toBeUndefined()

            expect(em.query).not.toHaveBeenCalled()
            expect(logger.error).toHaveBeenCalledWith(
                NotificationLogEvent.NotifyFailed,
                new NotificationError({ code: NotificationErrorCode.LinkInvalid }),
                { learnerId: LEARNER, kind: "review.due" },
            )
        })

        it("logs the failure and does not reject when the write fails", async () => {
            const { service, em, logger } = await build()
            const failure = new Error("connection lost")
            em.query.mockRejectedValue(failure)

            await expect(service.notify(LEARNER, "experience.verified", { item: "x" })).resolves.toBeUndefined()

            expect(logger.error).toHaveBeenCalledWith(NotificationLogEvent.NotifyFailed, failure, {
                learnerId: LEARNER,
                kind: "experience.verified",
            })
        })
    })
})
