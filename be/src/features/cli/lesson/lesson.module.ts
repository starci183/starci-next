import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./lesson.module-definition"
import { LessonCli } from "./lesson.cli"
import { ImportLessonsCli } from "./subs/import.cli"

@Module({ providers: [LessonCli, ImportLessonsCli] })
/** The lesson group: its command and its sub-commands; the import itself is the lesson capability's service. */
export class LessonCliModule extends ConfigurableModuleClass {}
