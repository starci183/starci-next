import { Query } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonPartsProgressRequest } from "./get-lesson-parts-progress.contracts"
import type { LessonPartsProgressView } from "./lesson-parts-progress.view"

/** Asks for the four-part progress of the signed-in learner in some lessons. */
export class GetLessonPartsProgressQuery extends Query<ReadonlyArray<LessonPartsProgressView>> {
    constructor(readonly params: ExecuteParams<GetLessonPartsProgressRequest>) {
        super()
    }
}
