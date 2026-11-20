import { QueryHandler } from "@nestjs/cqrs"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetViewerRolesQuery } from "./get-viewer-roles.query"

@QueryHandler(GetViewerRolesQuery)
/** Answers the roles of the signed-in account; the doors that act on a role check it again. */
export class GetViewerRolesHandler extends ICQRSHandler<GetViewerRolesQuery, ReadonlyArray<string>> {
    constructor(@InjectLogger() logger: Logger) {
        super(logger)
    }

    protected override process(query: GetViewerRolesQuery): Promise<ReadonlyArray<string>> {
        return Promise.resolve(query.params.request.roles)
    }
}
