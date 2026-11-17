import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./career.module-definition"
import { EssentialsExperienceService } from "./essentials-experience.service"
import { EmptyPracticeClient } from "./empty-practice.client"
import { ExperienceAuditService } from "./experience-audit.service"
import { EXPERIENCE_NOTIFIER } from "./experience-notifier.port"
import { EXPERIENCE_PRACTICE } from "./experience-practice.port"
import { EXPERIENCE_PRODUCER } from "./experience-producer.port"
import { ExperienceReadService } from "./experience-read.service"
import { ExperienceReviewService } from "./experience-review.service"
import { ExperienceSeedService } from "./experience-seed.service"
import { ExperienceService } from "./experience.service"
import { PracticeExperienceService } from "./practice-experience.service"
import { ReviewerService } from "./reviewer.service"
import { SilentNotifierClient } from "./silent-notifier.client"

@Module({})
/** The career capability: experience items, their review by the teacher and appointed reviewers, and public verification. */
export class CareerModule extends ConfigurableModuleClass {
    /** Registers the experience engine, binds its producer port and the notifier the app names. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const notifierClass = options.notifier ?? SilentNotifierClient
        const notifier: Provider = { provide: EXPERIENCE_NOTIFIER, useExisting: notifierClass }
        const practiceClass = options.practice ?? EmptyPracticeClient
        const practice: Provider = { provide: EXPERIENCE_PRACTICE, useExisting: practiceClass }
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                notifierClass,
                notifier,
                practiceClass,
                practice,
                ExperienceAuditService,
                ExperienceService,
                { provide: EXPERIENCE_PRODUCER, useExisting: ExperienceService },
                ExperienceReviewService,
                ExperienceReadService,
                ReviewerService,
                EssentialsExperienceService,
                PracticeExperienceService,
                ExperienceSeedService,
            ],
            exports: [
                EXPERIENCE_PRODUCER,
                ExperienceService,
                ExperienceReviewService,
                ExperienceReadService,
                ReviewerService,
                EssentialsExperienceService,
                PracticeExperienceService,
                ExperienceSeedService,
            ],
        }
    }
}
