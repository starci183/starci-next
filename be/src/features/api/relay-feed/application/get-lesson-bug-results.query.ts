import { Query } from "@nestjs/cqrs"
import type { LessonBugResult } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonBugResultsRequest } from "./get-lesson-bug-results.contracts"

/** Asks for every Tìm sạn test of one lesson with the learner's newest run and what it earned. */
export class GetLessonBugResultsQuery extends Query<ReadonlyArray<LessonBugResult>> {
    constructor(readonly params: ExecuteParams<GetLessonBugResultsRequest>) {
        super()
    }
}
