import { Query } from "@nestjs/cqrs"
import type { CourseLabView } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CourseLabRequest } from "./course-lab.contracts"

/** Asks for the lab of one lesson of a course, for the signed-in learner. */
export class GetCourseLabQuery extends Query<CourseLabView> {
    constructor(readonly params: ExecuteParams<CourseLabRequest>) {
        super()
    }
}
