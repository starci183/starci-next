import { Module } from "@nestjs/common"
import type { DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./lesson-content.module-definition"
import { LESSON_CONTENT_SERVICE } from "./lesson-content.decorators"
import { LessonContentService } from "./lesson-content.service"
import { LESSON_CONTENT_GRADING_SERVICE } from "./lesson-content-grading.decorators"
import { LessonContentGradingService } from "./lesson-content-grading.service"

@Module({})
/** The lesson-content capability over the primary database. */
export class LessonContentModule extends ConfigurableModuleClass {
    /** Registers the capability once per app. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                LessonContentService,
                { provide: LESSON_CONTENT_SERVICE, useExisting: LessonContentService },
                LessonContentGradingService,
                { provide: LESSON_CONTENT_GRADING_SERVICE, useExisting: LessonContentGradingService },
            ],
            exports: [LESSON_CONTENT_SERVICE, LESSON_CONTENT_GRADING_SERVICE],
        }
    }
}
