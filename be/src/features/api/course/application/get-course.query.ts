import { Query } from "@nestjs/cqrs"
import type { CourseCatalogDetailView } from "@modules/domain/course"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetCourseRequest } from "./course.contracts"

/** Asks for one course of the catalog with the system map of its intro, for the signed-in learner. */
export class GetCourseQuery extends Query<CourseCatalogDetailView> {
    constructor(readonly params: ExecuteParams<GetCourseRequest>) {
        super()
    }
}
