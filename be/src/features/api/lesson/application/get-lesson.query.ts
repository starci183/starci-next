import { Query } from "@nestjs/cqrs"
import type { LessonView } from "@modules/domain/lesson"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonRequest } from "./get-lesson.contracts"

/** Asks for the public projection of one live lesson for a learner or a guest. */
export class GetLessonQuery extends Query<LessonView> {
    constructor(readonly params: GuestExecuteParams<GetLessonRequest>) {
        super()
    }
}
