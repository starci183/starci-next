import { Module } from "@nestjs/common"
import { LESSON_CONTENT_SERVICE, LessonContentService } from "@modules/domain/lesson-content"
import { LessonsCli } from "./lessons.cli"
import { ConfigurableModuleClass } from "./lessons.module-definition"
import { ImportLessonsCli } from "./subs/import.cli"

@Module({
    providers: [LessonsCli, ImportLessonsCli, { provide: LessonContentService, useExisting: LESSON_CONTENT_SERVICE }],
})
/** The lessons group: its command and its sub-commands; the import goes through the lesson-content capability. */
export class LessonsModule extends ConfigurableModuleClass {}
