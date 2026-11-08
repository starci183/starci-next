import { Query } from "@nestjs/cqrs"
import type { ProjectRepositoryView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectRepositoryRequest } from "./get-project-repository.contracts"

/** Reads the GitHub repository a learner's project is bound to, and the audience its CI asks the OIDC token for. */
export class GetProjectRepositoryQuery extends Query<ProjectRepositoryView> {
    constructor(readonly params: ExecuteParams<GetProjectRepositoryRequest>) {
        super()
    }
}
