import { Query } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonPartsProgressRequest, LessonPartsProgressView } from "./get-lesson-parts-progress.contracts"

/** Asks for the four-part progress of the signed-in learner in some lessons. */
export class GetLessonPartsProgressQuery extends Query<ReadonlyArray<LessonPartsProgressView>> {
    constructor(readonly params: ExecuteParams<GetLessonPartsProgressRequest>) {
        super()
    }
}
