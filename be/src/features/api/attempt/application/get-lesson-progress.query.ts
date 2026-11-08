import { Query } from "@nestjs/cqrs"
import type { LessonProgressView } from "@modules/domain/attempt"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonProgressRequest } from "./get-lesson-progress.contracts"

/** Asks for the progress of the signed-in learner in one lesson. */
export class GetLessonProgressQuery extends Query<LessonProgressView> {
    constructor(readonly params: ExecuteParams<GetLessonProgressRequest>) {
        super()
    }
}
