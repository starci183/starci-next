import { ConfigurableModuleBuilder, Module, type ConfigurableModuleHost } from "@nestjs/common"
import { RelayFeedApiModule } from "../../relay-feed.module"
import { CourseLabSourceController } from "./course-lab-source.controller"
import { HarnessPackController } from "./harness-pack.controller"
import { LessonSourceController } from "./lesson-source.controller"

/** The relay feed HTTP transport takes no options yet. */
export type RelayFeedHttpOptions = Record<string, never>

const built = new ConfigurableModuleBuilder<RelayFeedHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<RelayFeedHttpOptions, "register", "create", {}>

@Module({
    imports: [RelayFeedApiModule.register({})],
    controllers: [LessonSourceController, CourseLabSourceController, HarnessPackController],
})
/** The HTTP transport of the relay feed, served by the core app: the signed lesson source download (a byte transfer). */
export class RelayFeedHttpModule extends (built.ConfigurableModuleClass as Host["ConfigurableModuleClass"]) {}
