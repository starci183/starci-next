import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetRelayManifestQuery } from "../../application/get-relay-manifest.query"
import { RelayManifestInput } from "./dto/relay-manifest.input"
import { RelayManifestType } from "./dto/relay-manifest.type"
import { toGetRelayManifestParams, toRelayManifestType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL door of relayManifest for a paired device (bearer device token). */
export class GetRelayManifestResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Issues the signed manifest of a task to the device and pushes it to the device's socket. */
    @Query(() => RelayManifestType, { name: "relayManifest" })
    @Credential({ kind: "tool-token" })
    async relayManifest(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayManifestInput,
    ): Promise<RelayManifestType> {
        const result = await this.queryBus.execute(
            new GetRelayManifestQuery(toGetRelayManifestParams(credential, input)),
        )
        return toRelayManifestType(result)
    }
}
