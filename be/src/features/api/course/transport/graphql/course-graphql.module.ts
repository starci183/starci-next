import { Module } from "@nestjs/common"
import { CourseApiModule } from "../../course.module"
import { GetCourseCasesResolver } from "./get-course-cases.resolver"
import { GetCourseResolver } from "./get-course.resolver"
import { GetCoursesResolver } from "./get-courses.resolver"
import { GetCourseLessonResolver } from "./get-course-lesson.resolver"
import { OpenCourseHintResolver } from "./open-course-hint.resolver"
import { RelayLabCaseResolver } from "./relay-lab-case.resolver"
import { RelayLabRungResolver } from "./relay-lab-rung.resolver"
import { ConfigurableModuleClass } from "./course-graphql.module-definition"

@Module({
    imports: [CourseApiModule.register({})],
    providers: [
        GetCourseLessonResolver,
        GetCoursesResolver,
        GetCourseResolver,
        GetCourseCasesResolver,
        OpenCourseHintResolver,
        RelayLabCaseResolver,
        RelayLabRungResolver,
    ],
})
/** The GraphQL transport of the course feature: the catalog, the lab of a lesson, the learner's cases, the hint door, the case upload doors and the rung doors of a paired device. */
export class CourseGraphqlModule extends ConfigurableModuleClass {}
