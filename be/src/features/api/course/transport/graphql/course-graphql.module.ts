import { Module } from "@nestjs/common"
import { CourseApiModule } from "../../course.module"
import { GetCourseCasesResolver } from "./get-course-cases.resolver"
import { GetCourseLessonResolver } from "./get-course-lesson.resolver"
import { OpenCourseHintResolver } from "./open-course-hint.resolver"
import { ConfigurableModuleClass } from "./course-graphql.module-definition"

@Module({
    imports: [CourseApiModule.register({})],
    providers: [GetCourseLessonResolver, GetCourseCasesResolver, OpenCourseHintResolver],
})
/** The GraphQL transport of the course feature: the lab of a lesson, the learner's cases and the hint door. */
export class CourseGraphqlModule extends ConfigurableModuleClass {}
