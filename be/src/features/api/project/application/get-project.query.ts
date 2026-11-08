import { Query } from "@nestjs/cqrs"
import type { ProjectView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectRequest } from "./get-project.contracts"

/** Reads one project of the signed-in learner with its milestones, practice and proof. */
export class GetProjectQuery extends Query<ProjectView> {
    constructor(readonly params: ExecuteParams<GetProjectRequest>) {
        super()
    }
}
