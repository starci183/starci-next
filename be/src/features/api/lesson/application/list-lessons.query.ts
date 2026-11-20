import { Query } from "@nestjs/cqrs"
import type { LessonCatalogItemView } from "@modules/domain/lesson"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { ListLessonsRequest } from "./list-lessons.contracts"

/** Asks for the live lessons a learner or a guest may browse. */
export class ListLessonsQuery extends Query<ReadonlyArray<LessonCatalogItemView>> {
    constructor(readonly params: GuestExecuteParams<ListLessonsRequest>) {
        super()
    }
}
