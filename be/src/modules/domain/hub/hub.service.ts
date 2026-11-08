import { Injectable } from "@nestjs/common"
import { AttemptReadService } from "@modules/domain/attempt"
import { LessonReadService } from "@modules/domain/lesson"
import { PathService } from "@modules/domain/path"
import { ReviewQueueService } from "@modules/domain/review"
import { StreakService } from "@modules/domain/streak"
import { InjectMessageCatalog, type MessageCatalog } from "@modules/platform/i18n"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { InjectHubExperience, type HubExperiencePort } from "./hub-experience.port"
import { buildHub } from "./hub-view.policy"
import type {
    HubActivePathSource,
    HubEssentialsSource,
    HubLocale,
    HubReviewSource,
    LearnerHubView,
} from "./hub.contracts"
import { HubLogEvent } from "./hub.log-events"

@Injectable()
/** The hub of a learner: the streak and every shard's own read, each with its own failure, none stored here. */
export class HubService {
    constructor(
        @InjectLogger() private readonly logger: Logger,
        @InjectMessageCatalog() private readonly messages: MessageCatalog,
        @InjectHubExperience() private readonly experience: HubExperiencePort,
        private readonly streaks: StreakService,
        private readonly reviews: ReviewQueueService,
        private readonly lessons: LessonReadService,
        private readonly attempts: AttemptReadService,
        private readonly paths: PathService,
    ) {}

    /** Builds the hub of a learner in a locale; a source that fails is logged and shows as unavailable, and the hub still answers. */
    async read(learnerId: string, locale: HubLocale): Promise<LearnerHubView> {
        const [streak, review, essentials, experience, activePath] = await Promise.all([
            this.streaks.summary(learnerId),
            this.settled("review", () => this.reviewOf(learnerId, locale)),
            this.settled("essentials", () => this.essentialsOf(learnerId, locale)),
            this.settled("experience", () => this.experience.counts(learnerId)),
            this.settled("path", () => this.activePathOf(learnerId, locale)),
        ])
        return buildHub({ streak, review, essentials, experience, activePath }, (key, params) =>
            this.messages.get(key, params ?? {}, locale),
        )
    }

    /** Reads one source; a source that fails is null and logged, so its card shows as unavailable. */
    private async settled<T>(source: string, read: () => Promise<T>): Promise<T | null> {
        try {
            return await read()
        } catch (cause) {
            this.logger.error(HubLogEvent.SourceFailed, cause, { source })
            return null
        }
    }

    private async reviewOf(learnerId: string, locale: HubLocale): Promise<HubReviewSource> {
        const summary = await this.reviews.summary(learnerId, locale)
        return { due: summary.due, doneToday: summary.doneToday, goalDaily: summary.goalDaily }
    }

    private activePathOf(learnerId: string, locale: HubLocale): Promise<HubActivePathSource | null> {
        return this.paths.active(learnerId, locale)
    }

    private async essentialsOf(learnerId: string, locale: HubLocale): Promise<HubEssentialsSource> {
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
        const progress = await Promise.all(
            catalog.map((lesson) =>
                this.settled("essentials-progress", () => this.attempts.progress({ learnerId, lessonId: lesson.id })),
            ),
        )
        return { started: progress.filter((entry) => (entry?.attempts.total ?? 0) > 0).length, total: catalog.length }
    }
}
