import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { catalogItemOf, progressOf } from "@tests/fixtures/builders/lesson-read.builder"
import { AttemptOpenerService, AttemptReadService } from "@modules/domain/attempt"
import { ExperienceReadService } from "@modules/domain/career"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { LessonReadService } from "@modules/domain/lesson"
import { ProjectReadService } from "@modules/domain/project"
import { ReviewQueueService } from "@modules/domain/review"
import { STREAK_SHARD_IDS, StreakService, type StreakSummary } from "@modules/domain/streak"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { PROGRESS_HARNESS, type ProgressHarnessPort } from "./progress-harness.port"
import { ProgressLogEvent } from "./progress.log-events"
import type { HarnessSource } from "./progress.contracts"
import { ProgressService } from "./progress.service"

const LEARNER = "20000000-0000-4000-8000-000000000009"

const STREAK: StreakSummary = {
    today: "2026-11-17",
    current: 5,
    longest: 8,
    todayCounted: true,
    todayShards: [],
    days: [],
    week: { activeDays: 2, goal: 4 },
    freezes: { held: 1 },
    shardCounters: STREAK_SHARD_IDS.map((shard) => ({ shard, current: 0, longest: 0, activeDaysLast30: 0 })),
    badges: [],
    reminder: null,
}

const HARNESS: HarnessSource = {
    builds: [{ id: "agent-cli", title: "Agent", stages: [{ id: "s1", title: "Loop", state: "proved" }] }],
    doctor: [{ tool: "claude", passed: 3, total: 4, failed: 1 }],
    trials: [],
    events: [],
}

type Doubles = {
    readonly harness: jest.Mocked<ProgressHarnessPort>
    readonly streaks: jest.Mocked<StreakService>
    readonly reviews: jest.Mocked<ReviewQueueService>
    readonly lessons: jest.Mocked<LessonReadService>
    readonly openers: jest.Mocked<AttemptOpenerService>
    readonly attempts: jest.Mocked<AttemptReadService>
    readonly projects: jest.Mocked<ProjectReadService>
    readonly experience: jest.Mocked<ExperienceReadService>
}

/** The answers of every capability for a learner who finished one of two lessons. */
const answer = (d: Doubles): void => {
    d.harness.read.mockResolvedValue(HARNESS)
    d.streaks.summary.mockResolvedValue(STREAK)
    d.reviews.summary.mockResolvedValue({
        date: "2026-11-17",
        due: 4,
        overdue: 1,
        newAvailable: 0,
        goalDaily: 10,
        doneToday: 2,
    })
    d.lessons.catalog.mockResolvedValue([catalogItemOf("l1", "One"), catalogItemOf("l2", "Two")])
    d.openers.scores.mockResolvedValue([
        { lessonId: "l1", answered: 5, firstCorrect: 2, latestCorrect: 4, questions: [] },
        { lessonId: "l2", answered: 0, firstCorrect: 0, latestCorrect: 0, questions: [] },
    ])
    d.attempts.progress.mockImplementation(({ lessonId }) =>
        Promise.resolve({
            ...progressOf(lessonId, lessonId === "l1" ? 3 : 0),
            completedAt: lessonId === "l1" ? "2026-11-16T08:00:00.000Z" : null,
        }),
    )
    d.projects.list.mockResolvedValue([])
    d.projects.provedConcepts.mockResolvedValue([])
    d.experience.mine.mockResolvedValue({ items: [], hiringMinVerified: 3 })
}

const build = async (isPremium: boolean) => {
    const entitlement = mock<EntitlementService>()
    entitlement.openEssentialParts.mockReturnValue(
        isPremium ? ["1-essential", "2-source", "3-scenarios", "4-apply"] : ["1-essential"],
    )
    const harness = mock<ProgressHarnessPort>()
    const streaks = mock<StreakService>()
    const reviews = mock<ReviewQueueService>()
    const lessons = mock<LessonReadService>()
    const openers = mock<AttemptOpenerService>()
    const attempts = mock<AttemptReadService>()
    const projects = mock<ProjectReadService>()
    const experience = mock<ExperienceReadService>()
    const logger = mock<Logger>()
    entitlement.isPremium.mockResolvedValue(isPremium)
    answer({ harness, streaks, reviews, lessons, openers, attempts, projects, experience })
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProgressService,
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: StreakService, useValue: streaks },
            { provide: ReviewQueueService, useValue: reviews },
            { provide: LessonReadService, useValue: lessons },
            { provide: AttemptReadService, useValue: attempts },
            { provide: AttemptOpenerService, useValue: openers },
            { provide: ProjectReadService, useValue: projects },
            { provide: ExperienceReadService, useValue: experience },
            { provide: PROGRESS_HARNESS, useValue: harness },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(ProgressService), harness, reviews, attempts, projects, experience, logger }
}

type ProjectList = Awaited<ReturnType<ProjectReadService["list"]>>
type MyExperience = Awaited<ReturnType<ExperienceReadService["mine"]>>

const summaryOf = (id: string): ProjectList[number] => ({
    id,
    name: "Shop",
    kind: "app",
    topic: "api",
    language: "ts",
    stack: "nest",
    track: null,
    repoUrl: null,
    deployedUrl: null,
    provedConceptCount: 2,
    practisingConceptCount: 3,
    latestCiStatus: "none",
    latestCiAt: null,
    conceptCount: 6,
    currentMilestoneId: null,
    doneMilestoneCount: 1,
    milestoneCount: 3,
    createdAt: "2026-11-01T00:00:00.000Z",
})

const experienceOf = (part: string, itemId: string): MyExperience["items"][number] => ({
    itemId,
    verificationCode: `code-${itemId}`,
    itemType: "type",
    part: part === "practice" ? "practice" : "essentials",
    output: "cv-line",
    subject: "subject",
    projectId: null,
    state: "verified",
    line: { vi: "Dong vi", en: "Line en" },
    draftLine: null,
    evidence: [],
    grade: null,
    returnNote: null,
    returnCount: 0,
    dueAt: null,
    signature: { role: "TEACHER", signedAt: "2026-11-16T00:00:00.000Z" },
    revokedAt: null,
    shownPublicly: true,
    defenseQuestions: [],
    updatedAt: "2026-11-16T00:00:00.000Z",
})

describe("ProgressService read", () => {
    it("builds the page from the streak, review, lessons with their opener and the harness", async () => {
        const { service } = await build(false)

        const view = await service.read(LEARNER, "en")

        expect(view.plan).toBe("free")
        expect(view.ribbon).toMatchObject({ streak: 5, lessonsDone: 1 })
        expect(view.essentials).toMatchObject({
            lessonsTotal: 2,
            lessonsDone: 1,
            lessonsStarted: 1,
            beforeCorrect: 2,
            afterCorrect: 4,
        })
        expect(view.review).toMatchObject({ due: 4, overdue: 1, streak: 5 })
        expect(view.harness).toMatchObject({ buildsDone: 1, buildsTotal: 1 })
        expect(view.unavailable).toEqual([])
    })

    it("does not read projects for a learner without a subscription, and says they are locked", async () => {
        const { service, projects } = await build(false)

        const view = await service.read(LEARNER, "vi")

        expect(projects.list).not.toHaveBeenCalled()
        expect(view.projects).toBeNull()
        expect(view.projectsLocked).toBe(true)
    })

    it("reads each project of a subscriber with its practising concepts and the concepts proved", async () => {
        const { service, projects } = await build(true)
        projects.list.mockResolvedValue([summaryOf("p1")])
        projects.provedConcepts.mockResolvedValue([
            { projectId: "p1", conceptId: "idempotency", provedAt: "2026-11-17T00:00:00.000Z" },
        ])

        const view = await service.read(LEARNER, "vi")

        expect(view.projects).toMatchObject({
            conceptsProved: 2,
            conceptsPractising: 3,
            conceptsTotal: 6,
            milestonesDone: 1,
        })
        expect(view.ribbon.provedConcepts).toBe(1)
        expect(view.activity[0]).toMatchObject({ kind: "concept-proved" })
    })
})

describe("ProgressService read sources", () => {
    it("lists a source that failed, logs it and still answers with the rest", async () => {
        const { service, reviews, harness, logger } = await build(false)
        const cause = new Error("review down")
        reviews.summary.mockRejectedValue(cause)
        harness.read.mockRejectedValue(new Error("harness down"))

        const view = await service.read(LEARNER, "vi")

        expect(view.unavailable.toSorted()).toEqual(["harness", "review"])
        expect(view.review).toMatchObject({ due: 0, streak: 5 })
        expect(view.harness).toBeNull()
        expect(view.essentials).not.toBeNull()
        expect(logger.error).toHaveBeenCalledWith(ProgressLogEvent.SourceFailed, cause, { source: "review" })
    })

    it("counts a lesson whose progress cannot be read as not finished and logs it", async () => {
        const { service, logger, attempts } = await build(false)
        const cause = new Error("gone")
        attempts.progress.mockRejectedValue(cause)

        const view = await service.read(LEARNER, "vi")

        expect(view.essentials?.lessonsDone).toBe(0)
        expect(view.essentials?.lessonsStarted).toBe(1)
        expect(logger.error).toHaveBeenCalledWith(ProgressLogEvent.LessonFailed, cause, { lessonId: "l1" })
    })

    it("words a verified item in the asked locale and leaves an unsigned one out", async () => {
        const { service, experience } = await build(false)
        experience.mine.mockResolvedValue({
            hiringMinVerified: 3,
            items: [experienceOf("essentials", "i1"), { ...experienceOf("practice", "i2"), signature: null }],
        })

        const view = await service.read(LEARNER, "en")

        const verified = view.activity.filter((line) => line.kind === "experience-verified")
        expect(verified.map((line) => line.id)).toEqual(["item:i1"])
        expect(verified[0]?.title).toBe("Line en")
    })
})
