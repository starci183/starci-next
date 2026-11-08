import { Module, type DynamicModule } from "@nestjs/common"
import { reviewDirectory } from "./review-directory.client"
import { ReviewDeckService } from "./review-deck.service"
import { ReviewGradeService } from "./review-grade.service"
import { ReviewImportService } from "./review-import.service"
import { ReviewItemService } from "./review-item.service"
import { ReviewQueueService } from "./review-queue.service"
import { REVIEW_SCHEDULER } from "./review-scheduler.port"
import { ladderScheduler } from "./review-scheduler.policy"
import { ReviewScheduleService } from "./review-schedule.service"
import { REVIEW_SOURCE } from "./review-source.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./review.module-definition"

@Module({})
/** The review capability: deck import, the daily queue, items, self-grades, the ladder and the retrieval schedule. */
export class ReviewModule extends ConfigurableModuleClass {
    /** Registers the review services over the fixed ladder and the directory reader. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                { provide: REVIEW_SOURCE, useValue: reviewDirectory },
                { provide: REVIEW_SCHEDULER, useValue: ladderScheduler },
                ReviewImportService,
                ReviewQueueService,
                ReviewItemService,
                ReviewGradeService,
                ReviewDeckService,
                ReviewScheduleService,
            ],
            exports: [
                ReviewImportService,
                ReviewQueueService,
                ReviewItemService,
                ReviewGradeService,
                ReviewDeckService,
                ReviewScheduleService,
            ],
        }
    }
}
