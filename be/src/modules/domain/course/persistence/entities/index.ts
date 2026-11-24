import { CourseCaseMarkEntity } from "./course-case-mark.entity"
import { CourseCaseRunEntity } from "./course-case-run.entity"
import { CourseCourseEntity } from "./course-course.entity"
import { CourseLabEntity } from "./course-lab.entity"
import { CourseLabFileEntity } from "./course-lab-file.entity"

export { CourseCaseMarkEntity, CourseCaseRunEntity, CourseCourseEntity, CourseLabEntity, CourseLabFileEntity }

/** The entities of the course capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const courseEntities: ReadonlyArray<new () => object> = [
    CourseLabEntity,
    CourseLabFileEntity,
    CourseCourseEntity,
    CourseCaseRunEntity,
    CourseCaseMarkEntity,
]
