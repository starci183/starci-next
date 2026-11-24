import { Query } from "@nestjs/cqrs"
import type { CourseRungFile } from "@modules/domain/course"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GetCourseRungRequest } from "./course-rung.contracts"

/** Asks for one rung of a case's reference diff (`rung:<tag>`, one file), for a paired device whose learner solved the case. */
export class GetCourseRungQuery extends Query<CourseRungFile> {
    constructor(readonly params: PublicExecuteParams<GetCourseRungRequest>) {
        super()
    }
}
