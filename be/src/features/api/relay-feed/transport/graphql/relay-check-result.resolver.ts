import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayCheckResultInput } from "./dto/relay-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toCheckResultParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayCheckResult for a paired device (bearer device token); idempotent per client event id. */
export class RelayCheckResultResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records the result of a check; a practice event, never proof. */
    @Mutation(() => RelayUploadType, { name: "relayCheckResult" })
    @Credential({ kind: "tool-token" })
    async relayCheckResult(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayCheckResultInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(
            new UploadRelayEventCommand(toCheckResultParams(credential, input)),
        )
        return toRelayUploadType(result)
    }
}
