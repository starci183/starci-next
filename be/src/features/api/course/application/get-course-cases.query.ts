import { Query } from "@nestjs/cqrs"
import type { CourseCasesView } from "@modules/domain/course"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetCourseCasesRequest } from "./course.contracts"

/** Asks where the signed-in learner stands on every case of one lab. */
export class GetCourseCasesQuery extends Query<CourseCasesView> {
    constructor(readonly params: ExecuteParams<GetCourseCasesRequest>) {
        super()
    }
}
