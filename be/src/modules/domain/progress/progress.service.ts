import { Injectable } from "@nestjs/common"
import { AttemptOpenerService, AttemptReadService } from "@modules/domain/attempt"
import { ExperienceReadService } from "@modules/domain/career"
import { EntitlementService, InjectEntitlementService } from "@modules/domain/entitlement"
import { LessonReadService } from "@modules/domain/lesson"
import { ProjectReadService } from "@modules/domain/project"
import { ReviewQueueService } from "@modules/domain/review"
import { StreakService } from "@modules/domain/streak"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { InjectProgressHarness, type ProgressHarnessPort } from "./progress-harness.port"
import { essentialsPartOf } from "./progress-essentials.policy"
import { buildProgress } from "./progress-view.policy"
import type {
    EssentialsLessonSource,
    LearnerProgressView,
    ProgressLocale,
    ProgressSourceId,
    ProjectSource,
    ProvedConceptSource,
    ReviewSource,
    StreakSource,
    VerifiedItemSource,
} from "./progress.contracts"
import { ProgressLogEvent } from "./progress.log-events"

/** The most lessons the opener read scores in one call. */
const OPENER_BATCH = 50

@Injectable()
/**
 * The progress of a learner across the whole app: one read model over the streak, review, Essentials (lessons and their opener
 * before and after), the harness, projects and the verified experience. It stores nothing and owns no table; each source is read on
 * its own, so one that fails is logged and listed in `unavailable` while the page still answers.
 */
export class ProgressService {
    constructor(
        @InjectLogger() private readonly logger: Logger,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProgressHarness() private readonly harness: ProgressHarnessPort,
        private readonly streaks: StreakService,
        private readonly reviews: ReviewQueueService,
        private readonly lessons: LessonReadService,
        private readonly attempts: AttemptReadService,
        private readonly openers: AttemptOpenerService,
        private readonly projects: ProjectReadService,
        private readonly experience: ExperienceReadService,
    ) {}

    /** Builds the progress page of a learner in a locale. */
    async read(learnerId: string, locale: ProgressLocale): Promise<LearnerProgressView> {
        const failed: Array<ProgressSourceId> = []
        const settled = async <T>(source: ProgressSourceId, read: () => Promise<T>): Promise<T | null> => {
            try {
                return await read()
            } catch (cause) {
                this.logger.error(ProgressLogEvent.SourceFailed, cause, { source })
                failed.push(source)
                return null
            }
        }
        const isPremium = await this.entitlement.isPremium(learnerId)
        const [streak, review, lessons, harness, projects, verified] = await Promise.all([
            settled("streak", () => this.streakOf(learnerId)),
            settled("review", () => this.reviewOf(learnerId, locale)),
            settled("essentials", () => this.lessonsOf(learnerId, locale)),
            settled("harness", () => this.harness.read(learnerId, locale)),
            isPremium ? settled("projects", () => this.projectsOf(learnerId, locale)) : Promise.resolve(null),
            settled("experience", () => this.verifiedOf(learnerId, locale)),
        ])
        return buildProgress({
            plan: isPremium ? "premium" : "free",
            openParts: this.entitlement.openEssentialParts(isPremium).flatMap((part) => essentialsPartOf(part) ?? []),
            streak,
            review,
            lessons,
            harness,
            projects: projects === null ? null : projects.list,
            proved: [...(projects?.proved ?? [])].sort((a, b) => (a.provedAt < b.provedAt ? 1 : -1)),
            verified: verified ?? [],
            unavailable: [...new Set(failed)],
        })
    }

    private async streakOf(learnerId: string): Promise<StreakSource> {
        const summary = await this.streaks.summary(learnerId)
        return { current: summary.current, longest: summary.longest, todayCounted: summary.todayCounted }
    }

    private async reviewOf(learnerId: string, locale: ProgressLocale): Promise<ReviewSource> {
        const summary = await this.reviews.summary(learnerId, locale)
        return {
            due: summary.due,
            overdue: summary.overdue,
            doneToday: summary.doneToday,
            goalDaily: summary.goalDaily,
        }
    }

    private async verifiedOf(learnerId: string, locale: ProgressLocale): Promise<Array<VerifiedItemSource>> {
        const mine = await this.experience.mine({ learnerId, state: "verified" })
        return mine.items.flatMap((item): Array<VerifiedItemSource> => {
            const line = item.line ?? item.draftLine
            return item.signature === null
                ? []
                : [{ itemId: item.itemId, title: line?.[locale] ?? item.subject, signedAt: item.signature.signedAt }]
        })
    }

    private async projectsOf(
        learnerId: string,
        locale: ProgressLocale,
    ): Promise<{ readonly list: ReadonlyArray<ProjectSource>; readonly proved: ReadonlyArray<ProvedConceptSource> }> {
        const [summaries, proved] = await Promise.all([
            this.projects.list({ learnerId, locale }),
            this.projects.provedConcepts(learnerId),
        ])
        const list = summaries.map((summary): ProjectSource => ({
            id: summary.id,
            name: summary.name,
            provedConcepts: summary.provedConceptCount,
            practisingConcepts: summary.practisingConceptCount,
            totalConcepts: summary.conceptCount,
            doneMilestones: summary.doneMilestoneCount,
            totalMilestones: summary.milestoneCount,
        }))
        return { list, proved }
    }

    private async lessonsOf(learnerId: string, locale: ProgressLocale): Promise<Array<EssentialsLessonSource>> {
        const catalog = await this.lessons.catalog({
            locale,
            group: null,
            topic: null,
            category: null,
            difficulty: null,
            language: null,
            provider: null,
            q: null,
        })
        const ids = catalog.map((lesson) => lesson.id)
        const batches = Array.from({ length: Math.ceil(ids.length / OPENER_BATCH) }, (_batch, index) =>
            ids.slice(index * OPENER_BATCH, (index + 1) * OPENER_BATCH),
        )
        const scored = await Promise.all(batches.map((lessonIds) => this.openers.scores({ learnerId, lessonIds })))
        const openers = new Map(scored.flat().map((score) => [score.lessonId, score]))
        const completions = new Map<string, { completedAt: string | null; started: boolean }>()
        await Promise.all(
            ids.map(async (lessonId) => {
                try {
                    const progress = await this.attempts.progress({ learnerId, lessonId, locale })
                    completions.set(lessonId, {
                        completedAt: progress.completedAt,
                        started: progress.attempts.total > 0,
                    })
                } catch (cause) {
                    this.logger.error(ProgressLogEvent.LessonFailed, cause, { lessonId })
                }
            }),
        )
        return catalog.map((lesson) => {
            const opener = openers.get(lesson.id)
            const done = completions.get(lesson.id)
            return {
                id: lesson.id,
                title: lesson.title,
                topicId: lesson.topic.id,
                topicTitle: lesson.topic.title,
                completedAt: done?.completedAt ?? null,
                started: (done?.started ?? false) || (opener?.answered ?? 0) > 0,
                opener: opener === undefined || opener.answered === 0 ? null : opener,
            }
        })
    }
}
