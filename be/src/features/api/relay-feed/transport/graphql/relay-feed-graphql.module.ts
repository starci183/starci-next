import { Module } from "@nestjs/common"
import { RelayFeedApiModule } from "../../relay-feed.module"
import { GetRelayManifestResolver } from "./get-relay-manifest.resolver"
import { RelayCheckStartedResolver } from "./relay-check-started.resolver"
import { RelayCheckResultResolver } from "./relay-check-result.resolver"
import { RelayLogResolver } from "./relay-log.resolver"
import { RelayManifestAckResolver } from "./relay-manifest-ack.resolver"
import { ConfigurableModuleClass } from "./relay-feed-graphql.module-definition"

@Module({
    imports: [RelayFeedApiModule.register({})],
    providers: [
        GetRelayManifestResolver,
        RelayCheckStartedResolver,
        RelayCheckResultResolver,
        RelayLogResolver,
        RelayManifestAckResolver,
    ],
})
/** The GraphQL transport of the relay feed, served by the core app: the signed manifest read and the four upload mutations. */
export class RelayFeedGraphqlModule extends ConfigurableModuleClass {}
