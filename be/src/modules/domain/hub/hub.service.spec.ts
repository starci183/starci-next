import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { catalogItemOf, progressOf } from "@tests/fixtures/builders/lesson-read.builder"
import { AttemptReadService } from "@modules/domain/attempt"
import { LessonReadService } from "@modules/domain/lesson"
import { PathService } from "@modules/domain/path"
import { ReviewQueueService } from "@modules/domain/review"
import { STREAK_SHARD_IDS, StreakService, type StreakSummary } from "@modules/domain/streak"
import { MESSAGE_CATALOG, type MessageCatalog } from "@modules/platform/i18n"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { HUB_EXPERIENCE, type HubExperiencePort } from "./hub-experience.port"
import { HubLogEvent } from "./hub.log-events"
import { HubService } from "./hub.service"

const LEARNER = "20000000-0000-4000-8000-000000000003"

const STREAK: StreakSummary = {
    today: "2026-11-11",
    current: 2,
    longest: 4,
    todayCounted: false,
    todayShards: [],
    days: [],
    week: { activeDays: 1, goal: 4 },
    freezes: { held: 1 },
    shardCounters: STREAK_SHARD_IDS.map((shard) => ({ shard, current: 0, longest: 0, activeDaysLast30: 0 })),
    badges: [],
    reminder: null,
}

const build = async () => {
    const streaks = mock<StreakService>()
    const reviews = mock<ReviewQueueService>()
    const lessons = mock<LessonReadService>()
    const attempts = mock<AttemptReadService>()
    const paths = mock<PathService>()
    const experience = mock<HubExperiencePort>()
    const catalog = mock<MessageCatalog>()
    const logger = mock<Logger>()
    streaks.summary.mockResolvedValue(STREAK)
    reviews.summary.mockResolvedValue({
        date: "2026-11-11",
        due: 3,
        overdue: 1,
        newAvailable: 5,
        goalDaily: 10,
        doneToday: 1,
    })
    lessons.catalog.mockResolvedValue([catalogItemOf("l1"), catalogItemOf("l2")])
    attempts.progress.mockImplementation(({ lessonId }) =>
        Promise.resolve(progressOf(lessonId, lessonId === "l1" ? 2 : 0)),
    )
    paths.active.mockResolvedValue(null)
    experience.counts.mockResolvedValue({})
    catalog.get.mockImplementation((key, _params, locale) => `${locale}|${key}`)
    const moduleRef = await Test.createTestingModule({
        providers: [
            HubService,
            { provide: StreakService, useValue: streaks },
            { provide: ReviewQueueService, useValue: reviews },
            { provide: LessonReadService, useValue: lessons },
            { provide: AttemptReadService, useValue: attempts },
            { provide: PathService, useValue: paths },
            { provide: HUB_EXPERIENCE, useValue: experience },
            { provide: MESSAGE_CATALOG, useValue: catalog },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(HubService), reviews, lessons, paths, experience, logger }
}

describe("HubService read", () => {
    it("builds the hub from the streak and every source, worded in the asked locale", async () => {
        const { service } = await build()

        const hub = await service.read(LEARNER, "en")

        expect(hub.shards[0]).toMatchObject({ label: "en|shards.essentials", unavailable: false })
        expect(hub.shards[0]?.progress).toMatchObject({ value: 1, total: 2 })
        expect(hub.shards[1]?.progress).toMatchObject({ value: 3, total: null })
        expect(hub.streak).toMatchObject({ current: 2, week: { goal: 4 } })
        expect(hub.activePath).toBeNull()
    })

    it("shows a shard whose source failed as unavailable, logs the failure and still answers", async () => {
        const { service, reviews, logger } = await build()
        const cause = new Error("review down")
        reviews.summary.mockRejectedValue(cause)

        const hub = await service.read(LEARNER, "vi")

        expect(hub.shards[1]).toMatchObject({ unavailable: true })
        expect(hub.shards[0]?.unavailable).toBe(false)
        expect(logger.error).toHaveBeenCalledWith(HubLogEvent.SourceFailed, cause, { source: "review" })
    })

    it("counts a lesson as started only when its progress could be read and holds an attempt", async () => {
        const { service, lessons } = await build()
        lessons.catalog.mockResolvedValue([catalogItemOf("l1"), catalogItemOf("l2"), catalogItemOf("l3")])

        const hub = await service.read(LEARNER, "vi")

        expect(hub.shards[0]?.progress).toMatchObject({ value: 1, total: 3 })
    })

    it("shows the experience counts and the path the sources gave", async () => {
        const { service, experience, paths } = await build()
        experience.counts.mockResolvedValue({ essentials: { verified: 1, pending: 2 } })
        paths.active.mockResolvedValue({ pathId: "ai-engineer", title: "AI engineer", next: ["a"] })

        const hub = await service.read(LEARNER, "en")

        expect(hub.shards[0]?.experience).toEqual({ verified: 1, pending: 2 })
        expect(hub.activePath).toEqual({ pathId: "ai-engineer", title: "AI engineer", next: ["a"] })
    })
})
