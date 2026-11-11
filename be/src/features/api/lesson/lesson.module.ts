import { Module } from "@nestjs/common"
import { GetLessonWorkspaceArchiveHandler } from "./application/get-lesson-workspace-archive.handler"
import { GetLessonTopicHandler } from "./application/get-lesson-topic.handler"
import { GetLessonHandler } from "./application/get-lesson.handler"
import { ListLessonsHandler } from "./application/list-lessons.handler"
import { ConfigurableModuleClass } from "./lesson.module-definition"

@Module({ providers: [ListLessonsHandler, GetLessonHandler, GetLessonTopicHandler, GetLessonWorkspaceArchiveHandler] })
/** Application handlers of the lesson feature: the catalog and one lesson's public projection. */
export class LessonApiModule extends ConfigurableModuleClass {}
