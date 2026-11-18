import { Module } from "@nestjs/common"
import { RelayFeedApiModule } from "../../relay-feed.module"
import { GetRelayManifestResolver } from "./get-relay-manifest.resolver"
import { LessonChallengeScoresResolver } from "./lesson-challenge-scores.resolver"
import { LessonPartsProgressResolver } from "./lesson-parts-progress.resolver"
import { RequestLessonRunResolver } from "./request-lesson-run.resolver"
import { LessonScenarioRunsResolver } from "./lesson-scenario-runs.resolver"
import { RelayCheckStartedResolver } from "./relay-check-started.resolver"
import { RelayCheckResultResolver } from "./relay-check-result.resolver"
import { RelayHarnessResultResolver } from "./relay-harness-result.resolver"
import { RelayLogResolver } from "./relay-log.resolver"
import { RelayManifestAckResolver } from "./relay-manifest-ack.resolver"
import { ConfigurableModuleClass } from "./relay-feed-graphql.module-definition"

@Module({
    imports: [RelayFeedApiModule.register({})],
    providers: [
        GetRelayManifestResolver,
        RelayCheckStartedResolver,
        RelayCheckResultResolver,
        RelayHarnessResultResolver,
        RelayLogResolver,
        RelayManifestAckResolver,
        LessonScenarioRunsResolver,
        LessonPartsProgressResolver,
        LessonChallengeScoresResolver,
        RequestLessonRunResolver,
    ],
})
/** The GraphQL transport of the relay feed, served by the core app: the signed manifest read and the four upload mutations. */
export class RelayFeedGraphqlModule extends ConfigurableModuleClass {}
