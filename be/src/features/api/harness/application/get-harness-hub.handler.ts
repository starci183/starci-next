import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessHubView } from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessHubQuery } from "./get-harness-hub.query"

@QueryHandler(GetHarnessHubQuery)
/** Reads the hub of /harness: its three parts with the learner counts from the harness capability and the learner relayed results; free for everyone, no Premium question. */
export class GetHarnessHubHandler extends ICQRSHandler<GetHarnessHubQuery, HarnessHubView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
        private readonly relay: RelayHarnessService,
    ) {
        super(logger)
    }

    protected override async process(query: GetHarnessHubQuery): Promise<HarnessHubView> {
        const learnerId = query.params.principal.id
        const [builds, doctor] = await Promise.all([
            this.relay.buildResults(learnerId),
            this.relay.doctorResults(learnerId),
        ])
        return this.harness.hub(learnerId, query.params.request.locale, builds, doctor)
    }
}
