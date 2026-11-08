import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayManifestAckInput } from "./dto/relay-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toManifestAckParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayManifestAck for a paired device (bearer device token); idempotent per client event id. */
export class RelayManifestAckResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records that the device took a pushed manifest. */
    @Mutation(() => RelayUploadType, { name: "relayManifestAck" })
    @Credential({ kind: "tool-token" })
    async relayManifestAck(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayManifestAckInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(
            new UploadRelayEventCommand(toManifestAckParams(credential, input)),
        )
        return toRelayUploadType(result)
    }
}
