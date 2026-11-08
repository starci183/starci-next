import { Query } from "@nestjs/cqrs"
import type { ProjectCatalogView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectCatalogRequest } from "./get-project-catalog.contracts"

/** Reads the milestones and concepts a project can pursue. */
export class GetProjectCatalogQuery extends Query<ProjectCatalogView> {
    constructor(readonly params: ExecuteParams<GetProjectCatalogRequest>) {
        super()
    }
}
