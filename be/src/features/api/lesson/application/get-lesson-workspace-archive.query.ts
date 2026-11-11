import { Query } from "@nestjs/cqrs"
import type { LessonArchiveView } from "@modules/domain/lesson"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonWorkspaceArchiveRequest } from "./get-lesson-workspace-archive.contracts"

/** Asks for the ZIP of one language workspace of a lesson on behalf of a signed-in learner. */
export class GetLessonWorkspaceArchiveQuery extends Query<LessonArchiveView> {
    constructor(readonly params: ExecuteParams<GetLessonWorkspaceArchiveRequest>) {
        super()
    }
}
