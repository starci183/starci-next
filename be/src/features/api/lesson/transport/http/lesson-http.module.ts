import { Module } from "@nestjs/common"
import { LessonApiModule } from "../../lesson.module"
import { ConfigurableModuleClass } from "./lesson-http.module-definition"
import { LessonWorkspaceArchiveController } from "./lesson-workspace-archive.controller"

@Module({ imports: [LessonApiModule.register({})], controllers: [LessonWorkspaceArchiveController] })
/** Serves the lesson files a browser downloads: the workspace archive. */
export class LessonHttpModule extends ConfigurableModuleClass {}
