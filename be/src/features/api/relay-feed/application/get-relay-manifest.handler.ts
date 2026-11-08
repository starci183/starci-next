import { QueryHandler } from "@nestjs/cqrs"
import { RelayFeedService, type SignedManifest } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetRelayManifestQuery } from "./get-relay-manifest.query"

@QueryHandler(GetRelayManifestQuery)
/** Issues the signed manifest of a task to the device through one relay-feed call. */
export class GetRelayManifestHandler extends ICQRSHandler<GetRelayManifestQuery, SignedManifest> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly feed: RelayFeedService,
    ) {
        super(logger)
    }

    protected override process(query: GetRelayManifestQuery): Promise<SignedManifest> {
        return this.feed.manifest(query.params.request.device, query.params.request.taskId)
    }
}
