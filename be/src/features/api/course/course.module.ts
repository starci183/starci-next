import { Module } from "@nestjs/common"
import { GetCourseCasesHandler } from "./application/get-course-cases.handler"
import { GetCourseHandler } from "./application/get-course.handler"
import { GetCoursesHandler } from "./application/get-courses.handler"
import { GetCourseLessonHandler } from "./application/get-course-lesson.handler"
import { GetCourseRungHandler } from "./application/get-course-rung.handler"
import { OpenCourseHintHandler } from "./application/open-course-hint.handler"
import { ResetCourseRungHandler } from "./application/reset-course-rung.handler"
import { UploadCourseCaseHandler } from "./application/upload-course-case.handler"
import { ConfigurableModuleClass } from "./course.module-definition"

@Module({
    providers: [
        GetCourseLessonHandler,
        GetCoursesHandler,
        GetCourseHandler,
        GetCourseCasesHandler,
        OpenCourseHintHandler,
        UploadCourseCaseHandler,
        GetCourseRungHandler,
        ResetCourseRungHandler,
    ],
})
/** Application handlers of the course feature: the catalog, the lab of a lesson, the learner's cases, the hints they open, the case events a paired device uploads and the ladder rungs it fetches one at a time. */
export class CourseApiModule extends ConfigurableModuleClass {}
