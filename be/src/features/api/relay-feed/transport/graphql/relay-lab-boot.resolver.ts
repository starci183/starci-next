import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayLabBootInput } from "./dto/relay-lab-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toLabBootParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayLabBoot for a paired device (bearer device token); idempotent per client event id. */
export class RelayLabBootResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records one boot stage of the lab on the device. */
    @Mutation(() => RelayUploadType, { name: "relayLabBoot" })
    @Credential({ kind: "tool-token" })
    async relayLabBoot(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabBootInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(new UploadRelayEventCommand(toLabBootParams(credential, input)))
        return toRelayUploadType(result)
    }
}
