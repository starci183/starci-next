import { Module } from "@nestjs/common"
import { GetCourseCasesHandler } from "./application/get-course-cases.handler"
import { GetCourseLessonHandler } from "./application/get-course-lesson.handler"
import { OpenCourseHintHandler } from "./application/open-course-hint.handler"
import { ConfigurableModuleClass } from "./course.module-definition"

@Module({
    providers: [GetCourseLessonHandler, GetCourseCasesHandler, OpenCourseHintHandler],
})
/** Application handlers of the course feature: the lab of a lesson, the learner's cases and the hints they open. */
export class CourseApiModule extends ConfigurableModuleClass {}
