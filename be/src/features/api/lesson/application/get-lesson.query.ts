import { Query } from "@nestjs/cqrs"
import type { LessonView } from "@modules/domain/lesson"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonRequest } from "./get-lesson.contracts"

/** Asks for the public projection of one live lesson on behalf of a signed-in learner. */
export class GetLessonQuery extends Query<LessonView> {
    constructor(readonly params: ExecuteParams<GetLessonRequest>) {
        super()
    }
}
