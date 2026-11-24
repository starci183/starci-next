import { Query } from "@nestjs/cqrs"
import type { CourseLessonView } from "@modules/domain/course"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetCourseLessonRequest } from "./course.contracts"

/** Asks for the lab@2 record of one lesson as the web may see it, for the signed-in learner. */
export class GetCourseLessonQuery extends Query<CourseLessonView> {
    constructor(readonly params: ExecuteParams<GetCourseLessonRequest>) {
        super()
    }
}
