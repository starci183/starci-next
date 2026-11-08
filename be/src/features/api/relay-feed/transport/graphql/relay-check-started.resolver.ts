import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayCheckStartedInput } from "./dto/relay-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toCheckStartedParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayCheckStarted for a paired device (bearer device token); idempotent per client event id. */
export class RelayCheckStartedResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records that a check of the manifest started on the device. */
    @Mutation(() => RelayUploadType, { name: "relayCheckStarted" })
    @Credential({ kind: "tool-token" })
    async relayCheckStarted(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayCheckStartedInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(
            new UploadRelayEventCommand(toCheckStartedParams(credential, input)),
        )
        return toRelayUploadType(result)
    }
}
