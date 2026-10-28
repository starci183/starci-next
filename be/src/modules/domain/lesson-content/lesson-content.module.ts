import { Module } from "@nestjs/common"
import type { DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./lesson-content.module-definition"
import { LESSON_CONTENT_SERVICE } from "./lesson-content.decorators"
import { LessonContentService } from "./lesson-content.service"

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
            ],
            exports: [LESSON_CONTENT_SERVICE],
        }
    }
}
