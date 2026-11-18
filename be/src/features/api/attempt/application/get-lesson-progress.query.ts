import { Query } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonProgressRequest, LessonProgressWithReads } from "./get-lesson-progress.contracts"

/** Asks for the progress of the signed-in learner in one lesson. */
export class GetLessonProgressQuery extends Query<LessonProgressWithReads> {
    constructor(readonly params: ExecuteParams<GetLessonProgressRequest>) {
        super()
    }
}
