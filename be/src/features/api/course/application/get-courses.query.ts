import { Query } from "@nestjs/cqrs"
import type { CourseCatalogEntryView } from "@modules/domain/course"
import type { ExecuteParams } from "@modules/platform/cqrs"

/** Asks for the course catalog: every course with its lessons, for the signed-in learner. */
export class GetCoursesQuery extends Query<ReadonlyArray<CourseCatalogEntryView>> {
    constructor(readonly params: ExecuteParams<Record<string, never>>) {
        super()
    }
}
