import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayLogInput } from "./dto/relay-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toLogParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayLog for a paired device (bearer device token); idempotent per client event id. */
export class RelayLogResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records a size-capped log chunk of a check. */
    @Mutation(() => RelayUploadType, { name: "relayLog" })
    @Credential({ kind: "tool-token" })
    async relayLog(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLogInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(new UploadRelayEventCommand(toLogParams(credential, input)))
        return toRelayUploadType(result)
    }
}
