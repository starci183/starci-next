import { Query } from "@nestjs/cqrs"
import type { LessonCatalogItemView } from "@modules/domain/lesson"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListLessonsRequest } from "./list-lessons.contracts"

/** Asks for the live lessons a signed-in learner may browse. */
export class ListLessonsQuery extends Query<ReadonlyArray<LessonCatalogItemView>> {
    constructor(readonly params: ExecuteParams<ListLessonsRequest>) {
        super()
    }
}
