import { QueryHandler } from "@nestjs/cqrs"
import { HarnessReadService, type HarnessBuildView } from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetHarnessBuildQuery } from "./get-harness-build.query"

@QueryHandler(GetHarnessBuildQuery)
/** Reads one build with its stages, steps and e2e states from the harness capability and the learner relayed results; free for everyone, no Premium question. */
export class GetHarnessBuildHandler extends ICQRSHandler<GetHarnessBuildQuery, HarnessBuildView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly harness: HarnessReadService,
        private readonly relay: RelayHarnessService,
    ) {
        super(logger)
    }

    protected override async process(query: GetHarnessBuildQuery): Promise<HarnessBuildView> {
        const learnerId = query.params.principal?.id
        const { locale, id } = query.params.request
        if (learnerId === undefined) return this.harness.build(undefined, locale, id, [])
        return this.harness.build(learnerId, locale, id, await this.relay.buildResults(learnerId))
    }
}
