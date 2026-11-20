import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessBuildSummaryView } from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessBuildsQuery } from "./get-harness-builds.query"

@QueryHandler(GetHarnessBuildsQuery)
/** Reads the builds with the progress of each from the harness capability and the learner relayed results; free for everyone, no Premium question. */
export class GetHarnessBuildsHandler extends ICQRSHandler<
    GetHarnessBuildsQuery,
    ReadonlyArray<HarnessBuildSummaryView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
        private readonly relay: RelayHarnessService,
    ) {
        super(logger)
    }

    protected override async process(query: GetHarnessBuildsQuery): Promise<ReadonlyArray<HarnessBuildSummaryView>> {
        const learnerId = query.params.principal?.id
        if (learnerId === undefined) return this.harness.builds(undefined, query.params.request.locale, [])
        return this.harness.builds(learnerId, query.params.request.locale, await this.relay.buildResults(learnerId))
    }
}
