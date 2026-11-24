import { Module } from "@nestjs/common"
import { GetCourseCasesHandler } from "./application/get-course-cases.handler"
import { GetCourseLessonHandler } from "./application/get-course-lesson.handler"
import { OpenCourseHintHandler } from "./application/open-course-hint.handler"
import { UploadCourseCaseHandler } from "./application/upload-course-case.handler"
import { ConfigurableModuleClass } from "./course.module-definition"

@Module({
    providers: [GetCourseLessonHandler, GetCourseCasesHandler, OpenCourseHintHandler, UploadCourseCaseHandler],
})
/** Application handlers of the course feature: the lab of a lesson, the learner's cases, the hints they open and the case events a paired device uploads. */
export class CourseApiModule extends ConfigurableModuleClass {}
