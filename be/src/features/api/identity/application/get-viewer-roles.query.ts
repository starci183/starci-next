import { Query } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetViewerRolesRequest } from "./get-viewer-roles.contracts"

/** Asks for the roles of the signed-in account. */
export class GetViewerRolesQuery extends Query<ReadonlyArray<string>> {
    constructor(readonly params: ExecuteParams<GetViewerRolesRequest>) {
        super()
    }
}
