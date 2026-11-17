import { Query } from "@nestjs/cqrs"
import type { PracticeSubmissionsPageView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticeSubmissionsRequest } from "./list-practice-submissions.contracts"

/** Asks for one page of the graded submits the caller sent in one pattern, newest first. */
export class ListPracticeSubmissionsQuery extends Query<PracticeSubmissionsPageView> {
    constructor(readonly params: ExecuteParams<ListPracticeSubmissionsRequest>) {
        super()
    }
}
