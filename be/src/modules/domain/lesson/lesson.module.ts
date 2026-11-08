import { Module, type DynamicModule } from "@nestjs/common"
import { lessonDirectory } from "./lesson-directory.client"
import { LESSON_SOURCE } from "./lesson-source.port"
import { DEFAULT_TOPIC_CATALOG } from "./lesson-topic-catalog.policy"
import { LESSON_TOPIC_CATALOG } from "./lesson.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./lesson.module-definition"
import { LessonContentService } from "./lesson-content.service"
import { LessonImportService } from "./lesson-import.service"
import { LessonLinkService } from "./lesson-link.service"
import { LessonReadService } from "./lesson-read.service"

@Module({})
/** The Lessons content capability: import of concept folders, the public projection and the server-side content port. */
export class LessonModule extends ConfigurableModuleClass {
    /** Registers the import, the learner reads and the content port. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                LessonImportService,
                LessonReadService,
                LessonContentService,
                LessonLinkService,
                { provide: LESSON_SOURCE, useValue: lessonDirectory },
                { provide: LESSON_TOPIC_CATALOG, useValue: options.topics ?? DEFAULT_TOPIC_CATALOG },
            ],
            exports: [LessonImportService, LessonReadService, LessonContentService, LessonLinkService],
        }
    }
}
