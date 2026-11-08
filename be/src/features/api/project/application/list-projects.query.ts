import { Query } from "@nestjs/cqrs"
import type { ProjectSummaryView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListProjectsRequest } from "./list-projects.contracts"

/** Lists the projects of the signed-in learner, each with its progress. */
export class ListProjectsQuery extends Query<ReadonlyArray<ProjectSummaryView>> {
    constructor(readonly params: ExecuteParams<ListProjectsRequest>) {
        super()
    }
}
