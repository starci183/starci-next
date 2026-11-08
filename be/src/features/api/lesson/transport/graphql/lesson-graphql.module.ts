import { Module } from "@nestjs/common"
import { LessonApiModule } from "../../lesson.module"
import { ConfigurableModuleClass } from "./lesson-graphql.module-definition"
import { LessonTopicResolver } from "./lesson-topic.resolver"
import { LessonResolver } from "./lesson.resolver"
import { LessonsResolver } from "./lessons.resolver"

@Module({ imports: [LessonApiModule.register({})], providers: [LessonsResolver, LessonResolver, LessonTopicResolver] })
/** The GraphQL transport of the lesson feature: the catalog and one lesson. */
export class LessonGraphqlModule extends ConfigurableModuleClass {}
