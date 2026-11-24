import { CourseCaseMarkEntity } from "./course-case-mark.entity"
import { CourseCaseRunEntity } from "./course-case-run.entity"
import { CourseLabEntity } from "./course-lab.entity"

export { CourseCaseMarkEntity, CourseCaseRunEntity, CourseLabEntity }

/** The entities of the course capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const courseEntities: ReadonlyArray<new () => object> = [
    CourseLabEntity,
    CourseCaseRunEntity,
    CourseCaseMarkEntity,
]
